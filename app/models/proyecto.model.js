module.exports = (sequelize, Sequelize) => {
  const Proyecto = sequelize.define("proyectos", {
    idUser: {
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
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
  });

  Proyecto.associate = (models) => {
    // Asociación muchos a uno con User
    Proyecto.belongsTo(models.user, {
      foreignKey: "idUser",
      as: "user",
    });
  };

  return Proyecto;
};
