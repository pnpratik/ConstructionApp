const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage for drawings
const drawingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/drawings');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `drawing-${unique}${path.extname(file.originalname)}`);
  }
});

// Storage for delivery challans & photos
const deliveryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/challans');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `delivery-${unique}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) cb(null, true);
  else cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`), false);
};

// Drawing upload (PDF, DWG, PNG, JPG)
const uploadDrawing = multer({
  storage: drawingStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(['.pdf', '.dwg', '.png', '.jpg', '.jpeg', '.dxf'])
});

// Delivery upload (PDF, PNG, JPG)
const uploadDelivery = multer({
  storage: deliveryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(['.pdf', '.png', '.jpg', '.jpeg'])
});

module.exports = { uploadDrawing, uploadDelivery };
