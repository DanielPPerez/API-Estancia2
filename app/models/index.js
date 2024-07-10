const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  operatorsAliases: false,

  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.user_roles = require("./userRoles.js")(sequelize, Sequelize);
db.proyecto = require("./proyecto.model.js")(sequelize, Sequelize);
db.refreshToken = require("./refreshToken.model.js")(sequelize, Sequelize);

// Definir asociaciones
db.role.associate = (models) => {
  db.role.belongsToMany(models.user, {
    through: models.user_roles,
    foreignKey: "roleId",
    otherKey: "userId",
  });
};

db.user.associate = (models) => {
  db.user.belongsToMany(models.role, {
    through: models.user_roles,
    foreignKey: "userId",
    otherKey: "roleId",
  });
  db.user.hasOne(models.refreshToken, {
    foreignKey: "userId",
    targetKey: "id",
  });
  // Asociar User con Proyecto
  db.user.hasMany(models.proyecto, {
    foreignKey: "idUser",
    as: "proyectos",
  });
};

db.refreshToken.associate = (models) => {
  db.refreshToken.belongsTo(models.user, {
    foreignKey: "userId",
    targetKey: "id",
  });
};

// Asociar Proyecto con User
db.proyecto.associate = (models) => {
  db.proyecto.belongsTo(models.user, {
    foreignKey: "idUser",
    as: "user",
  });
};

db.user.associate(db);
db.role.associate(db);
db.refreshToken.associate(db);
db.proyecto.associate(db);

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
