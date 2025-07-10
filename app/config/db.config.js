// Contenido EXACTO para el archivo: app/config/db.config.js

require('dotenv').config(); // Carga las variables del .env para desarrollo local

module.exports = {
  // En Railway, usa MYSQLHOST. En local, usa DB_HOST.
  HOST: process.env.MYSQLHOST || process.env.DB_HOST,

  // En Railway, usa MYSQLUSER. En local, usa DB_USER.
  USER: process.env.MYSQLUSER || process.env.DB_USER,

  // En Railway, usa MYSQLPASSWORD. En local, usa DB_PASSWORD.
  PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,

  // En Railway, usa MYSQLDATABASE. En local, usa DB_NAME.
  DB: process.env.MYSQLDATABASE || process.env.DB_NAME,

  // En Railway, usa MYSQLPORT. En local, usa DB_PORT.
  PORT: process.env.MYSQLPORT || process.env.DB_PORT,

  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};