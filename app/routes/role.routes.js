// routes/role.routes.js
const { authJwt } = require("../middleware");
const controller = require("../controllers/role.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Crear un nuevo rol (solo Admin)
  app.post("/api/roles", [authJwt.verifyToken, authJwt.isAdmin], controller.createRole);

  // Obtener todos los roles (Admin o quizá Moderador)
  app.get("/api/roles", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllRoles);

  // Obtener un rol por ID (Admin)
  app.get("/api/roles/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.getRoleById);

  // Actualizar un rol (Admin)
  app.put("/api/roles/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.updateRole);

  // Eliminar un rol (Admin)
  app.delete("/api/roles/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteRole);

  // --- Rutas para gestionar user_roles ---

  // Asignar un rol a un usuario (Admin)
  app.post(
    "/api/users/assign-role", // Podría ser /api/roles/assign-to-user
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.assignRoleToUser // Espera userId y roleId en el body
  );

  // Remover un rol de un usuario (Admin)
  // Usando params: /api/users/:userId/remove-role/:roleId
  app.delete(
    "/api/users/:userId/roles/:roleId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.removeRoleFromUser
  );

  // Obtener los roles de un usuario específico (Admin o el propio usuario)
  app.get(
    "/api/users/:userId/roles",
    [authJwt.verifyToken, authJwt.isAdmin], // O permitir que un usuario vea sus propios roles
    controller.getUserRoles
  );
};