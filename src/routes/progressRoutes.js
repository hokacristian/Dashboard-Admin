const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { verifyTokenMiddleware, isPetugas, canModifyProgress } = require('../middleware/authMiddleware');
const { updateProgressValidation } = require('../middleware/validatorMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/progress/:id - Get progress report by ID
router.get('/:id', progressController.getProgressById);

// PUT /api/progress/:id - Update progress report (Owner only)
router.put(
  '/:id',
  canModifyProgress,
  upload.array('photos', parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10),
  updateProgressValidation,
  progressController.updateProgress
);

// DELETE /api/progress/:id - Delete progress report (Owner only, soft delete)
router.delete('/:id', canModifyProgress, progressController.deleteProgress);

module.exports = router;
