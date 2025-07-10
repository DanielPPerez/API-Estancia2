// Contenido para: app/config/db.config.js

require('dotenv').config();
const mysql = require('mysql2/promise');

module.exports = {
  HOST: process.env.MYSQLHOST || process.env.DB_HOST,
  USER: process.env.MYSQLUSER || process.env.DB_USER,
  PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  DB: process.env.MYSQLDATABASE || process.env.DB_NAME,
  PORT: process.env.MYSQLPORT || process.env.DB_PORT,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

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