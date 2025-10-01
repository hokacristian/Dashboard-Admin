const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId from parent router
const milestonesController = require('../controllers/milestonesController');
const { verifyTokenMiddleware, isAdmin, canAccessEvent } = require('../middleware/authMiddleware');
const { createMilestoneValidation } = require('../middleware/validatorMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/events/:eventId/milestones - Get milestones for event
router.get('/', canAccessEvent, milestonesController.getMilestonesByEvent);

// POST /api/events/:eventId/milestones - Create milestone (Admin only)
router.post('/', isAdmin, createMilestoneValidation, milestonesController.createMilestone);

module.exports = router;
