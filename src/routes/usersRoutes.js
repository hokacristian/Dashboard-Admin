const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyTokenMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { createUserValidation, updateUserValidation } = require('../middleware/validatorMiddleware');

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/users - Get all users (Admin only)
router.get('/', isAdmin, usersController.getAllUsers);

// GET /api/users/petugas - Get all petugas (Admin only, for assignment dropdown)
router.get('/petugas', isAdmin, usersController.getAllPetugas);

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', isAdmin, usersController.getUserById);

// POST /api/users - Create new user (Admin only)
router.post('/', isAdmin, createUserValidation, usersController.createUser);

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', isAdmin, updateUserValidation, usersController.updateUser);

// DELETE /api/users/:id - Delete user (Admin only, soft delete)
router.delete('/:id', isAdmin, usersController.deleteUser);

// PATCH /api/users/:id/status - Toggle user active status (Admin only)
router.patch('/:id/status', isAdmin, usersController.toggleUserStatus);

module.exports = router;
