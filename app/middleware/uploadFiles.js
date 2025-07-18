// middleware/uploadFiles.js (Versión para Cloudinary)
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');

// --- Configuración de Cloudinary ---
// El SDK buscará automáticamente las variables de entorno:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  secure: true, // Para que siempre devuelva URLs https
});

// --- Configuración de Multer ---
// Ya no usamos diskStorage. Usaremos memoryStorage para mantener el archivo en un buffer.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(`🔍 Checking file: ${file.originalname} (${file.mimetype})`);
  
  if (
    (file.fieldname === 'fichaTecnica' || file.fieldname === 'modeloCanva' || file.fieldname === 'pdfProyecto') &&
    file.mimetype === 'application/pdf'
  ) {
    console.log(`✅ File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ File rejected: ${file.originalname}`);
    cb(new Error(`Solo se permiten archivos PDF para ${file.fieldname}.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 250 }, 
  fileFilter: fileFilter,
});

// --- Middleware principal de subida ---
// Este middleware ahora manejará la subida a Cloudinary
const projectUploadMiddleware = (req, res, next) => {
  // Primero, usamos el middleware de multer para procesar los campos
  upload.fields([
    { name: "fichaTecnica", maxCount: 1 },
    { name: "modeloCanva", maxCount: 1 },
    { name: "pdfProyecto", maxCount: 1 },
  ])(req, res, async function (err) {
    if (err) {
        console.error('❌ Multer/Upload error:', err);
        return res.status(400).json({ message: err.message });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('➡️ No files were uploaded, proceeding to next middleware.');
        return next();
    }
    
    console.log('🚀 Uploading files to Cloudinary...');

    // Función para subir un solo archivo desde un buffer
    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            // Para PDFs y otros archivos, es CRUCIAL especificar 'raw'
            resource_type: "raw", 
            folder: "proyectos_pdf", // Carpeta en Cloudinary donde se guardarán
            // Cloudinary usará el nombre original si no especificamos uno
            public_id: file.originalname.split('.')[0] + '-' + Date.now()
          },
          (error, result) => {
            if (error) {
              console.error(`❌ Cloudinary upload error for ${file.originalname}:`, error);
              return reject(error);
            }
            console.log(`✅ File ${file.originalname} uploaded to Cloudinary: ${result.secure_url}`);
            resolve(result);
          }
        );
        // Usamos streamifier para convertir el buffer del archivo en un stream legible
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    };

    try {
      // Un array para guardar las promesas de subida
      const uploadPromises = [];
      
      // Iteramos sobre los archivos que multer nos dio en req.files
      for (const fieldName in req.files) {
        const files = req.files[fieldName];
        for (const file of files) {
          uploadPromises.push(uploadToCloudinary(file));
        }
      }

      // Esperamos a que todos los archivos se suban
      const uploadResults = await Promise.all(uploadPromises);

      // Adjuntamos la información de Cloudinary a la petición para usarla en el controlador
      req.cloudinary_files = uploadResults;
      
      console.log('✅ All files uploaded to Cloudinary successfully.');
      next();

    } catch (uploadError) {
      return res.status(500).json({ message: "Error al subir los archivos a la nube." });
    }
  });
};

module.exports = {
  projectUploadMiddleware,
};