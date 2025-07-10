// config-local.js - Configuración local para desarrollo
require('dotenv').config();

// Configuración local para desarrollo
const localConfig = {
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'tu_contraseña_local', // Cambia esto por tu contraseña
  database: 'api_estancia_dev',
  dialect: "postgres",
  dialectOptions: {
    ssl: false
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

module.exports = localConfig; 