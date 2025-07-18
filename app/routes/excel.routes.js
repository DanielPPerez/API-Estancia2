// routes/excel.routes.js
const { authJwt } = require("../middleware");
const { excelUploadMiddleware } = require("../middleware/uploadExcel");
const controller = require("../controllers/excel.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Exportar toda la base de datos (o tablas seleccionadas) a Excel
  // Proteger esta ruta, usualmente solo para admins
  app.get(
    "/api/excel/export/database",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.exportDatabaseToExcel
  );

  // Importar desde Excel y actualizar la base de datos
  // Proteger esta ruta, usualmente solo para admins
  app.post(
    "/api/excel/import/database",
    [authJwt.verifyToken, authJwt.isAdmin, excelUploadMiddleware],
    controller.importFromExcelAndUpdate
  );
};