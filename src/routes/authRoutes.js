const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyTokenMiddleware } = require('../middleware/authMiddleware');
const { loginValidation, changePasswordValidation } = require('../middleware/validatorMiddleware');

// POST /api/auth/login - Login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/logout - Logout
router.post('/logout', verifyTokenMiddleware, authController.logout);

// GET /api/auth/me - Get current user info
router.get('/me', verifyTokenMiddleware, authController.getMe);

// PUT /api/auth/change-password - Change password
router.put('/change-password', verifyTokenMiddleware, changePasswordValidation, authController.changePassword);

module.exports = router;
