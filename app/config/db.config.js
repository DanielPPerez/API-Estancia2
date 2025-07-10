// --- DESPUÉS (La versión correcta para Railway y desarrollo local) ---
const mysql = require('mysql2/promise');
require('dotenv').config(); // Esto carga las variables de tu archivo .env localmente

const pool = mysql.createPool({
   // Para Railway, usa MYSQLHOST. Para local, usa DB_HOST o '127.0.0.1'
   HOST: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',

   // Para Railway, usa MYSQLUSER. Para local, usa DB_USER.
   USER: process.env.MYSQLUSER || process.env.DB_USER,
 
   // Para Railway, usa MYSQLPASSWORD. Para local, usa DB_PASSWORD.
   PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
 
   // Para Railway, usa MYSQLDATABASE. Para local, usa DB_NAME.
   DB: process.env.MYSQLDATABASE || process.env.DB_NAME,
 
   // Para Railway, usa MYSQLPORT. Para local, usa DB_PORT.
   PORT: process.env.MYSQLPORT || process.env.DB_PORT,
  
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