// Contenido para: app/config/db.config.js

require('dotenv').config();

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

