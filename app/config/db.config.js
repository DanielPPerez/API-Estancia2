// app/config/db.config.js
require('dotenv').config();

module.exports = {
  // Estos valores se usarán para tu desarrollo local (si tienes PostgreSQL en tu PC)
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'postgres', // Usuario común de postgres local
  PASSWORD: process.env.DB_PASSWORD || 'tu_contraseña_local',
  DB: process.env.DB_NAME || 'api_estancia_dev',
  dialect: "postgres", // ¡Cambio clave!

  // Opciones para la conexión en producción (Render)
  dialectOptions: {
    ssl: {
      require: true,
      // Esta línea es crucial para evitar errores de conexión SSL en Render
      rejectUnauthorized: false 
    }
  },
  
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};