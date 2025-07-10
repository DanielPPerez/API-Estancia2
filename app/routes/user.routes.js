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

  // Rutas CRUD para Usuarios (solo admin)
  app.get("/api/users", [authJwt.verifyToken, authJwt.isAdmin], userController.getAllUsers);
  app.get("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.getUserById);
  app.put("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.updateUser);
  app.delete("/api/users/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.deleteUserById);

  // Rutas específicas de "boards"
  app.get("/api/users/userboard", [authJwt.verifyToken], userController.userBoard);

  app.get(
    "/api/users/modboard",
    [authJwt.verifyToken, authJwt.isModerator],
    userController.moderatorBoard
  );

  app.get(
    "/api/users/adminboard",
    [authJwt.verifyToken, authJwt.isAdmin],
    userController.adminBoard
  );

  // Rutas para asignar/remover roles (solo admin)
  app.post("/api/users/assign-role", [authJwt.verifyToken, authJwt.isAdmin], userController.assignRoleToUser);
  app.delete("/api/users/:userId/roles/:roleId", [authJwt.verifyToken, authJwt.isAdmin], userController.removeRoleFromUser);
  app.get("/api/users/:userId/roles", [authJwt.verifyToken], userController.getUserRoles);
};