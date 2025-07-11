// middleware/uploadFiles.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directorio para las subidas
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Crear el directorio si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`📁 Uploads directory created at: ${UPLOADS_DIR}`);
  } catch (err) {
    console.error(`❌ Error creating uploads directory at ${UPLOADS_DIR}:`, err);
  }
} else {
  console.log(`📁 Uploads directory already exists at: ${UPLOADS_DIR}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`📂 Saving file: ${file.originalname} to ${UPLOADS_DIR}`);
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Usar un nombre de archivo más único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    console.log(`📝 Generated filename: ${filename}`);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  console.log(`🔍 Checking file: ${file.originalname} (${file.mimetype}) for field: ${file.fieldname}`);
  
  // Solo aceptar PDF para los campos de proyecto
  if (
    (file.fieldname === 'fichaTecnica' || file.fieldname === 'modeloCanva' || file.fieldname === 'pdfProyecto') &&
    file.mimetype === 'application/pdf'
  ) {
    console.log(`✅ File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Solo se permiten archivos PDF para ${file.fieldname}. Tipo recibido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 25 }, // 25MB
  fileFilter: fileFilter
});

// Middleware para los campos específicos de un proyecto
const projectUploadMiddleware = (req, res, next) => {
  console.log('🚀 Starting project upload middleware...');
  console.log('📋 Expected fields: fichaTecnica, modeloCanva, pdfProyecto');
  
  upload.fields([
    { name: "fichaTecnica", maxCount: 1 },
    { name: "modeloCanva", maxCount: 1 },
    { name: "pdfProyecto", maxCount: 1 },
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ message: 'Error de subida de archivos: ' + err.message });
    } else if (err) {
      console.error('❌ Upload error:', err);
      return res.status(400).json({ message: err.message });
    }
    
    console.log('✅ Upload middleware completed successfully');
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');
    
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        files.forEach(file => {
          console.log(`📄 File: ${fieldName} -> ${file.originalname} (${file.path})`);
        });
      });
    }
    
    next();
  });
};

// Middleware para un solo archivo (ej. avatar de usuario)
const singleFileUploadMiddleware = (fieldName) => upload.single(fieldName);

module.exports = {
  projectUploadMiddleware,
  singleFileUploadMiddleware,
  upload
};