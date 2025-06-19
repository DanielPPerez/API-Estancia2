// routes/user.routes.js
const { authJwt } = require("../middleware");
const userController = require("../controllers/user.controller");
// Asumiendo que las funciones de calificación están en user.controller.js por ahora
// const calificacionesController = require("../controllers/calificaciones.controller.js"); // Si lo separas

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Rutas de contenido general (como las tenías)
  // app.get("/api/users/all", userController.allAccess); // No tenías allAccess en el user.controller adaptado

  // Rutas CRUD para Usuarios (ejemplos)
  app.get("/api/users", [authJwt.verifyToken, authJwt.isAdmin], userController.getAllUsers);
  app.get("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.getUserById); // O permitir al propio usuario ver su info
  app.put("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.updateUser); // O permitir al propio usuario editarse
  app.delete("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.deleteUserById);


  // Rutas específicas de "boards"
  app.get("/api/users/userboard", [authJwt.verifyToken], userController.userBoard); // Panel para usuario logueado

  app.get(
    "/api/users/modboard", // Panel para moderadores
    [authJwt.verifyToken, authJwt.isModerator],
    userController.moderatorBoard // Asumiendo que tienes una función para esto en user.controller o calificaciones.controller
  );

  app.get(
    "/api/users/adminboard", // Panel para administradores
    [authJwt.verifyToken, authJwt.isAdmin],
    userController.adminBoard
  );

};