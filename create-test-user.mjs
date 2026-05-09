import { storage } from './server/storage.js';
import { hashPassword } from './server/services/auth.js';

async function createTestUser() {
  try {
    // Check current user count
    const count = await storage.getUserCount();
    console.log(`Current users: ${count}`);

    // Create a test member user
    const passwordHash = await hashPassword('member123');
    
    const user = await storage.createUser({
      fullName: 'Test Member',
      email: null,
      phone: '0700000001',
      passwordHash,
      profession: 'doctor',
      country: 'Afghanistan',
      clinicHospital: 'Test Hospital',
      status: 'approved',
      role: 'standard_member',
      emailVerified: false,
      phoneVerified: true,
      lastLoginIp: null,
    });

    console.log(`✅ Created test user: ${user.fullName} (ID: ${user.id})`);

    // Verify it was created
    const allUsers = await storage.getAllUsers({});
    console.log(`Total users now: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`  - ${u.fullName} (${u.role}) - ${u.phone}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
