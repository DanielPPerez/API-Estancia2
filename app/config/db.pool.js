// Contenido CORRECTO y LIMPIO para: app/config/db.pool.js

const mysql = require('mysql2/promise');

// Creamos el pool de conexión usando la configuración
const pool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exportamos el pool para que otros archivos puedan usarlo
module.exports = pool;