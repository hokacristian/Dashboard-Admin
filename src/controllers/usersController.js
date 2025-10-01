const prisma = require('../config/prismaConfig');
const { hashPassword } = require('../utils/bcryptUtils');
const { successResponse, errorResponse, paginationResponse } = require('../utils/responseUtils');

// Get all users with filters
const getAllUsers = async (req, res, next) => {
  try {
    const { role, is_active, page = 1, limit = 10, search } = req.query;

    // Build where clause
    const where = {};

    if (role) {
      where.role = role;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nama_lengkap: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
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
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });

    return paginationResponse(res, 200, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        nama_lengkap: true,
        foto_profil: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            created_events: true,
            assigned_events: true,
            progress_reports: true
          }
        }
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

// Create new user (Admin only - no self-registration)
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, nama_lengkap, foto_profil } = req.body;

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return errorResponse(res, 409, 'Username sudah digunakan');
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return errorResponse(res, 409, 'Email sudah digunakan');
    }

    // Hash password - use default password if not provided
    const defaultPassword = password || 'password123';
    const hashedPassword = await hashPassword(defaultPassword);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        nama_lengkap,
        foto_profil
      },
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

    return successResponse(res, 201, 'User berhasil dibuat', {
      user: newUser,
      default_password: password ? undefined : defaultPassword
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, role, nama_lengkap, foto_profil, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }

    // Check if new username is taken (if changing)
    if (username && username !== user.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return errorResponse(res, 409, 'Username sudah digunakan');
      }
    }

    // Check if new email is taken (if changing)
    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return errorResponse(res, 409, 'Email sudah digunakan');
      }
    }

    // Prepare update data
    const updateData = {
      ...(username && { username }),
      ...(email && { email }),
      ...(role && { role }),
      ...(nama_lengkap && { nama_lengkap }),
      ...(foto_profil !== undefined && { foto_profil })
    };

    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return successResponse(res, 200, 'User berhasil diupdate', updatedUser);
  } catch (error) {
    next(error);
  }
};

// Delete user (soft delete by setting is_active to false)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }

    // Prevent deleting own account
    if (id === req.user.id) {
      return errorResponse(res, 400, 'Anda tidak dapat menghapus akun Anda sendiri');
    }

    // Soft delete by setting is_active to false
    await prisma.user.update({
      where: { id },
      data: { is_active: false }
    });

    return successResponse(res, 200, 'User berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

// Get all petugas (for assignment dropdown)
const getAllPetugas = async (req, res, next) => {
  try {
    const petugas = await prisma.user.findMany({
      where: {
        role: 'petugas',
        is_active: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama_lengkap: true,
        foto_profil: true
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    return successResponse(res, 200, 'Data petugas berhasil diambil', petugas);
  } catch (error) {
    next(error);
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }

    // Prevent toggling own status
    if (id === req.user.id) {
      return errorResponse(res, 400, 'Anda tidak dapat mengubah status akun Anda sendiri');
    }

    // Toggle status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
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

    return successResponse(
      res,
      200,
      `User berhasil ${updatedUser.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      updatedUser
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllPetugas,
  toggleUserStatus
};
