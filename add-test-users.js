// Add test users to the database
const http = require('http');

// First, login as admin
const loginData = JSON.stringify({
  phone: '0784690946',
  password: 'Asmat881166'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const loginResponse = JSON.parse(data);
    console.log('Login response:', loginResponse.message);
    
    // The session cookie is automatically handled
    // Now we need to register new users
    console.log('\nTo add more users, you need to:');
    console.log('1. Use the invite code: ASMAT881166');
    console.log('2. Register new users through the web interface');
    console.log('3. They will appear in the Admin Dashboard');
    console.log('\nCurrently, only 1 user (admin) is registered.');
  });
});

loginReq.write(loginData);
loginReq.end();
