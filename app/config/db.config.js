// --- DESPUÉS (La versión correcta para Railway y desarrollo local) ---
const mysql = require('mysql2/promise');
require('dotenv').config(); // Esto carga las variables de tu archivo .env localmente

const pool = mysql.createPool({
   host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
   user: process.env.MYSQLUSER || process.env.DB_USER,
   password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
   database: process.env.MYSQLDATABASE || process.env.DB_NAME,
   port: process.env.MYSQLPORT || process.env.DB_PORT,
  // Estos settings están bien como están
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'), 
  queueLimit: 0, 
  connectTimeout: parseInt(process.env.DB_POOL_ACQUIRE || '10000') 
});

// Probar la conexión 
pool.getConnection()
  .then(connection => {
    // Usamos process.env.RAILWAY_ENVIRONMENT para saber dónde estamos corriendo
    const environment = process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local';
    console.log(`MySQL Connected successfully in ${environment} environment!`);
    connection.release(); 
  })
  .catch(err => {
    console.error('Failed to connect to MySQL:', err);
  });

module.exports = pool;