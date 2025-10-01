const prisma = require('../config/prismaConfig');
const { successResponse, errorResponse, paginationResponse } = require('../utils/responseUtils');

// Get all events (filtered by role)
const getAllEvents = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    const where = { is_active: true };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { nama_tender: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by role
    if (userRole === 'petugas') {
      // Petugas only see assigned events
      where.assigned_petugas = {
        some: {
          petugas_id: userId
        }
      };
    }

    // Get total count
    const total = await prisma.event.count({ where });

    // Get events with relations
    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        },
        assigned_petugas: {
          include: {
            petugas: {
              select: {
                id: true,
                username: true,
                nama_lengkap: true,
                foto_profil: true
              }
            }
          }
        },
        milestones: {
          where: { is_active: true },
          orderBy: { urutan: 'asc' }
        },
        _count: {
          select: {
            progress_reports: true
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });

    return paginationResponse(res, 200, events, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        is_active: true
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        },
        assigned_petugas: {
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
            assigned_by_user: {
              select: {
                id: true,
                username: true,
                nama_lengkap: true
              }
            }
          }
        },
        milestones: {
          where: { is_active: true },
          orderBy: { urutan: 'asc' },
          include: {
            _count: {
              select: {
                progress_reports: true
              }
            }
          }
        },
        progress_reports: {
          where: { is_active: true },
          orderBy: { tanggal_laporan: 'desc' },
          take: 5,
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
            }
          }
        },
        _count: {
          select: {
            progress_reports: true
          }
        }
      }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    return successResponse(res, 200, 'Data event berhasil diambil', event);
  } catch (error) {
    next(error);
  }
};

// Create new event (Admin only)
const createEvent = async (req, res, next) => {
  try {
    const { nama_tender, lokasi, deskripsi, budget, tanggal_mulai, tanggal_selesai, status } = req.body;
    const userId = req.user.id;

    const newEvent = await prisma.event.create({
      data: {
        nama_tender,
        lokasi,
        deskripsi,
        budget: budget ? parseFloat(budget) : null,
        tanggal_mulai: new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
        status: status || 'planning',
        created_by: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        }
      }
    });

    return successResponse(res, 201, 'Event berhasil dibuat', newEvent);
  } catch (error) {
    next(error);
  }
};

// Update event (Admin only)
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_tender, lokasi, deskripsi, budget, tanggal_mulai, tanggal_selesai, status } = req.body;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Prepare update data
    const updateData = {};

    if (nama_tender) updateData.nama_tender = nama_tender;
    if (lokasi) updateData.lokasi = lokasi;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (tanggal_mulai) updateData.tanggal_mulai = new Date(tanggal_mulai);
    if (tanggal_selesai) updateData.tanggal_selesai = new Date(tanggal_selesai);
    if (status) updateData.status = status;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        },
        assigned_petugas: {
          include: {
            petugas: {
              select: {
                id: true,
                username: true,
                nama_lengkap: true
              }
            }
          }
        }
      }
    });

    return successResponse(res, 200, 'Event berhasil diupdate', updatedEvent);
  } catch (error) {
    next(error);
  }
};

// Delete event (Admin only - soft delete)
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: { id, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Soft delete
    await prisma.event.update({
      where: { id },
      data: { is_active: false }
    });

    return successResponse(res, 200, 'Event berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

// Update event status (Admin only)
const updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['planning', 'on_progress', 'completed', 'cancelled'].includes(status)) {
      return errorResponse(res, 400, 'Status tidak valid');
    }

    const event = await prisma.event.findFirst({
      where: { id, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        }
      }
    });

    return successResponse(res, 200, 'Status event berhasil diupdate', updatedEvent);
  } catch (error) {
    next(error);
  }
};

// Assign petugas to event (Admin only)
const assignPetugas = async (req, res, next) => {
  try {
    const { id } = req.params; // event_id
    const { petugas_ids } = req.body;
    const adminId = req.user.id;

    // Check if event exists
    const event = await prisma.event.findFirst({
      where: { id, is_active: true }
    });

    if (!event) {
      return errorResponse(res, 404, 'Event tidak ditemukan');
    }

    // Check if all petugas exist and have role 'petugas'
    const petugasList = await prisma.user.findMany({
      where: {
        id: { in: petugas_ids },
        role: 'petugas',
        is_active: true
      }
    });

    if (petugasList.length !== petugas_ids.length) {
      return errorResponse(res, 400, 'Beberapa petugas tidak valid atau tidak aktif');
    }

    // Assign petugas (createMany will skip duplicates due to unique constraint)
    const assignments = await Promise.all(
      petugas_ids.map(async (petugas_id) => {
        try {
          return await prisma.eventPetugas.create({
            data: {
              event_id: id,
              petugas_id,
              assigned_by: adminId
            },
            include: {
              petugas: {
                select: {
                  id: true,
                  username: true,
                  nama_lengkap: true,
                  email: true,
                  foto_profil: true
                }
              }
            }
          });
        } catch (error) {
          // Skip if already assigned
          if (error.code === 'P2002') {
            return null;
          }
          throw error;
        }
      })
    );

    const successfulAssignments = assignments.filter(a => a !== null);

    return successResponse(res, 201, 'Petugas berhasil di-assign ke event', {
      assigned: successfulAssignments,
      total: successfulAssignments.length
    });
  } catch (error) {
    next(error);
  }
};

// Remove petugas from event (Admin only)
const removePetugas = async (req, res, next) => {
  try {
    const { id, petugasId } = req.params; // event_id, petugas_id

    const assignment = await prisma.eventPetugas.findFirst({
      where: {
        event_id: id,
        petugas_id: petugasId
      }
    });

    if (!assignment) {
      return errorResponse(res, 404, 'Assignment tidak ditemukan');
    }

    await prisma.eventPetugas.delete({
      where: { id: assignment.id }
    });

    return successResponse(res, 200, 'Petugas berhasil di-remove dari event');
  } catch (error) {
    next(error);
  }
};

// Get petugas assigned to event
const getEventPetugas = async (req, res, next) => {
  try {
    const { id } = req.params; // event_id

    const assignments = await prisma.eventPetugas.findMany({
      where: {
        event_id: id
      },
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            email: true,
            nama_lengkap: true,
            foto_profil: true
          }
        },
        assigned_by_user: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });

    return successResponse(res, 200, 'Data petugas berhasil diambil', assignments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  assignPetugas,
  removePetugas,
  getEventPetugas
};
