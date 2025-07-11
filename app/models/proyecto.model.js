module.exports = (sequelize, Sequelize) => {
  const Proyecto = sequelize.define("proyectos", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Importante para PostgreSQL
    },
    idUser: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT, // Cambiar a TEXT para descripciones largas
    },
    videoLink: {
      type: Sequelize.STRING,
    },
    technicalSheet: {
      type: Sequelize.STRING,
    },
    canvaModel: {
      type: Sequelize.STRING,
    },
    projectPdf: {
      type: Sequelize.STRING,
    },
    estatus: {
      type: Sequelize.STRING,
      defaultValue: 'no subido',
    },
  }, {
    timestamps: true, // Agregar createdAt y updatedAt automáticamente
    tableName: 'projects', // Asegurar nombre de tabla
  });

  Proyecto.associate = (models) => {
    // Verificar que el modelo user exista antes de establecer asociaciones
    if (models.user) {
    // Asociación muchos a uno con User
    Proyecto.belongsTo(models.user, {
      foreignKey: "idUser",
      as: "user",
    });
    }

    // Verificar que el modelo calificaciones exista antes de establecer asociaciones
    if (models.calificaciones) {
      // Asociación uno a muchos con Calificaciones
      Proyecto.hasMany(models.calificaciones, {
        foreignKey: "proyectoId",
        as: "calificaciones"
      });
    }
  };

  return Proyecto;
};
