const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config.js");

let sequelize;

// Render y otras plataformas de hosting configuran la variable DATABASE_URL automáticamente.
if (process.env.DATABASE_URL) {
  // Si estamos en producción (en Render), usamos la URL de conexión.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: dbConfig.dialectOptions, // Usamos las opciones de SSL que definimos antes
    define: dbConfig.define, // Usar configuración específica de PostgreSQL
    pool: dbConfig.pool
  });
} else {
  // Si estamos en desarrollo (en tu PC), usamos la configuración manual del db.config.js.
  sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
      host: dbConfig.HOST,
      dialect: dbConfig.dialect,
      pool: dbConfig.pool,
      define: dbConfig.define, // Usar configuración específica de PostgreSQL
      dialectOptions: process.env.NODE_ENV === 'production' ? dbConfig.dialectOptions : {}
    }
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.user_roles = require("./userRoles.js")(sequelize, Sequelize);
db.proyecto = require("./proyecto.model.js")(sequelize, Sequelize);
db.calificaciones = require("./calificaciones.model.js")(sequelize, Sequelize);
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
  // Asociar User con Calificaciones (como evaluador)
  db.user.hasMany(models.calificaciones, {
    foreignKey: "userEvaluadorId",
    as: "calificacionesComoEvaluador"
  });
  // Asociar User con Calificaciones (como alumno)
  db.user.hasMany(models.calificaciones, {
    foreignKey: "userAlumnoId",
    as: "calificacionesComoAlumno"
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
  // Asociar Proyecto con Calificaciones
  db.proyecto.hasMany(models.calificaciones, {
    foreignKey: "proyectoId",
    as: "calificaciones"
  });
};

// Asociar Calificaciones
db.calificaciones.associate = (models) => {
  // Asociación con el proyecto
  db.calificaciones.belongsTo(models.proyecto, {
    foreignKey: 'proyectoId',
    as: 'proyecto'
  });

  // Asociación con el evaluador (usuario)
  db.calificaciones.belongsTo(models.user, {
    foreignKey: 'userEvaluadorId',
    as: 'evaluador'
  });

  // Asociación con el alumno (usuario)
  db.calificaciones.belongsTo(models.user, {
    foreignKey: 'userAlumnoId',
    as: 'alumno'
  });
};

db.user.associate(db);
db.role.associate(db);
db.refreshToken.associate(db);
db.proyecto.associate(db);
db.calificaciones.associate(db);

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
