// routes/calificaciones.routes.js
const { authJwt } = require("../middleware");
const controller = require("../controllers/calificaciones.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Crear una nueva calificación para un proyecto
  app.post(
    "/api/calificaciones",
    [authJwt.verifyToken, authJwt.isEvaluadorOrAdmin],
    controller.createCalificacion
  );

  // Obtener todas las calificaciones (Admin o Evaluador)
  app.get(
    "/api/calificaciones",
    [authJwt.verifyToken, authJwt.isEvaluadorOrAdmin],
    controller.getAllCalificaciones
  );

  // Obtener todas las calificaciones de un proyecto específico
  app.get(
    "/api/calificaciones/proyecto/:proyectoId",
    [authJwt.verifyToken],
    controller.getCalificacionesByProyectoId
  );

  // Obtener las calificaciones hechas por un evaluador
  app.get(
    "/api/calificaciones/evaluador/my",
    [authJwt.verifyToken, authJwt.isEvaluadorOrAdmin],
    controller.getCalificacionesByEvaluadorId
  );
  
  // Para que un admin vea las de cualquier evaluador
  app.get(
    "/api/calificaciones/evaluador/:evaluadorId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getCalificacionesByEvaluadorId
  );

  // Actualizar una calificación existente por su ID
  app.put(
    "/api/calificaciones/:id",
    [authJwt.verifyToken, authJwt.isEvaluadorOrAdmin],
    controller.updateCalificacion
  );

  // Eliminar una calificación por su ID
  app.delete(
    "/api/calificaciones/:id",
    [authJwt.verifyToken, authJwt.isEvaluadorOrAdmin],
    controller.deleteCalificacion
  );
};