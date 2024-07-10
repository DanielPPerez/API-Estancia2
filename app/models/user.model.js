// user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    nombre: {
      type: DataTypes.STRING,
    },
    carrera: {
      type: DataTypes.STRING,
    },
    cuatrimestre: {
      type: DataTypes.STRING,
    },
    categoria: {
      type: DataTypes.STRING,
    },
  });

  User.associate = (models) => {
    User.belongsToMany(models.role, {
      through: models.user_roles,
      foreignKey: "userId",
      otherKey: "roleId",
    });

    // Asociación uno a muchos con Proyecto
    User.hasMany(models.proyecto, {
      foreignKey: "idUser",
      as: "proyectos",
    });
  };

  return User;
};
