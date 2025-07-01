// middleware/uploadExcel.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(process.cwd(), "temp_uploads"); // Carpeta temporal

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const excelFileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
    file.mimetype === 'application/vnd.ms-excel' // .xls (exceljs puede tener problemas con .xls antiguos)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files (.xlsx) are allowed.'), false);
  }
};

const uploadExcel = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Límite de 10MB
  fileFilter: excelFileFilter
});

// Middleware para un solo archivo Excel, con el fieldname 'excelFile'
const excelUploadMiddleware = uploadExcel.single('excelFile');

module.exports = {
  excelUploadMiddleware,
};