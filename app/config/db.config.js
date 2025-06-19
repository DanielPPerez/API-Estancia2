const mysql = require('mysql2/promise');
require('dotenv').config(); 

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3307'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'), 
  queueLimit: 0, 
  connectTimeout: parseInt(process.env.DB_POOL_ACQUIRE || '10000') 
});

// Probar la conexión 
pool.getConnection()
  .then(connection => {
    console.log('MySQL Connected successfully using mysql2 pool!');
    connection.release(); 
  })
  .catch(err => {
    console.error('Failed to connect to MySQL:', err);
  });

module.exports = pool;