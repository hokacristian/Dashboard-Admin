const prisma = require('../config/prismaConfig');
const { hashPassword, comparePassword } = require('../utils/bcryptUtils');
const { generateToken } = require('../utils/jwtUtils');
const { successResponse, errorResponse } = require('../utils/responseUtils');

// Login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return errorResponse(res, 401, 'Username atau password salah');
    }

    // Check if user is active
    if (!user.is_active) {
      return errorResponse(res, 403, 'Akun Anda tidak aktif. Hubungi administrator');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Username atau password salah');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, 200, 'Login berhasil', {
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get current user info
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nama_lengkap: true,
        foto_profil: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }

    return successResponse(res, 200, 'Data user berhasil diambil', user);
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(old_password, user.password);

    if (!isOldPasswordValid) {
      return errorResponse(res, 401, 'Password lama tidak sesuai');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(new_password);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return successResponse(res, 200, 'Password berhasil diubah');
  } catch (error) {
    next(error);
  }
};

// Logout (optional - typically handled on client side by removing token)
const logout = async (req, res) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token from storage
  return successResponse(res, 200, 'Logout berhasil');
};

module.exports = {
  login,
  getMe,
  changePassword,
  logout
};
