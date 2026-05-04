/**
 * Create Invite Code Script
 * Creates a custom invite code for the admin user
 */

import { storage } from './server/storage';

async function createInviteCode() {
  try {
    console.log('🎟️  Creating invite code...');

    // Get the admin user
    const adminUser = await storage.getUserByEmail('asmatmasoom5566@gmail.com');
    
    if (!adminUser) {
      console.error('❌ Admin user not found. Please run seed.ts first.');
      process.exit(1);
    }

    // Check if invite code already exists
    const existingCode = await storage.getInviteCode('ASMAT881166');
    
    if (existingCode) {
      console.log('ℹ️  Invite code already exists:', existingCode.code);
      console.log('   Used:', existingCode.usedCount, '/', existingCode.maxUses);
      console.log('   Status:', existingCode.isActive ? 'Active' : 'Inactive');
    } else {
      // Create the custom invite code
      const inviteCode = await storage.createInviteCode({
        code: 'ASMAT881166',
        createdBy: adminUser.id,
        email: null,
        phone: null,
        expiresAt: null,
        maxUses: 10,
        isActive: true,
      });

      console.log('✅ Invite code created successfully!');
      console.log('   Code:', inviteCode.code);
      console.log('   Max Uses:', inviteCode.maxUses);
      console.log('   Status: Active');
      console.log('');
      console.log('🎉 You can now use this code during registration!');
    }
  } catch (error) {
    console.error('❌ Failed to create invite code:', error);
    process.exit(1);
  }
}

createInviteCode();
