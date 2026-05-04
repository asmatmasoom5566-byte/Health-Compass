/**
 * Database Seed Script
 * Creates initial admin user and other default data
 * Run this script to populate the database with essential data
 */

import { storage } from './server/storage';
import { hashPassword } from './server/services/auth';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if any users already exist
    const userCount = await storage.getUserCount();
    
    if (userCount === 0) {
      console.log('📝 No users found. Creating admin account...');

      // Hash the admin password
      const passwordHash = await hashPassword('asmat334499');

      // Create the admin user
      const adminUser = await storage.createUser({
        fullName: 'Asmat Kakar',
        email: 'asmatmasoom5566@gmail.com',
        phone: '0784690946',
        passwordHash,
        profession: 'doctor',
        country: 'Afghanistan',
        clinicHospital: 'Doctor Asmat Masoom Clinic',
        status: 'approved',
        role: 'admin',
        emailVerified: true,
        phoneVerified: true,
        lastLoginIp: null,
      });

      console.log('✅ Admin user created successfully!');
      console.log('   Name:', adminUser.fullName);
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Status:', adminUser.status);
      console.log('   Profession:', adminUser.profession);
      console.log('   Country:', adminUser.country);
      console.log('   Clinic:', adminUser.clinicHospital);
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log('   Email: asmatmasoom5566@gmail.com');
      console.log('   Password: asmat334499');
      console.log('');
      console.log('✨ You can now login with these credentials!');

      // Create a custom invite code for the admin
      const customInviteCode = await storage.createInviteCode({
        code: 'ASMAT881166',
        createdBy: adminUser.id,
        email: null,
        phone: null,
        expiresAt: null,
        maxUses: 10,
        isActive: true,
      });

      console.log('🎟️  Custom Invite Code Created:');
      console.log('   Code:', customInviteCode.code);
      console.log('   Max Uses:', customInviteCode.maxUses);
      console.log('   Status: Active');
    } else {
      console.log('ℹ️  Database already has', userCount, 'user(s). Skipping seed.');
      console.log('   To reset and re-seed, clear the database first.');
    }

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
