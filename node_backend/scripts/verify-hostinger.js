const mysql = require('mysql2/promise');
require('dotenv').config();

async function verify() {
  const url = process.env.DB_CONN;
  console.log('--- Hostinger Direct Connectivity Test ---');
  console.log('Target:', url.split('@')[1]);

  // Set a short timeout to prevent hanging
  const connectionConfig = {
    uri: url,
    connectTimeout: 10000, // 10 seconds
  };

  try {
    console.log('Attempting to connect...');
    const connection = await mysql.createConnection(url);
    console.log('✅ Success! Connected to Hostinger MySQL.');

    const [rows] = await connection.execute('SELECT COUNT(*) as userCount FROM user');
    console.log(`📊 Query successful. Users in DB: ${rows[0].userCount}`);

    await connection.end();
  } catch (err) {
    console.error('❌ Connection Failed.');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);

    if (err.code === 'ETIMEDOUT') {
      console.log('💡 Diagnosis: The connection timed out. This almost always means the Hostinger firewall is blocking this IP.');
      console.log('💡 Solution: log in to Hostinger hPanel -> Databases -> Remote MySQL and add the IP "0.0.0.0" (for temporary testing) or your current IP.');
    }
  } finally {
    console.log('--- Test Complete ---');
    process.exit();
  }
}

verify();
