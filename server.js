// server.js - Versión optimizada para despliegue
const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();
const db = require("./app/models");
const { setupDatabase } = require('./app/config/initialSetup.js');

// --- Configuración de CORS ---
// Configuración de CORS para desarrollo y producción
const allowedOrigins = [
  'https://feriadeinnovacion.netlify.app', // Frontend en producción (Netlify)
  'http://localhost:5173', // Desarrollo local
  'http://localhost:8080', // Puerto alternativo para desarrollo
  'http://127.0.0.1:5173' // IP local para desarrollo
];

// Si hay variables de entorno configuradas, las usamos
if (process.env.CORS_ALLOWED_ORIGINS) {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',');
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin 'origin' (como las de Postman o apps móviles)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS bloqueado para origen: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Necesario para autenticación con cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'x-access-token', 'Authorization'] // Headers permitidos
};

app.use(cors(corsOptions));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Cargar Rutas ---
// Pasamos 'app' a nuestro archivo de rutas para que las registre
require('./app/routes/index.routes.js')(app);

// --- Puerto del Servidor ---
const PORT = process.env.PORT || 8080;

// --- FUNCIÓN PRINCIPAL PARA INICIAR LA APLICACIÓN ---
// Usamos async/await para un código más limpio y secuencial.
const start = async () => {
  try {
    // 1. CONFIGURAR LA BASE DE DATOS
    // Esto sincroniza las tablas y crea los roles y usuarios iniciales
    await setupDatabase();
    console.log("✅ Base de datos configurada correctamente");

    // 2. INICIAMOS EL SERVIDOR EXPRESS
    // Esto solo ocurre si la conexión y sincronización con la BD fue exitosa.
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📡 Tu servicio estará disponible en tu URL de Render`);
    });

  } catch (error) {
    // Si hay un error al conectar o sincronizar la BD, lo capturamos aquí.
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1); // Cierra la aplicación si no se puede conectar a la BD.
  }
};

// --- EJECUTAMOS LA FUNCIÓN PARA ARRANCAR TODO ---
start();