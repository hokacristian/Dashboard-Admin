const { body, param, query, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseUtils');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validasi gagal', errors.array());
  }
  next();
};

// Auth validation
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'supervisor', 'petugas']).withMessage('Role tidak valid'),
  body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  handleValidationErrors
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
  handleValidationErrors
];

const changePasswordValidation = [
  body('old_password').notEmpty().withMessage('Password lama wajib diisi'),
  body('new_password').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
  handleValidationErrors
];

// User validation
const createUserValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'supervisor', 'petugas']).withMessage('Role tidak valid'),
  body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  handleValidationErrors
];

const updateUserValidation = [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').optional().isEmail().withMessage('Email tidak valid'),
  body('role').optional().isIn(['admin', 'supervisor', 'petugas']).withMessage('Role tidak valid'),
  body('nama_lengkap').optional().trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  handleValidationErrors
];

// Event validation
const createEventValidation = [
  body('nama_tender').trim().notEmpty().withMessage('Nama tender wajib diisi'),
  body('lokasi').trim().notEmpty().withMessage('Lokasi wajib diisi'),
  body('tanggal_mulai').isISO8601().withMessage('Tanggal mulai tidak valid'),
  body('tanggal_selesai')
    .isISO8601().withMessage('Tanggal selesai tidak valid')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.tanggal_mulai)) {
        throw new Error('Tanggal selesai harus lebih besar dari tanggal mulai');
      }
      return true;
    }),
  body('budget').optional().isDecimal().withMessage('Budget harus berupa angka'),
  body('status').optional().isIn(['planning', 'on_progress', 'completed', 'cancelled']).withMessage('Status tidak valid'),
  handleValidationErrors
];

const updateEventValidation = [
  body('nama_tender').optional().trim().notEmpty().withMessage('Nama tender wajib diisi'),
  body('lokasi').optional().trim().notEmpty().withMessage('Lokasi wajib diisi'),
  body('tanggal_mulai').optional().isISO8601().withMessage('Tanggal mulai tidak valid'),
  body('tanggal_selesai').optional().isISO8601().withMessage('Tanggal selesai tidak valid'),
  body('budget').optional().isDecimal().withMessage('Budget harus berupa angka'),
  body('status').optional().isIn(['planning', 'on_progress', 'completed', 'cancelled']).withMessage('Status tidak valid'),
  handleValidationErrors
];

const assignPetugasValidation = [
  body('petugas_ids').isArray({ min: 1 }).withMessage('petugas_ids harus berupa array dan tidak boleh kosong'),
  body('petugas_ids.*').isUUID().withMessage('petugas_id harus berupa UUID yang valid'),
  handleValidationErrors
];

// Milestone validation
const createMilestoneValidation = [
  body('nama_milestone').trim().notEmpty().withMessage('Nama milestone wajib diisi'),
  body('deadline').isISO8601().withMessage('Deadline tidak valid'),
  body('urutan').isInt({ min: 1 }).withMessage('Urutan harus berupa angka positif'),
  body('status').optional().isIn(['pending', 'on_progress', 'completed']).withMessage('Status tidak valid'),
  handleValidationErrors
];

const updateMilestoneValidation = [
  body('nama_milestone').optional().trim().notEmpty().withMessage('Nama milestone wajib diisi'),
  body('deadline').optional().isISO8601().withMessage('Deadline tidak valid'),
  body('urutan').optional().isInt({ min: 1 }).withMessage('Urutan harus berupa angka positif'),
  body('status').optional().isIn(['pending', 'on_progress', 'completed']).withMessage('Status tidak valid'),
  handleValidationErrors
];

// Progress Report validation
const createProgressValidation = [
  body('deskripsi').trim().notEmpty().withMessage('Deskripsi wajib diisi'),
  body('tanggal_laporan')
    .isISO8601().withMessage('Tanggal laporan tidak valid')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Tanggal laporan tidak boleh di masa depan');
      }
      return true;
    }),
  body('persentase_progress')
    .isInt({ min: 0, max: 100 }).withMessage('Persentase progress harus antara 0-100'),
  body('milestone_id').optional().isUUID().withMessage('Milestone ID harus berupa UUID yang valid'),
  handleValidationErrors
];

const updateProgressValidation = [
  body('deskripsi').optional().trim().notEmpty().withMessage('Deskripsi wajib diisi'),
  body('tanggal_laporan')
    .optional()
    .isISO8601().withMessage('Tanggal laporan tidak valid')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Tanggal laporan tidak boleh di masa depan');
      }
      return true;
    }),
  body('persentase_progress')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Persentase progress harus antara 0-100'),
  body('milestone_id').optional().isUUID().withMessage('Milestone ID harus berupa UUID yang valid'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  createUserValidation,
  updateUserValidation,
  createEventValidation,
  updateEventValidation,
  assignPetugasValidation,
  createMilestoneValidation,
  updateMilestoneValidation,
  createProgressValidation,
  updateProgressValidation
};
