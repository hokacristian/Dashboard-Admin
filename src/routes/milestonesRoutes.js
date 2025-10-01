const express = require('express');
const router = express.Router();
const milestonesController = require('../controllers/milestonesController');
const { verifyTokenMiddleware, isAdmin, canAccessEvent } = require('../middleware/authMiddleware');
const { createMilestoneValidation, updateMilestoneValidation } = require('../middleware/validatorMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/milestones/:id - Get milestone by ID
router.get('/:id', milestonesController.getMilestoneById);

// PUT /api/milestones/:id - Update milestone (Admin only)
router.put('/:id', isAdmin, updateMilestoneValidation, milestonesController.updateMilestone);

// DELETE /api/milestones/:id - Delete milestone (Admin only, soft delete)
router.delete('/:id', isAdmin, milestonesController.deleteMilestone);

// PATCH /api/milestones/:id/status - Update milestone status (Admin only)
router.patch('/:id/status', isAdmin, milestonesController.updateMilestoneStatus);

module.exports = router;
