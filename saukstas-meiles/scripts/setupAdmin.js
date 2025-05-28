// scripts/setupAdmin.js
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAdmin() {
  console.log('=== Admin User Setup ===\n');
  
  // Check if setup key is provided
  const setupKey = process.env.ADMIN_SETUP_KEY;
  if (!setupKey) {
    console.error('Error: ADMIN_SETUP_KEY environment variable is not set.');
    console.log('Please set ADMIN_SETUP_KEY in your .env file and try again.');
    process.exit(1);
  }
  
  // Verify setup key
  const inputKey = await question('Enter setup key: ');
  if (inputKey !== setupKey) {
    console.error('Invalid setup key.');
    process.exit(1);
  }
  
  // Get admin credentials
  const username = await question('Enter admin username: ');
  const password = await question('Enter admin password: ');
  const confirmPassword = await question('Confirm admin password: ');
  
  // Validate inputs
  if (!username || username.length < 3) {
    console.error('Username must be at least 3 characters long.');
    process.exit(1);
  }
  
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }
  
  if (password !== confirmPassword) {
    console.error('Passwords do not match.');
    process.exit(1);
  }
  
  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Create admin user object
  const adminUser = {
    id: '1',
    username: username,
    password: hashedPassword,
    role: 'admin',
    created_at: new Date().toISOString()
  };
  
  // Read existing db.json
  const dbPath = path.join(__dirname, '..', 'db.json');
  let dbData = {};
  
  if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, 'utf8');
    dbData = JSON.parse(content);
  }
  
  // Update users array
  if (!dbData.users) {
    dbData.users = [];
  }
  
  // Remove existing admin if any
  dbData.users = dbData.users.filter(user => user.id !== '1');
  
  // Add new admin
  dbData.users.push(adminUser);
  
  // Write back to db.json
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  
  console.log('\n✅ Admin user created successfully!');
  console.log(`Username: ${username}`);
  console.log('\nYou can now login to the admin panel with these credentials.');
  
  rl.close();
}

setupAdmin().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});