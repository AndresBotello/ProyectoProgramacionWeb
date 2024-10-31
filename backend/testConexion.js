const mysql = require('mysql2/promise');
const config = require('./config'); 

console.log('Trying to connect to MySQL with the following config:');
console.log(`Host: ${config.mysql.host}`);
console.log(`Port: ${config.mysql.port}`);
console.log(`User: ${config.mysql.user}`);
console.log(`Database: ${config.mysql.database}`);

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      port: config.mysql.port,
    });
    console.log('Database connection successful!');
    await connection.end();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

testConnection();