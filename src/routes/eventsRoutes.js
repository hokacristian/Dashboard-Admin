const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { verifyTokenMiddleware, isAdmin, canAccessEvent } = require('../middleware/authMiddleware');
const { createEventValidation, updateEventValidation, assignPetugasValidation } = require('../middleware/validatorMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/events - Get all events (filtered by role)
router.get('/', eventsController.getAllEvents);

// GET /api/events/:id - Get event by ID
router.get('/:id', canAccessEvent, eventsController.getEventById);

// POST /api/events - Create event (Admin only)
router.post('/', isAdmin, createEventValidation, eventsController.createEvent);

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', isAdmin, updateEventValidation, eventsController.updateEvent);

// DELETE /api/events/:id - Delete event (Admin only, soft delete)
router.delete('/:id', isAdmin, eventsController.deleteEvent);

// PATCH /api/events/:id/status - Update event status (Admin only)
router.patch('/:id/status', isAdmin, eventsController.updateEventStatus);

// POST /api/events/:id/petugas - Assign petugas to event (Admin only)
router.post('/:id/petugas', isAdmin, assignPetugasValidation, eventsController.assignPetugas);

// DELETE /api/events/:id/petugas/:petugasId - Remove petugas from event (Admin only)
router.delete('/:id/petugas/:petugasId', isAdmin, eventsController.removePetugas);

// GET /api/events/:id/petugas - Get petugas assigned to event
router.get('/:id/petugas', canAccessEvent, eventsController.getEventPetugas);

module.exports = router;
