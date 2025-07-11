module.exports = (sequelize, Sequelize) => {
  const Calificaciones = sequelize.define("calificaciones", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Importante para PostgreSQL
    },
    userEvaluadorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userAlumnoId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    proyectoId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    innovacion: {
      type: Sequelize.DECIMAL(3, 2), // Permitir decimales para calificaciones
    },
    mercado: {
      type: Sequelize.DECIMAL(3, 2),
    },
    tecnica: {
      type: Sequelize.DECIMAL(3, 2),
    },
    financiera: {
      type: Sequelize.DECIMAL(3, 2),
    },
    pitch: {
      type: Sequelize.DECIMAL(3, 2),
    },
    observaciones: {
      type: Sequelize.TEXT, // Cambiar a TEXT para observaciones largas
    },
    total: {
      type: Sequelize.DECIMAL(3, 2),
    },
  }, {
    timestamps: true, // Agregar createdAt y updatedAt automáticamente
    tableName: 'calificaciones', // Asegurar nombre de tabla
  });

  Calificaciones.associate = (models) => {
    // Verificar que los modelos existan antes de establecer asociaciones
    if (models.proyectos) {
      // Asociación con el proyecto
      Calificaciones.belongsTo(models.proyectos, {
        foreignKey: 'proyectoId',
        as: 'proyecto'
      });
    }

    if (models.user) {
      // Asociación con el evaluador (usuario)
      Calificaciones.belongsTo(models.user, {
        foreignKey: 'userEvaluadorId',
        as: 'evaluador'
      });

      // Asociación con el alumno (usuario)
      Calificaciones.belongsTo(models.user, {
        foreignKey: 'userAlumnoId',
        as: 'alumno'
      });
    }
  };

  return Calificaciones;
};
