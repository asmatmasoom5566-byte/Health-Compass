import { hashPassword, verifyPassword } from './server/services/auth';

async function testPassword() {
  const password = 'asmat334499';
  
  console.log('Testing password:', password);
  
  // Create a hash
  const hash = await hashPassword(password);
  console.log('Generated hash:', hash);
  
  // Verify the hash
  const isValid = await verifyPassword(password, hash);
  console.log('Password valid:', isValid);
  
  // Try with wrong password
  const isWrongValid = await verifyPassword('wrongpassword', hash);
  console.log('Wrong password valid:', isWrongValid);
}

testPassword().catch(console.error);
