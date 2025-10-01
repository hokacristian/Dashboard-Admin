const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyTokenMiddleware, isPetugas } = require('../middleware/authMiddleware');
const { upload, uploadProgressPhotos } = require('../middleware/uploadMiddleware');

// All routes require authentication and Petugas role
router.use(verifyTokenMiddleware, isPetugas);

// POST /api/upload/progress-photos - Upload multiple photos
// This endpoint can be used to pre-upload photos before creating progress report
router.post(
  '/progress-photos',
  upload.array('photos', parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10),
  uploadProgressPhotos,
  uploadController.uploadProgressPhotos
);

module.exports = router;
