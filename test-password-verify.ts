import { hashPassword, verifyPassword } from './server/services/auth';

async function testExactPassword() {
  // Test the exact password
  const password = 'asmat334499';
  
  console.log('=== Testing Password Hash & Verify ===');
  console.log('Password:', password);
  console.log('Password length:', password.length);
  console.log('');
  
  // Create hash
  const hash = await hashPassword(password);
  console.log('Full hash:', hash);
  console.log('Hash length:', hash.length);
  console.log('');
  
  // Test verification
  const isValid = await verifyPassword(password, hash);
  console.log('✅ Verification with correct password:', isValid);
  
  // Test with wrong password
  const isWrong = await verifyPassword('wrong', hash);
  console.log('❌ Verification with wrong password:', isWrong);
  console.log('');
  
  // Test if the issue is with the stored hash format
  console.log('=== Testing Hash Components ===');
  const parts = hash.split('$');
  console.log('Hash parts:', parts.length);
  console.log('Algorithm:', parts[1]);
  console.log('Version:', parts[2]);
  console.log('Parameters:', parts[3]);
  console.log('Salt (base64):', parts[4]);
  console.log('Hash (base64):', parts[5]);
}

testExactPassword().catch(console.error);
