const { verifyToken } = require('../utils/jwtUtils');
const { errorResponse } = require('../utils/responseUtils');
const prisma = require('../config/prismaConfig');

// Verify JWT Token
const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nama_lengkap: true,
        is_active: true
      }
    });

    if (!user) {
      return errorResponse(res, 401, 'User tidak ditemukan');
    }

    if (!user.is_active) {
      return errorResponse(res, 403, 'Akun Anda tidak aktif');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Token tidak valid atau telah kadaluarsa');
  }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Akses ditolak. Hanya admin yang diizinkan');
  }
  next();
};

// Check if user is Supervisor
const isSupervisor = (req, res, next) => {
  if (req.user.role !== 'supervisor') {
    return errorResponse(res, 403, 'Akses ditolak. Hanya supervisor yang diizinkan');
  }
  next();
};

// Check if user is Petugas
const isPetugas = (req, res, next) => {
  if (req.user.role !== 'petugas') {
    return errorResponse(res, 403, 'Akses ditolak. Hanya petugas yang diizinkan');
  }
  next();
};

// Check if user is Admin or Supervisor
const isAdminOrSupervisor = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    return errorResponse(res, 403, 'Akses ditolak. Hanya admin atau supervisor yang diizinkan');
  }
  next();
};

// Check if petugas can access event
const canAccessEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const userId = req.user.id;

    // Admin and Supervisor can access all events
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
      return next();
    }

    // Petugas can only access assigned events
    const assignment = await prisma.eventPetugas.findFirst({
      where: {
        event_id: eventId,
        petugas_id: userId
      }
    });

    if (!assignment) {
      return errorResponse(res, 403, 'Anda tidak memiliki akses ke event ini');
    }

    next();
  } catch (error) {
    return errorResponse(res, 500, 'Terjadi kesalahan saat memeriksa akses', error.message);
  }
};

// Check if petugas can modify progress report
const canModifyProgress = async (req, res, next) => {
  try {
    const progressId = req.params.id;
    const userId = req.user.id;

    const progress = await prisma.progressReport.findUnique({
      where: { id: progressId }
    });

    if (!progress) {
      return errorResponse(res, 404, 'Progress report tidak ditemukan');
    }

    // Only the owner can modify
    if (progress.petugas_id !== userId) {
      return errorResponse(res, 403, 'Anda hanya dapat mengubah laporan progress Anda sendiri');
    }

    next();
  } catch (error) {
    return errorResponse(res, 500, 'Terjadi kesalahan saat memeriksa kepemilikan', error.message);
  }
};

module.exports = {
  verifyTokenMiddleware,
  isAdmin,
  isSupervisor,
  isPetugas,
  isAdminOrSupervisor,
  canAccessEvent,
  canModifyProgress
};
