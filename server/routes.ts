import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { insertSearchHistorySchema, userRegistrationSchema, userLoginSchema, userStatusUpdateSchema, userRoleUpdateSchema, inviteCodeCreationSchema, profileUpdateSchema, passwordChangeSchema } from "@shared/schema";
import { chat } from "./replit_integrations/chat";
import passport from "passport";
import { hashPassword, generateToken, generateInviteCode, generateOTP } from "./services/auth";
import { sendVerificationEmail, sendApprovalNotification, sendRejectionNotification, sendInviteEmail } from "./services/email";
import { sendSMSOTP, formatPhoneNumber } from "./services/sms";
import { isAuthenticated, isApproved, isAdmin } from "./middleware/auth";
import { loginLimiter, registrationLimiter, verificationResendLimiter } from "./middleware/rate-limit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register AI Integrations
  try {
    registerChatRoutes(app);
  } catch (error) {
    console.warn('Chat routes not available:', (error as Error).message);
  }
  registerImageRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // User Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = userRegistrationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { fullName, phone, password, profession, country, clinicHospital, inviteCode } = result.data;

      // Check if invite code is required and validate
      const requireInvite = process.env.REQUIRE_INVITE_FOR_REGISTRATION === 'true';
      if (requireInvite && !inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' });
      }

      if (inviteCode) {
        const code = await storage.getInviteCode(inviteCode);
        if (!code) {
          return res.status(400).json({ error: 'Invalid invite code' });
        }
        if (!code.isActive) {
          return res.status(400).json({ error: 'Invite code is no longer active' });
        }
        if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
          return res.status(400).json({ error: 'Invite code has expired' });
        }
        if (code.usedCount >= code.maxUses) {
          return res.status(400).json({ error: 'Invite code has been used maximum times' });
        }
      }

      // Check if phone number already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Check if this is the first user (auto-assign admin)
      const userCount = await storage.getUserCount();
      const isFirstUser = userCount === 0;
      const autoVerifyFirstAdmin = process.env.AUTO_VERIFY_FIRST_ADMIN === 'true';

      const role = isFirstUser ? 'admin' : 'standard_member';
      const status = isFirstUser ? 'approved' : 'pending';

      // Create user
      const user = await storage.createUser({
        fullName,
        email: null,
        phone,
        passwordHash,
        profession,
        country: country || null,
        clinicHospital: clinicHospital || null,
        status,
        role,
        emailVerified: false,
        phoneVerified: isFirstUser && autoVerifyFirstAdmin,
        lastLoginIp: null,
      });

      // Update invite code usage if provided
      if (inviteCode) {
        await storage.updateInviteCodeUsage(inviteCode);
      }

      res.status(201).json({
        message: isFirstUser 
          ? 'Admin account created successfully' 
          : 'Registration successful. Please wait for admin approval.',
        userId: user.id,
        status: user.status,
        requiresVerification: !isFirstUser,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // User Login
  app.post("/api/auth/login", (req, res, next) => {
    const result = userLoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            status: user.status,
            role: user.role,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          },
        });
      });
    })(req, res, next);
  });

  // User Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
      });
    });
  });

  // Get Current User
  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });

  // Email Verification
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      const verificationToken = await storage.getVerificationToken(token, 'email_verification');
      if (!verificationToken) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      await storage.updateUser(verificationToken.userId, { emailVerified: true });
      await storage.deleteVerificationToken(token);

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  });

  // Phone Verification
  app.post("/api/auth/verify-phone", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const verificationToken = await storage.getVerificationToken(otp, 'phone_verification');
      if (!verificationToken || verificationToken.userId !== user.id) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      await storage.updateUser(user.id, { phoneVerified: true });
      await storage.deleteVerificationToken(otp);

      res.json({ message: 'Phone verified successfully' });
    } catch (error) {
      console.error('Phone verification error:', error);
      res.status(500).json({ error: 'Phone verification failed' });
    }
  });

  // Resend Verification
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email, phone } = req.body;

      if (email) {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (user.emailVerified) {
          return res.status(400).json({ error: 'Email already verified' });
        }

        const verificationToken = generateToken();
        const expiryHours = parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS || '24');
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        await storage.createVerificationToken({
          userId: user.id,
          token: verificationToken,
          type: 'email_verification',
          expiresAt,
        });

        await sendVerificationEmail(email, verificationToken, user.fullName);
        res.json({ message: 'Verification email sent' });
      } else if (phone) {
        const user = await storage.getUserByPhone(phone);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (user.phoneVerified) {
          return res.status(400).json({ error: 'Phone already verified' });
        }

        const otp = generateOTP();
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
        await storage.createVerificationToken({
          userId: user.id,
          token: otp,
          type: 'phone_verification',
          expiresAt: new Date(Date.now() + otpExpiryMinutes * 60 * 1000),
        });

        await sendSMSOTP(formatPhoneNumber(phone), otp);
        res.json({ message: 'Verification OTP sent' });
      } else {
        res.status(400).json({ error: 'Email or phone is required' });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification' });
    }
  });

  // Update Profile
  app.put("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const result = profileUpdateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const user = await storage.updateUser(req.user!.id, result.data);
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Profile update failed' });
    }
  });

  // Change Password
  app.put("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const result = passwordChangeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { verifyPassword } = await import("./services/auth");
      const isValidPassword = await verifyPassword(result.data.currentPassword, user.passwordHash);

      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const newPasswordHash = await hashPassword(result.data.newPassword);
      await storage.updateUser(user.id, { passwordHash: newPasswordHash });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  });

  // ==========================================
  // ADMIN ROUTES
  // ==========================================

  // Get All Users (Admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { search, status, role, profession, sortBy, sortOrder, page, limit } = req.query;

      const users = await storage.getAllUsers({
        search: search as string,
        status: status as string,
        role: role as string,
        profession: profession as string,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({ users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Update User Status (Admin only)
  app.put("/api/admin/users/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = userStatusUpdateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const userId = parseInt(req.params.id);
      const adminId = req.user!.id;

      const user = await storage.updateUserStatus(userId, result.data.status, adminId, result.data.reason);

      // Send notification email
      if (user.email) {
        if (result.data.status === 'approved') {
          await sendApprovalNotification(user.email, user.fullName);
        } else if (result.data.status === 'rejected') {
          await sendRejectionNotification(user.email, user.fullName, result.data.reason);
        }
      }

      res.json({ message: 'User status updated successfully', user });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  // Update User Role (Admin only)
  app.put("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = userRoleUpdateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, { role: result.data.role });

      res.json({ message: 'User role updated successfully', user });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // Delete User (Admin only)
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = (req.user as any).id;

      console.log(`🗑️  Delete request: Admin ${adminId} wants to delete user ${userId}`);

      // Prevent admin from deleting their own account
      if (userId === adminId) {
        console.log('❌ Self-deletion prevented');
        return res.status(403).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log('❌ User not found:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`📋 Found user to delete: ${user.email || user.phone} (${user.fullName})`);

      // Delete user
      await storage.deleteUser(userId);

      console.log(`✅ User ${user.email || user.phone} (ID: ${userId}) deleted by admin ${adminId}`);

      res.json({ 
        message: 'User deleted successfully',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }
      });
    } catch (error) {
      console.error('❌ Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Get Invite Codes (Admin only)
  app.get("/api/admin/invite-codes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isActive } = req.query;
      const codes = await storage.getAllInviteCodes({
        isActive: isActive ? isActive === 'true' : undefined,
      });

      res.json({ inviteCodes: codes });
    } catch (error) {
      console.error('Get invite codes error:', error);
      res.status(500).json({ error: 'Failed to fetch invite codes' });
    }
  });

  // Create Invite Code (Admin only)
  app.post("/api/admin/invite-codes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = inviteCodeCreationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const code = generateInviteCode();
      const inviteCode = await storage.createInviteCode({
        code,
        createdBy: req.user!.id,
        email: result.data.email || null,
        phone: result.data.phone || null,
        expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : null,
        maxUses: result.data.maxUses || 1,
        isActive: true,
      });

      // Send invite email if email provided
      if (result.data.email) {
        await sendInviteEmail(result.data.email, code, req.user!.fullName);
      }

      res.status(201).json({ message: 'Invite code created successfully', inviteCode });
    } catch (error) {
      console.error('Create invite code error:', error);
      res.status(500).json({ error: 'Failed to create invite code' });
    }
  });

  // Get Audit Trail (Admin only)
  app.get("/api/admin/audit-trail", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.query;
      const auditTrail = await storage.getStatusAuditTrail(
        userId ? parseInt(userId as string) : undefined
      );

      res.json({ auditTrail });
    } catch (error) {
      console.error('Get audit trail error:', error);
      res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
  });

  // ==========================================
  // EXISTING ROUTES (now protected)
  // ==========================================

  app.post("/api/analysis/start", isAuthenticated, isApproved, async (req, res) => {
    const { symptom } = req.body;
    if (!symptom) return res.status(400).json({ error: "Symptom required" });

    // Initial AI prompt to generate first OPD question
    // const prompt = `User reported symptom: "${symptom}". Generate a primary Onset, Precipitation, Duration (OPD) question for a doctor to ask. Keep it concise.`;
    // const aiResponse = await chat([{ role: "user", content: prompt }]);
    // const question = aiResponse.content;
    const question = "Please describe the onset, duration, and any factors that make the symptom better or worse?";

    const session = await storage.createAnalysisSession({
      initialSymptom: symptom,
      currentQuestion: question,
      answers: [],
      diagnosisScores: [],
      status: "active"
    });
    res.json(session);
  });

  app.post("/api/analysis/:id/answer", isAuthenticated, isApproved, async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body; // boolean
    const session = await storage.getAnalysisSession(id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const newAnswers = [...(session.answers || []), { question: session.currentQuestion!, answer }];
    
    // AI prompt for follow-up and scoring
    const causes = await storage.getCauses();
    const prompt = `Initial symptom: ${session.initialSymptom}. 
History of questions and answers: ${JSON.stringify(newAnswers)}.
Available conditions: ${JSON.stringify(causes.map(c => ({name: c.name, symptoms: c.symptoms})))}.
Based on this, either:
1. Generate the next follow-up question.
2. If enough info, return "COMPLETED" followed by a JSON array of the top 3 potential conditions with confidence scores (0-100).
Return ONLY the question or "COMPLETED: [JSON]"`;

    // const aiResponse = await chat([{ role: "user", content: prompt }]);
    // const content = aiResponse.content;
    const content = 'COMPLETED: [{"name": "Common Cold", "confidence": 85}, {"name": "Allergic Rhinitis", "confidence": 60}]';

    if (content.startsWith("COMPLETED")) {
      const scores = JSON.parse(content.replace("COMPLETED:", "").trim());
      const updated = await storage.updateAnalysisSession(id, {
        answers: newAnswers,
        diagnosisScores: scores,
        status: "completed",
        currentQuestion: null
      });
      res.json(updated);
    } else {
      const updated = await storage.updateAnalysisSession(id, {
        answers: newAnswers,
        currentQuestion: content,
        status: "active"
      });
      res.json(updated);
    }
  });

  app.get("/api/causes", async (req, res) => {
    try {
      const causes = await storage.getCauses();
      res.json({ causes });
    } catch (error) {
      console.error("Error fetching causes:", error);
      res.status(500).json({ error: "Failed to fetch causes" });
    }
  });

  app.post("/api/causes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const newCause = await storage.createCause(req.body);
      res.status(201).json(newCause);
    } catch (error) {
      console.error("Error creating cause:", error);
      res.status(500).json({ error: "Failed to create cause" });
    }
  });

  app.get("/api/search-history", async (req, res) => {
    const history = await storage.getSearchHistory();
    res.json(history);
  });

  app.post("/api/search-history", async (req, res) => {
    const result = insertSearchHistorySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid search history data" });
    }
    const history = await storage.addSearchHistory(result.data);
    res.json(history);
  });

  return httpServer;
}
