const express = require("express");
const cors = require("cors");
require('dotenv').config(); // Cargar variables de entorno desde .env

const app = express();

// Configuración de CORS
// Es más seguro especificar los orígenes permitidos en producción
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : ["http://localhost:8081", "http://localhost:5173"];
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (como apps móviles o Postman) en desarrollo
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Si vas a usar cookies o encabezados de autorización
};
app.use(cors(corsOptions));


// Middlewares para parsear el cuerpo de las solicitudes
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// ------ Conexión a la Base de Datos (mysql2) ------
// El pool se inicializa y se prueba la conexión en db.connection.js
// Solo necesitas requerirlo si vas a usar el pool directamente aquí,
// pero usualmente los controladores lo importarán.
const pool = require('./app/config/db.config.js');// Asegúrate que la ruta es correcta
  
// ------ Inicialización de Datos (Roles) ------
// Esta función ahora debe usar SQL directo.
async function initializeRoles() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Checking and initializing roles...");

    const rolesToCreate = [
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" },
      { id: 4, name: "evaluador" } 
    ];

    for (const role of rolesToCreate) {
      // Intentar insertar ignorando si ya existe por nombre (o por id si el id es fijo)
      // La tabla `roles` tiene `name` como UNIQUE.
      try {
        await connection.query("INSERT INTO roles (name) VALUES (?)", [role.name.toLowerCase()]);
        console.log(`Role '${role.name}' created or already exists.`);
      } catch (insertError) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          // console.log(`Role '${role.name}' already exists.`);
        } else {
          // Si el error es por 'id' duplicado y tu tabla roles tiene id como PK autoincremental
          // y no quieres forzar los IDs, entonces la lógica de inserción debería ser solo por nombre.
          // Si el id ES FIJO y no autoincremental, el insert sería:
          // await connection.query("INSERT INTO roles (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name", [role.id, role.name.toLowerCase()]);
          // console.log(`Role '${role.name}' (ID: ${role.id}) checked/created.`);
          console.error(`Error inserting role ${role.name}:`, insertError.message);
        }
      }
    }
    console.log("Roles initialization complete.");
  } catch (err) {
    console.error("Error during roles initialization:", err);
  } finally {
    if (connection) connection.release();
  }
}

// Llamar a la inicialización de roles al iniciar el servidor
initializeRoles();


// ------ Cargar Rutas ------
// Usar el archivo index.routes.js para agrupar todas las rutas
require('./app/routes/index.routes.js')(app); // Asegúrate que la ruta es correcta


// ------ Puerto y Arranque del Servidor ------
const PORT = process.env.PORT || 8080; // Usar el puerto 8080 como default si no está en .env
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Access the API at http://localhost:${PORT}/api`); 
});