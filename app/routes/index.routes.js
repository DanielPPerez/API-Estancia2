// routes/index.routes.js
const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  // Configuración global de cabeceras CORS (opcional, podrías tenerla en app.js)
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
  
    next();
  });

  // Cargar todas las rutas automáticamente (o manualmente)
  const routesPath = path.join(__dirname); 
  fs.readdirSync(routesPath).forEach(file => {
    // Evitar cargar este mismo archivo (index.js) y archivos que no sean .js
    if (file !== 'index.routes.js' && file.endsWith('.routes.js'))  {
      const route = require(path.join(routesPath, file));
      if (typeof route === 'function') {
        route(app);
        console.log(`Loaded routes from: ${file}`);
      }
    }
  });

  // Ruta de bienvenida (opcional)
  app.get("/api", (req, res) => {
    res.json({ message: "Welcome to the API." });
  });

  // Manejador para rutas no encontradas (404) - debe ir al final
  app.use((req, res, next) => {
    res.status(404).send({ message: "Sorry, can't find that!" });
  });
};