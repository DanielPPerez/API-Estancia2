const express = require("express");
const cors = require("cors");
require('dotenv').config(); // Cargar variables de entorno desde .env

// 1. IMPORTAMOS la función de configuración inicial
const { initialSetup } = require('./app/config/initialSetup.js');

const app = express();

// --- Configuración de CORS ---
// (Tu configuración actual es buena, la mantenemos)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : ["http://localhost:8081", "http://localhost:5173"];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Conexión a la Base de Datos ---
// El pool se importa en los archivos que lo necesitan, como en initialSetup.js.
// No necesitamos hacer nada con él aquí.
const pool = require('./app/config/db.config.js');
  
// --- Cargar Rutas ---
require('./app/routes/index.routes.js')(app);

// --- Puerto y Arranque del Servidor ---
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Access the API at http://localhost:${PORT}`); 
  
  // 2. LLAMAMOS A LA FUNCIÓN DE INICIALIZACIÓN AQUÍ
  // Usamos async/await en la función de callback de listen para asegurar
  // que el setup se complete antes de que consideremos el servidor "listo".
  await initialSetup();
});