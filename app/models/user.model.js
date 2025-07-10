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
    // Verificar que los modelos existan antes de establecer asociaciones
    // Usar models.roles (plural) ya que ese es el nombre del modelo
    if (models.roles && models.user_roles) {
      User.belongsToMany(models.roles, {
        through: models.user_roles,
        foreignKey: "userId",
        otherKey: "roleId",
      });
    }

    if (models.proyecto) {
      // Asociación uno a muchos con Proyecto
      User.hasMany(models.proyecto, {
        foreignKey: "idUser",
        as: "proyectos",
      });
    }

    if (models.calificaciones) {
      // Asociación con Calificaciones (como evaluador)
      User.hasMany(models.calificaciones, {
        foreignKey: "userEvaluadorId",
        as: "calificacionesComoEvaluador"
      });

      // Asociación con Calificaciones (como alumno)
      User.hasMany(models.calificaciones, {
        foreignKey: "userAlumnoId",
        as: "calificacionesComoAlumno"
      });
    }
  };

  return User;
};
