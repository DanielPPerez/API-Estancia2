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
  // Solo usuarios con rol 'evaluador' (o 'moderador', 'admin' según tu lógica)
  app.post(
    "/api/calificaciones",
    [authJwt.verifyToken, authJwt.isEvaluador], // o authJwt.isModerator, o una combinación
    controller.createCalificacion
  );

  // Obtener todas las calificaciones (Admin o Moderador)
  app.get(
    "/api/calificaciones",
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin],
    controller.getAllCalificaciones
  );

  // Obtener todas las calificaciones de un proyecto específico
  app.get(
    "/api/calificaciones/proyecto/:proyectoId",
    [authJwt.verifyToken], // La autorización más fina (dueño, evaluador, admin) puede estar en el controlador
    controller.getCalificacionesByProyectoId
  );

  // Obtener las calificaciones hechas por un evaluador (el propio evaluador o un admin)
  // Para el propio evaluador:
  app.get(
    "/api/calificaciones/evaluador/my",
    [authJwt.verifyToken, authJwt.isEvaluador],
    controller.getCalificacionesByEvaluadorId // El controlador usa req.userId
  );
  // Para que un admin vea las de cualquier evaluador:
  app.get(
    "/api/calificaciones/evaluador/:evaluadorId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getCalificacionesByEvaluadorId // El controlador usa req.params.evaluadorId
  );

  // Actualizar una calificación existente por su ID
  app.put(
    "/api/calificaciones/:id",
    [authJwt.verifyToken, authJwt.isEvaluador], // El controlador verificará la propiedad o si es Admin
    controller.updateCalificacion
  );

  // Eliminar una calificación por su ID
  app.delete(
    "/api/calificaciones/:id",
    [authJwt.verifyToken, authJwt.isEvaluador], // El controlador verificará la propiedad o si es Admin
    controller.deleteCalificacion
  );
};