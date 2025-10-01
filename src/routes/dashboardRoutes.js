const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyTokenMiddleware, isAdminOrSupervisor } = require('../middleware/authMiddleware');

// All routes require authentication and Admin or Supervisor role
router.use(verifyTokenMiddleware, isAdminOrSupervisor);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/events-summary - Get events summary with progress
router.get('/events-summary', dashboardController.getEventsSummary);

// GET /api/dashboard/recent-activities - Get recent activities
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
