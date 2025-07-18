// middleware/uploadFiles.js (Versión Final y Robusta)

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');
const path = require('path');

// --- INICIO DE LA CORRECCIÓN FINAL ---
// Configuración explícita de Cloudinary.
// Le pasamos directamente las variables de entorno para evitar cualquier ambigüedad.
// Esto asegura que la configuración es correcta en el momento exacto en que se usa.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Y mantenemos la opción de URLs seguras
});
console.log('[Cloudinary Config] Cloudinary has been configured.');
// --- FIN DE LA CORRECCIÓN FINAL ---


// --- Configuración de Multer (sin cambios) ---
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
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 25 },
  fileFilter: fileFilter,
});


// --- Middleware principal de subida (con el logging que ya teníamos) ---
const projectUploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: "fichaTecnica", maxCount: 1 },
    { name: "modeloCanva", maxCount: 1 },
    { name: "pdfProyecto", maxCount: 1 },
  ])(req, res, async function (err) {
    if (err) {
      console.error('❌ [Multer Error] Error during file processing:', err);
      return res.status(err.status || 400).json({ message: err.message });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('➡️ No files were uploaded, proceeding to controller.');
      return next();
    }
    
    console.log('🚀 [Cloudinary] Starting upload process...');

    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        const public_id = `${file.fieldname}-${Date.now()}`;
        
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "raw", 
            folder: "proyectos_pdf",
            public_id: public_id,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            result.fieldname = file.fieldname;
            resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    };

    try {
      const uploadPromises = [];
      
      for (const fieldName in req.files) {
        const files = req.files[fieldName];
        for (const file of files) {
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
      console.error("❌❌❌ [Cloudinary Upload Failed] An error occurred during the upload process. ❌❌❌");
      console.error("Error Details:", uploadError);
      return res.status(500).json({
        message: "Error al subir los archivos a la nube.",
        detailedError: uploadError.message || 'No detailed error message available from Cloudinary.',
        errorCode: uploadError.http_code || 500
      });
    }
  });
};

module.exports = {
  projectUploadMiddleware,
};