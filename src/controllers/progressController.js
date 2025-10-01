const prisma = require('../config/prismaConfig');
const { successResponse, errorResponse, paginationResponse } = require('../utils/responseUtils');

// Get progress reports for an event
const getProgressByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, milestone_id, petugas_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id: eventId, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Build where clause
    const where = {
      event_id: eventId,
      is_active: true
    };

    // Filter by milestone if provided
    if (milestone_id) {
      where.milestone_id = milestone_id;
    }

    // Filter by petugas if provided
    if (petugas_id) {
      where.petugas_id = petugas_id;
    }

    // Petugas can only see their own progress
    if (userRole === 'petugas') {
      where.petugas_id = userId;
    }

    // Get total count
    const total = await prisma.progressReport.count({ where });

    // Get progress reports
    const progressReports = await prisma.progressReport.findMany({
      where,
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
            foto_profil: true
          }
        },
        milestone: {
          select: {
            id: true,
            nama_milestone: true,
            urutan: true
          }
        },
        event: {
          select: {
            id: true,
            nama_tender: true,
            lokasi: true
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { tanggal_laporan: 'desc' }
    });

    return paginationResponse(res, 200, progressReports, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get progress report by ID
const getProgressById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const progressReport = await prisma.progressReport.findFirst({
      where: {
        id,
        is_active: true
      },
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
            foto_profil: true,
            email: true
          }
        },
        milestone: {
          select: {
            id: true,
            nama_milestone: true,
            deskripsi: true,
            urutan: true,
            deadline: true,
            status: true
          }
        },
        event: {
          select: {
            id: true,
            nama_tender: true,
            lokasi: true,
            deskripsi: true,
            status: true
          }
        }
      }
    });

    if (!progressReport) {
      return errorResponse(res, 404, 'Progress report tidak ditemukan');
    }

    return successResponse(res, 200, 'Data progress report berhasil diambil', progressReport);
  } catch (error) {
    next(error);
  }
};

// Create progress report (Petugas only)
const createProgress = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { deskripsi, tanggal_laporan, persentase_progress, milestone_id } = req.body;
    const petugasId = req.user.id;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id: eventId, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Check if petugas is assigned to this event
    const assignment = await prisma.eventPetugas.findFirst({
      where: {
        event_id: eventId,
        petugas_id: petugasId
      }
    });

    if (!assignment) {
      return errorResponse(res, 403, 'Anda tidak di-assign ke event ini');
    }

    // Validate milestone if provided
    if (milestone_id) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestone_id,
          event_id: eventId,
          is_active: true
        }
      });

      if (!milestone) {
        return errorResponse(res, 404, 'Milestone tidak ditemukan untuk event ini');
      }
    }

    // Get uploaded photo URLs from request (set by upload middleware)
    const foto_urls = req.uploadedPhotos || [];

    if (foto_urls.length === 0) {
      return errorResponse(res, 400, 'Minimal 1 foto harus diupload');
    }

    // Create progress report
    const newProgress = await prisma.progressReport.create({
      data: {
        event_id: eventId,
        milestone_id: milestone_id || null,
        petugas_id: petugasId,
        deskripsi,
        foto_urls,
        tanggal_laporan: new Date(tanggal_laporan),
        persentase_progress: parseInt(persentase_progress)
      },
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
            foto_profil: true
          }
        },
        milestone: {
          select: {
            id: true,
            nama_milestone: true
          }
        },
        event: {
          select: {
            id: true,
            nama_tender: true
          }
        }
      }
    });

    return successResponse(res, 201, 'Progress report berhasil dibuat', newProgress);
  } catch (error) {
    next(error);
  }
};

// Update progress report (Owner only)
const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deskripsi, tanggal_laporan, persentase_progress, milestone_id } = req.body;

    // Check if progress report exists
    const progressReport = await prisma.progressReport.findFirst({
      where: { id, is_active: true }
    });

    if (!progressReport) {
      return errorResponse(res, 404, 'Progress report tidak ditemukan');
    }

    // Validate milestone if provided
    if (milestone_id) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestone_id,
          event_id: progressReport.event_id,
          is_active: true
        }
      });

      if (!milestone) {
        return errorResponse(res, 404, 'Milestone tidak ditemukan untuk event ini');
      }
    }

    // Prepare update data
    const updateData = {};

    if (deskripsi) updateData.deskripsi = deskripsi;
    if (tanggal_laporan) updateData.tanggal_laporan = new Date(tanggal_laporan);
    if (persentase_progress !== undefined) updateData.persentase_progress = parseInt(persentase_progress);
    if (milestone_id !== undefined) updateData.milestone_id = milestone_id;

    // If new photos are uploaded, add them to existing photos
    if (req.uploadedPhotos && req.uploadedPhotos.length > 0) {
      const existingPhotos = progressReport.foto_urls || [];
      updateData.foto_urls = [...existingPhotos, ...req.uploadedPhotos];
    }

    const updatedProgress = await prisma.progressReport.update({
      where: { id },
      data: updateData,
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
            foto_profil: true
          }
        },
        milestone: {
          select: {
            id: true,
            nama_milestone: true
          }
        },
        event: {
          select: {
            id: true,
            nama_tender: true
          }
        }
      }
    });

    return successResponse(res, 200, 'Progress report berhasil diupdate', updatedProgress);
  } catch (error) {
    next(error);
  }
};

// Delete progress report (Owner only - soft delete)
const deleteProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const progressReport = await prisma.progressReport.findFirst({
      where: { id, is_active: true }
    });

    if (!progressReport) {
      return errorResponse(res, 404, 'Progress report tidak ditemukan');
    }

    // Soft delete
    await prisma.progressReport.update({
      where: { id },
      data: { is_active: false }
    });

    return successResponse(res, 200, 'Progress report berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProgressByEvent,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress
};
