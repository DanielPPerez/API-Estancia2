// app/config/db.config.js
// Este es el único archivo de configuración de base de datos que necesitas al usar Sequelize.
require('dotenv').config();

module.exports = {
  // Estos valores se usan si NO se encuentra la variable DATABASE_URL en el entorno.
  // Son útiles para tu desarrollo local.
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'postgres', // Usuario por defecto para PostgreSQL local
  PASSWORD: process.env.DB_PASSWORD || 'tu_contraseña_local', // Cambia esto por tu contraseña local
  DB: process.env.DB_NAME || 'api_estancia_dev',
  
  // ¡Este es el cambio más importante! Le decimos a Sequelize que use PostgreSQL.
  dialect: "postgres",

  // Esta es la configuración del pool de conexiones que Sequelize gestionará.
  pool: {
    max: 5,       // Número máximo de conexiones en el pool
    min: 0,       // Número mínimo de conexiones en el pool
    acquire: 30000, // Tiempo máximo (en ms) que el pool intentará obtener una conexión antes de lanzar un error
    idle: 10000     // Tiempo máximo (en ms) que una conexión puede estar inactiva antes de ser liberada
  },

  // Opciones específicas del dialecto, crucial para la conexión en Render (y otros servicios en la nube).
  dialectOptions: {
    ssl: {
      require: true,
      // Esta línea es necesaria para evitar errores de certificados autofirmados en Render.
      rejectUnauthorized: false 
    }
  }
};