const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/app/all", controller.allAccess);

  app.get("/api/app/user", [authJwt.verifyToken], controller.userBoard);

  app.get(
    "/api/app/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/app/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  // Nueva ruta para subir proyectos
  app.post(
    "/api/app/uploadProject",
    [authJwt.verifyToken],
    controller.uploadProject
  );
};
