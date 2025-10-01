const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId from parent router
const progressController = require('../controllers/progressController');
const { verifyTokenMiddleware, isPetugas, canAccessEvent } = require('../middleware/authMiddleware');
const { createProgressValidation } = require('../middleware/validatorMiddleware');
const { upload, uploadProgressPhotos } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/events/:eventId/progress - Get progress reports for event
router.get('/', canAccessEvent, progressController.getProgressByEvent);

// POST /api/events/:eventId/progress - Create progress report (Petugas only)
router.post(
  '/',
  isPetugas,
  canAccessEvent,
  upload.array('photos', parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10),
  uploadProgressPhotos,
  createProgressValidation,
  progressController.createProgress
);

module.exports = router;
