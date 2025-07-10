// user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Importante para PostgreSQL
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
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
  }, {
    timestamps: true, // Agregar createdAt y updatedAt automáticamente
    tableName: 'users', // Asegurar nombre de tabla
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
