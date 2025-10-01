const { errorResponse } = require('../utils/responseUtils');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 400, `Ukuran file terlalu besar. Maksimal ${process.env.MAX_FILE_SIZE || 5242880} bytes`);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return errorResponse(res, 400, `Terlalu banyak file. Maksimal ${process.env.MAX_FILES_PER_UPLOAD || 10} file`);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return errorResponse(res, 400, 'Field file tidak sesuai');
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return errorResponse(res, 409, 'Data sudah ada (duplicate entry)');
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Data tidak ditemukan');
  }

  if (err.code === 'P2003') {
    return errorResponse(res, 400, 'Referensi data tidak valid');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Token tidak valid');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token telah kadaluarsa');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, 'Validasi gagal', err.message);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  return errorResponse(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} tidak ditemukan`);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
