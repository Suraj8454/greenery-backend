
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(
  __dirname,
  '..',
  'public',
  'uploads',
  'website'
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `website-logo-${Date.now()}${ext}`
    );
  }
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error('Only JPG, PNG, WEBP and SVG logos are allowed.'));
  }
});
