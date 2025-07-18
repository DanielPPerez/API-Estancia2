// middleware/uploadFiles.js (Versión para Cloudinary con Logging Mejorado)

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');
const path = require('path'); // Importamos path para manejar extensiones de archivo

// --- Configuración de Cloudinary ---
cloudinary.config({
  secure: true,
});

// --- Configuración de Multer ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(`[Multer] 🔍 Checking file: ${file.originalname} (${file.mimetype}) for field: ${file.fieldname}`);
  
  if (
    (file.fieldname === 'fichaTecnica' || file.fieldname === 'modeloCanva' || file.fieldname === 'pdfProyecto') &&
    file.mimetype === 'application/pdf'
  ) {
    console.log(`[Multer] ✅ File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`[Multer] ❌ File rejected: ${file.originalname}`);
    const error = new Error(`Solo se permiten archivos PDF para ${file.fieldname}.`);
    error.status = 400; // Asignamos un status al error
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 25 }, // Límite de 25MB
  fileFilter: fileFilter,
});


// --- Middleware principal de subida ---
const projectUploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: "fichaTecnica", maxCount: 1 },
    { name: "modeloCanva", maxCount: 1 },
    { name: "pdfProyecto", maxCount: 1 },
  ])(req, res, async function (err) {
    if (err) {
      console.error('❌ [Multer Error] Error during file processing:', err);
      // Multer a menudo añade un código, si no, es un error del fileFilter
      return res.status(err.status || 400).json({ message: err.message });
    }

    // Si no hay archivos, no hay nada que subir, pasamos al siguiente middleware.
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('➡️ No files were uploaded, proceeding to controller.');
      return next();
    }
    
    console.log('🚀 [Cloudinary] Starting upload process...');

    // Función para subir un solo archivo desde un buffer
    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        
        // Generamos un public_id más robusto usando el fieldname
        const fileExtension = path.extname(file.originalname);
        const public_id = `${file.fieldname}-${Date.now()}`;
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw", 
            folder: "proyectos_pdf",
            public_id: public_id,
            // Opcional: para que el archivo se descargue con un nombre legible
            use_filename: true,
            original_filename: file.originalname
          },
          (error, result) => {
            if (error) {
              // Si hay un error, lo rechazamos para que el catch principal lo capture.
              return reject(error);
            }
            // Agregamos el fieldname al resultado para poder identificarlo fácilmente después.
            result.fieldname = file.fieldname;
            resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    };

    try {
      const uploadPromises = [];
      
      // Iteramos sobre los archivos que multer nos dio.
      // `req.files` es un objeto como { fichaTecnica: [file], modeloCanva: [file] }
      for (const fieldName in req.files) {
        const files = req.files[fieldName];
        for (const file of files) {
          // Importante: Añadimos el fieldName al objeto 'file' para usarlo en la subida.
          file.fieldname = fieldName;
          console.log(`[Cloudinary] 📤 Preparing to upload: ${file.originalname} for field ${fieldName}`);
          uploadPromises.push(uploadToCloudinary(file));
        }
      }

      const uploadResults = await Promise.all(uploadPromises);

      req.cloudinary_files = uploadResults;
      
      console.log('✅ [Cloudinary] All files uploaded successfully.');
      next();

    } catch (uploadError) {
      // --- ESTE ES EL BLOQUE DE LOGGING MÁS IMPORTANTE ---
      console.error("❌❌❌ [Cloudinary Upload Failed] An error occurred during the upload process. ❌❌❌");
      console.error("Error Details:", uploadError); // Loguea el objeto de error completo.

      // Enviamos una respuesta detallada al frontend para la depuración.
      return res.status(500).json({
        message: "Error al subir los archivos a la nube.",
        // Incluimos el mensaje específico del error de Cloudinary.
        detailedError: uploadError.message || 'No detailed error message available from Cloudinary.',
        // Opcional: incluir el código de error HTTP si está disponible.
        errorCode: uploadError.http_code || 500
      });
    }
  });
};

module.exports = {
  projectUploadMiddleware,
};