// Contenido MODIFICADO para server.js

const express = require("express");
const cors = require("cors");
require('dotenv').config();

// 1. IMPORTAMOS EL OBJETO `db` DE SEQUELIZE
// Este objeto contiene la instancia de sequelize y todos los modelos
const db = require("./app/models");

// 2. IMPORTAMOS la función de configuración inicial
const { initialSetup } = require('./app/config/initialSetup.js');

const app = express();

// --- Configuración de CORS ---
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : ["http://localhost:8080", "http://localhost:5173"];
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

// --- Cargar Rutas ---
require('./app/routes/index.routes.js')(app);

// --- Puerto y Arranque del Servidor ---
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Access the API at http://localhost:${PORT}`);
  
  // 3. SINCRONIZAMOS LA BASE DE DATOS Y LUEGO INICIAMOS EL SETUP
  // db.sequelize.sync() creará todas las tablas si no existen.
  // El .then() asegura que initialSetup() solo se ejecute DESPUÉS de que las tablas estén listas.
  db.sequelize.sync().then(() => {
    console.log('Database tables synchronized successfully.');
    initialSetup(); // Llamamos a la función de inicialización aquí
  }).catch(err => {
    console.error("Failed to sync database tables: ", err);
  });
});