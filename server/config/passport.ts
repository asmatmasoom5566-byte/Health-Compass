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

          // Find user by phone
          const user = await storage.getUserByPhone(phone);

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

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
          const isValidPassword = await verifyPassword(password, user.passwordHash);

          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}
