// Contenido MODIFICADO para: app/middlewares/verifySignUp.js

const db = require("../models");
const User = db.users || db.user;
const Role = db.roles || db.role;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Verificar Username
    const userByUsername = await User.findOne({
      where: {
        username: req.body.username
      }
    });

    if (userByUsername) {
      return res.status(400).send({
        message: "Failed! Username is already in use!"
      });
    }

    // Verificar Email
    const userByEmail = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (userByEmail) {
      return res.status(400).send({
        message: "Failed! Email is already in use!"
      });
    }

    // Si todo está bien, pasamos al siguiente middleware o controlador
    next();

  } catch (error) {
    console.error("Error in checkDuplicateUsernameOrEmail: ", error);
    return res.status(500).send({
      message: "An error occurred while checking for duplicate user."
    });
  }
};

const checkRolesExisted = async (req, res, next) => {
  if (req.body.roles) {
    try {
      // Obtener todos los roles disponibles
      const availableRoles = await Role.findAll({
        attributes: ['name']
      });
      
      const availableRoleNames = availableRoles.map(role => role.name.toLowerCase());
      
      // Verificar que todos los roles solicitados existan
      for (let i = 0; i < req.body.roles.length; i++) {
        const requestedRole = req.body.roles[i].toLowerCase();
        // Remover prefijo ROLE_ si existe
        const cleanRole = requestedRole.replace('role_', '');
        if (!availableRoleNames.includes(cleanRole)) {
          return res.status(400).send({
            message: "Failed! Role does not exist = " + req.body.roles[i]
          });
        }
      }
    } catch (error) {
      console.error("Error in checkRolesExisted: ", error);
      return res.status(500).send({
        message: "An error occurred while checking roles."
      });
    }
  }
  
  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
  checkRolesExisted: checkRolesExisted
};

module.exports = verifySignUp;