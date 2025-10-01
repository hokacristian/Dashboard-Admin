const multer = require('multer');
const imagekit = require('../config/imagekitConfig');
const { errorResponse } = require('../utils/responseUtils');

// Multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png').split(',');
  const fileExtension = file.mimetype.split('/')[1];

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file tidak diizinkan. Hanya ${allowedTypes.join(', ')} yang diperbolehkan`), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  fileFilter: fileFilter
});

// Upload to ImageKit
const uploadToImageKit = async (file, folder = 'tender-photos') => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;

    const result = await imagekit.upload({
      file: file.buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name
    };
  } catch (error) {
    throw new Error(`Gagal upload ke ImageKit: ${error.message}`);
  }
};

// Middleware to handle multiple photo uploads
const uploadProgressPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, 'Minimal 1 foto harus diupload');
    }

    const maxFiles = parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10;
    if (req.files.length > maxFiles) {
      return errorResponse(res, 400, `Maksimal ${maxFiles} foto per upload`);
    }

    // Upload all files to ImageKit
    const uploadPromises = req.files.map(file =>
      uploadToImageKit(file, `tender-photos/${req.params.eventId || 'general'}`)
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Store URLs in request for controller to use
    req.uploadedPhotos = uploadResults.map(result => result.url);

    next();
  } catch (error) {
    return errorResponse(res, 500, 'Gagal mengupload foto', error.message);
  }
};

// Delete photos from ImageKit
const deleteFromImageKit = async (fileIds) => {
  try {
    const deletePromises = fileIds.map(fileId =>
      imagekit.deleteFile(fileId)
    );
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting from ImageKit:', error.message);
    return false;
  }
};

// Extract fileId from ImageKit URL
const extractFileIdFromUrl = (url) => {
  // ImageKit URL format: https://ik.imagekit.io/{urlEndpoint}/path/fileId_uniqueId.ext
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const fileId = fileName.split('_')[0];
  return fileId;
};

module.exports = {
  upload,
  uploadToImageKit,
  uploadProgressPhotos,
  deleteFromImageKit,
  extractFileIdFromUrl
};
