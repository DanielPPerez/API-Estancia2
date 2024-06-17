module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    username: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    nombre: {
      type: Sequelize.STRING,
    },
    carrera: {
      type: Sequelize.STRING,
    },
    cuatrimestre: {
      type: Sequelize.INTEGER,
    },
    categoria: {
      type: Sequelize.STRING,
    },
  });

  return User;
};
