// models/index.js
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

// Importar configuración de base de datos
let config;
if (env === "development") {
  // Usar configuración local para desarrollo
  config = require("../../config-local.js");
} else {
  // Usar configuración de producción
  config = require("../config/db.config.js");
}

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Cargar modelos automáticamente
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`📦 Modelo cargado: ${model.name} (${file})`);
  });

// Establecer asociaciones de manera segura
console.log("\n🔗 Estableciendo asociaciones...");
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      console.log(`✅ Asociaciones establecidas para: ${modelName}`);
    } catch (error) {
      console.error(`❌ Error setting associations for ${modelName}:`, error);
    }
  }
});

// Crear alias para modelos con nombres diferentes
if (db.roles && !db.role) {
  db.role = db.roles;
  console.log("🔄 Alias creado: db.role = db.roles");
}

if (db.users && !db.user) {
  db.user = db.users;
  console.log("🔄 Alias creado: db.user = db.users");
}

if (db.proyectos && !db.proyecto) {
  db.proyecto = db.proyectos;
  console.log("🔄 Alias creado: db.proyecto = db.proyectos");
}

if (db.proyectos && !db.projects) {
  db.projects = db.proyectos;
  console.log("🔄 Alias creado: db.projects = db.proyectos");
}

if (db.refreshToken && !db.refreshTokens) {
  db.refreshTokens = db.refreshToken;
  console.log("🔄 Alias creado: db.refreshTokens = db.refreshToken");
}

// Verificar que las asociaciones se establecieron correctamente
console.log("\n🔍 Verificando asociaciones establecidas:");
Object.keys(db).forEach(modelName => {
  if (db[modelName].associations) {
    const associations = Object.keys(db[modelName].associations);
    if (associations.length > 0) {
      console.log(`✅ ${modelName}: ${associations.join(', ')}`);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log("\n📋 Modelos disponibles:", Object.keys(db).filter(key => 
  key !== 'sequelize' && key !== 'Sequelize'
));

module.exports = db;
