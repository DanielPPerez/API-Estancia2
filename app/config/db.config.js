// app/config/db.config.js
// Configuración específica para PostgreSQL
require('dotenv').config();

// Función para parsear la URL de la base de datos
function parseDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      // Parsear la URL de la base de datos
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: url.port || 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.substring(1), // Remover el slash inicial
        dialect: "postgres",
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          underscored: true,
          freezeTableName: true,
          timestamps: true
        }
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
      // Fallback a configuración local
    }
  }
  
  // Configuración local
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tu_contraseña_local',
    database: process.env.DB_NAME || 'api_estancia_dev',
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    }
  };
}

module.exports = parseDatabaseUrl();