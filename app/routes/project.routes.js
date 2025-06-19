// routes/project.routes.js
const { authJwt } = require("../middleware");
const { projectUploadMiddleware } = require("../middleware/uploadFiles"); // Importar el middleware de subida
const controller = require("../controllers/project.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Crear un nuevo proyecto
  // authJwt.verifyToken asegura que req.userId está disponible
  app.post(
    "/api/projects",
    [authJwt.verifyToken, projectUploadMiddleware], // projectUploadMiddleware maneja los campos 'fichaTecnica', etc.
    controller.createProject
  );

  // Obtener todos los proyectos (abierto a todos o protegido según necesidad)
  app.get("/api/projects", controller.getAllProjects);

  // Obtener un proyecto específico por su ID
  app.get("/api/projects/:id", controller.getProjectById);

  // Obtener todos los proyectos de un usuario específico
  app.get("/api/projects/user/:userId", [authJwt.verifyToken], controller.getProjectsByUserId);
  // O para obtener los proyectos del usuario actualmente logueado:
  // app.get("/api/projects/my-projects", [authJwt.verifyToken], controller.getMyProjects); // Necesitarías una función getMyProjects en el controller que use req.userId

  // Actualizar un proyecto (solo el dueño o un admin)
  app.put(
    "/api/projects/:id",
    [authJwt.verifyToken, projectUploadMiddleware], // projectUploadMiddleware para actualizar archivos
    controller.updateProject // El controlador debe verificar la autorización (dueño o admin)
  );

  // Eliminar un proyecto (solo el dueño o un admin)
  app.delete(
    "/api/projects/:id",
    [authJwt.verifyToken], // Podrías añadir authJwt.isAdmin o que el controlador verifique propiedad
    controller.deleteProject // El controlador debe verificar la autorización
  );

  // Descargar un archivo asociado a un proyecto
  // :fileType podría ser 'technicalSheet', 'canvaModel', 'projectPdf'
  app.get(
    "/api/projects/:projectId/download/:fileType",
    [authJwt.verifyToken], // O hacerla pública si los archivos deben ser accesibles sin login
    controller.downloadProjectFile
  );
};