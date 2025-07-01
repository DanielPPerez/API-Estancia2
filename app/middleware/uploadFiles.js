// middleware/uploadFiles.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directorio para las subidas (ej. en la raíz del proyecto)
// Asegúrate de que esta ruta sea la correcta para tu entorno de despliegue (Render)
// Si '/var/data/uploads' es una ruta absoluta fija en Render, úsala directamente:
// const UPLOADS_DIR = "/var/data/uploads";
const UPLOADS_DIR = path.join(process.cwd(), "uploads"); // Carpeta 'uploads' en la raíz del proyecto

// Crear el directorio si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Uploads directory created at: ${UPLOADS_DIR}`);
  } catch (err) {
    console.error(`Error creating uploads directory at ${UPLOADS_DIR}:`, err);
    // Considera qué hacer si no se puede crear el directorio. ¿Detener la app?
  }
} else {
    console.log(`Uploads directory already exists at: ${UPLOADS_DIR}`);
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Usar un nombre de archivo más único para evitar colisiones y problemas con caracteres especiales
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const fileFilter = (req, file, cb) => {
  // Solo aceptar PDF para los campos de proyecto
  if (
    (file.fieldname === 'fichaTecnica' || file.fieldname === 'modeloCanva' || file.fieldname === 'pdfProyecto') &&
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF para los documentos del proyecto.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 25 }, // 25MB
  fileFilter: fileFilter
});

// Middleware para los campos específicos de un proyecto
const projectUploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: "fichaTecnica", maxCount: 1 },
    { name: "modeloCanva", maxCount: 1 },
    { name: "pdfProyecto", maxCount: 1 },
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error de subida de archivos: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Middleware para un solo archivo (ej. avatar de usuario)
const singleFileUploadMiddleware = (fieldName) => upload.single(fieldName);


module.exports = {
  projectUploadMiddleware,
  singleFileUploadMiddleware,
  upload // Exportar la instancia de multer si necesitas más configuraciones específicas
};