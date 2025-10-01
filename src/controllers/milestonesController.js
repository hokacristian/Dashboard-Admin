const prisma = require('../config/prismaConfig');
const { successResponse, errorResponse } = require('../utils/responseUtils');

// Get all milestones for an event
const getMilestonesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id: eventId, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    const milestones = await prisma.milestone.findMany({
      where: {
        event_id: eventId,
        is_active: true
      },
      include: {
        _count: {
          select: {
            progress_reports: true
          }
        }
      },
      orderBy: { urutan: 'asc' }
    });

    return successResponse(res, 200, 'Data milestones berhasil diambil', milestones);
  } catch (error) {
    next(error);
  }
};

// Get milestone by ID
const getMilestoneById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findFirst({
      where: {
        id,
        is_active: true
      },
      include: {
        event: {
          select: {
            id: true,
            nama_tender: true,
            lokasi: true
          }
        },
        progress_reports: {
          where: { is_active: true },
          include: {
            petugas: {
              select: {
                id: true,
                username: true,
                nama_lengkap: true,
                foto_profil: true
              }
            }
          },
          orderBy: { tanggal_laporan: 'desc' }
        },
        _count: {
          select: {
            progress_reports: true
          }
        }
      }
    });

    if (!milestone) {
      return errorResponse(res, 404, 'Milestone tidak ditemukan');
    }

    return successResponse(res, 200, 'Data milestone berhasil diambil', milestone);
  } catch (error) {
    next(error);
  }
};

// Create milestone (Admin only)
const createMilestone = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { nama_milestone, deskripsi, deadline, urutan, status } = req.body;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id: eventId, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Check if urutan already exists for this event
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        event_id: eventId,
        urutan: parseInt(urutan),
        is_active: true
      }
    });

    if (existingMilestone) {
      return errorResponse(res, 409, `Urutan ${urutan} sudah digunakan untuk event ini`);
    }

    const newMilestone = await prisma.milestone.create({
      data: {
        event_id: eventId,
        nama_milestone,
        deskripsi,
        deadline: new Date(deadline),
        urutan: parseInt(urutan),
        status: status || 'pending'
      },
      include: {
        event: {
          select: {
            id: true,
            nama_tender: true
          }
        }
      }
    });

    return successResponse(res, 201, 'Milestone berhasil dibuat', newMilestone);
  } catch (error) {
    next(error);
  }
};

// Update milestone (Admin only)
const updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_milestone, deskripsi, deadline, urutan, status } = req.body;

    // Check if milestone exists
    const milestone = await prisma.milestone.findFirst({
      where: { id, is_active: true }
    });

    if (!milestone) {
      return errorResponse(res, 404, 'Milestone tidak ditemukan');
    }

    // Check if new urutan conflicts with existing milestone
    if (urutan && parseInt(urutan) !== milestone.urutan) {
      const existingMilestone = await prisma.milestone.findFirst({
        where: {
          event_id: milestone.event_id,
          urutan: parseInt(urutan),
          is_active: true,
          NOT: { id }
        }
      });

      if (existingMilestone) {
        return errorResponse(res, 409, `Urutan ${urutan} sudah digunakan untuk event ini`);
      }
    }

    // Prepare update data
    const updateData = {};

    if (nama_milestone) updateData.nama_milestone = nama_milestone;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (deadline) updateData.deadline = new Date(deadline);
    if (urutan) updateData.urutan = parseInt(urutan);
    if (status) updateData.status = status;

    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            nama_tender: true
          }
        }
      }
    });

    return successResponse(res, 200, 'Milestone berhasil diupdate', updatedMilestone);
  } catch (error) {
    next(error);
  }
};

// Delete milestone (Admin only - soft delete)
const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findFirst({
      where: { id, is_active: true }
    });

    if (!milestone) {
      return errorResponse(res, 404, 'Milestone tidak ditemukan');
    }

    // Soft delete
    await prisma.milestone.update({
      where: { id },
      data: { is_active: false }
    });

    return successResponse(res, 200, 'Milestone berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

// Update milestone status (Admin only)
const updateMilestoneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'on_progress', 'completed'].includes(status)) {
      return errorResponse(res, 400, 'Status tidak valid');
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id, is_active: true }
    });

    if (!milestone) {
      return errorResponse(res, 404, 'Milestone tidak ditemukan');
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: { status },
      include: {
        event: {
          select: {
            id: true,
            nama_tender: true
          }
        }
      }
    });

    return successResponse(res, 200, 'Status milestone berhasil diupdate', updatedMilestone);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMilestonesByEvent,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  updateMilestoneStatus
};
