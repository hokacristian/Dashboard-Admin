const prisma = require('../config/prismaConfig');
const { successResponse, errorResponse } = require('../utils/responseUtils');

// Get dashboard statistics (Admin & Supervisor only)
const getDashboardStats = async (req, res, next) => {
  try {
    // Total events by status
    const eventsByStatus = await prisma.event.groupBy({
      by: ['status'],
      where: { is_active: true },
      _count: true
    });

    const eventsStats = {
      planning: 0,
      on_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    eventsByStatus.forEach(item => {
      eventsStats[item.status] = item._count;
      eventsStats.total += item._count;
    });

    // Total active petugas
    const activePetugas = await prisma.user.count({
      where: {
        role: 'petugas',
        is_active: true
      }
    });

    // Total progress reports
    const totalProgressReports = await prisma.progressReport.count({
      where: { is_active: true }
    });

    // Events near deadline (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const eventsNearDeadline = await prisma.event.findMany({
      where: {
        is_active: true,
        status: {
          in: ['planning', 'on_progress']
        },
        tanggal_selesai: {
          gte: new Date(),
          lte: sevenDaysFromNow
        }
      },
      select: {
        id: true,
        nama_tender: true,
        lokasi: true,
        tanggal_selesai: true,
        status: true
      },
      orderBy: { tanggal_selesai: 'asc' }
    });

    // Overdue events
    const overdueEvents = await prisma.event.findMany({
      where: {
        is_active: true,
        status: {
          in: ['planning', 'on_progress']
        },
        tanggal_selesai: {
          lt: new Date()
        }
      },
      select: {
        id: true,
        nama_tender: true,
        lokasi: true,
        tanggal_selesai: true,
        status: true
      },
      orderBy: { tanggal_selesai: 'desc' }
    });

    const stats = {
      events: eventsStats,
      active_petugas: activePetugas,
      total_progress_reports: totalProgressReports,
      events_near_deadline: eventsNearDeadline.length,
      overdue_events: overdueEvents.length,
      details: {
        events_near_deadline: eventsNearDeadline,
        overdue_events: overdueEvents
      }
    };

    return successResponse(res, 200, 'Statistik dashboard berhasil diambil', stats);
  } catch (error) {
    next(error);
  }
};

// Get events summary with progress percentage (Admin & Supervisor only)
const getEventsSummary = async (req, res, next) => {
  try {
    const { status, limit = 10 } = req.query;

    // Build where clause
    const where = { is_active: true };

    if (status) {
      where.status = status;
    }

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
                nama_lengkap: true,
                foto_profil: true
              }
            }
          }
        },
        milestones: {
          where: { is_active: true }
        },
        progress_reports: {
          where: { is_active: true },
          orderBy: { tanggal_laporan: 'desc' },
          take: 1
        },
        _count: {
          select: {
            milestones: true,
            progress_reports: true
          }
        }
      },
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });

    // Calculate progress percentage for each event
    const eventsSummary = events.map(event => {
      // Calculate milestone completion percentage
      const completedMilestones = event.milestones.filter(m => m.status === 'completed').length;
      const totalMilestones = event.milestones.length;
      const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      // Get latest progress report percentage
      const latestProgressPercentage = event.progress_reports.length > 0
        ? event.progress_reports[0].persentase_progress
        : 0;

      // Average of both
      const overallProgress = totalMilestones > 0
        ? Math.round((milestoneProgress + latestProgressPercentage) / 2)
        : latestProgressPercentage;

      return {
        ...event,
        progress: {
          milestone_progress: Math.round(milestoneProgress),
          latest_progress_percentage: latestProgressPercentage,
          overall_progress: overallProgress,
          completed_milestones: completedMilestones,
          total_milestones: totalMilestones
        }
      };
    });

    return successResponse(res, 200, 'Summary events berhasil diambil', eventsSummary);
  } catch (error) {
    next(error);
  }
};

// Get recent activities (Admin & Supervisor only)
const getRecentActivities = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const recentProgress = await prisma.progressReport.findMany({
      where: { is_active: true },
      include: {
        petugas: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
            foto_profil: true
          }
        },
        event: {
          select: {
            id: true,
            nama_tender: true,
            lokasi: true
          }
        },
        milestone: {
          select: {
            id: true,
            nama_milestone: true
          }
        }
      },
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });

    // Transform to activity format
    const activities = recentProgress.map(progress => ({
      id: progress.id,
      type: 'progress_report',
      title: `Progress report untuk ${progress.event.nama_tender}`,
      description: progress.deskripsi,
      user: progress.petugas,
      event: progress.event,
      milestone: progress.milestone,
      persentase_progress: progress.persentase_progress,
      tanggal_laporan: progress.tanggal_laporan,
      created_at: progress.created_at
    }));

    return successResponse(res, 200, 'Aktivitas terbaru berhasil diambil', activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getEventsSummary,
  getRecentActivities
};
