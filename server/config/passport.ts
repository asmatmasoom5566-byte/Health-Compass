import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from '../storage';
import { verifyPassword } from '../services/auth';
import type { User } from '@shared/schema';

// Serialize user ID to session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

// Deserialize user from database
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user || false);
  } catch (error) {
    done(error, null);
  }
});

// Configure Passport local strategy
export function configurePassport() {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email', // We'll handle both email and phone in the verify callback
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req, identifier, password, done) => {
        try {
          const { email, phone } = req.body;
          const loginIdentifier = email || phone;

          if (!loginIdentifier) {
            return done(null, false, { message: 'Email or phone is required' });
          }

          // Find user by email or phone
          let user = email 
            ? await storage.getUserByEmail(email)
            : await storage.getUserByPhone(phone);

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          // Check user status
          if (user.status === 'pending') {
            return done(null, false, { 
              message: 'Account pending approval. Please wait for administrator approval.' 
            });
          }

          if (user.status === 'rejected') {
            return done(null, false, { 
              message: 'Account has been rejected. Please contact support.' 
            });
          }

          if (user.status === 'suspended') {
            return done(null, false, { 
              message: 'Account has been suspended. Please contact support.' 
            });
          }

          // Check verification status
          const hasVerifiedContact = 
            (email && user.emailVerified) || (phone && user.phoneVerified);

          if (!hasVerifiedContact) {
            return done(null, false, { 
              message: 'Please verify your email or phone number before logging in.' 
            });
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.passwordHash);

          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          // Update last login
          await storage.updateUser(user.id, {
            lastLoginAt: new Date(),
            lastLoginIp: req.ip || req.socket.remoteAddress,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}
