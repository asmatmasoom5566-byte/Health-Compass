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
        usernameField: 'phone', // Phone number is now the primary identifier
        passwordField: 'password',
      },
      async (phone, password, done) => {
        try {
          if (!phone || !password) {
            return done(null, false, { message: 'Missing credentials' });
          }

          console.log('🔍 Login attempt for phone:', phone);

          // Find user by phone
          const user = await storage.getUserByPhone(phone);

          if (!user) {
            console.log('❌ User not found with phone:', phone);
            return done(null, false, { message: 'Invalid credentials' });
          }

          console.log('✅ User found:', user.fullName, '| Status:', user.status);

          // Check user status - only reject if suspended or rejected
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

          // Verify password
          console.log('🔐 Verifying password...');
          console.log('📝 Password length:', password.length);
          console.log('📝 Password bytes:', Buffer.from(password).toString('hex'));
          console.log('🔑 Hash stored:', user.passwordHash);
          console.log('🔑 Hash length:', user.passwordHash?.length);
          
          const isValidPassword = await verifyPassword(password, user.passwordHash);

          if (!isValidPassword) {
            console.log('❌ Password verification failed');
            console.log('🔍 Trying direct verification test...');
            // Test if argon2.verify works at all
            const { hashPassword } = await import('../services/auth');
            const testHash = await hashPassword('test123');
            const testVerify = await verifyPassword('test123', testHash);
            console.log('🧪 Direct argon2 test:', testVerify ? 'WORKS' : 'BROKEN');
            return done(null, false, { message: 'Invalid credentials' });
          }

          console.log('✅ Password verified successfully');
          return done(null, user);
        } catch (error) {
          console.error('Login error:', error);
          return done(error);
        }
      }
    )
  );
}
