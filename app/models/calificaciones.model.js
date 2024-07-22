module.exports = (sequelize, Sequelize) => {
  const Calificaciones = sequelize.define("calificaciones", {
    userEvaluador: {
      type: Sequelize.STRING,
    },
    userAlumno: {
      type: Sequelize.STRING,
    },
    innovacion: {
      type: Sequelize.STRING,
    },
    mercado: {
      type: Sequelize.STRING,
    },
    tecnica: {
      type: Sequelize.STRING,
    },
    financiera: {
      type: Sequelize.STRING,
    },
    pitch: {
      type: Sequelize.STRING,
    },
    observaciones: {
      type: Sequelize.STRING,
    },
    total: {
      type: Sequelize.INTEGER,
    },
  });

  return Calificaciones;
};
