const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tender.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tender.com',
      password: hashedPassword,
      role: 'admin',
      nama_lengkap: 'Administrator',
      is_active: true
    }
  });
  console.log('✅ Admin created:', admin.username);

  // Create Supervisor User
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@tender.com' },
    update: {},
    create: {
      username: 'supervisor',
      email: 'supervisor@tender.com',
      password: hashedPassword,
      role: 'supervisor',
      nama_lengkap: 'Supervisor Utama',
      is_active: true
    }
  });
  console.log('✅ Supervisor created:', supervisor.username);

  // Create Petugas Users
  const petugas1 = await prisma.user.upsert({
    where: { email: 'petugas1@tender.com' },
    update: {},
    create: {
      username: 'petugas1',
      email: 'petugas1@tender.com',
      password: hashedPassword,
      role: 'petugas',
      nama_lengkap: 'Petugas Lapangan 1',
      is_active: true
    }
  });
  console.log('✅ Petugas 1 created:', petugas1.username);

  const petugas2 = await prisma.user.upsert({
    where: { email: 'petugas2@tender.com' },
    update: {},
    create: {
      username: 'petugas2',
      email: 'petugas2@tender.com',
      password: hashedPassword,
      role: 'petugas',
      nama_lengkap: 'Petugas Lapangan 2',
      is_active: true
    }
  });
  console.log('✅ Petugas 2 created:', petugas2.username);

  const petugas3 = await prisma.user.upsert({
    where: { email: 'petugas3@tender.com' },
    update: {},
    create: {
      username: 'petugas3',
      email: 'petugas3@tender.com',
      password: hashedPassword,
      role: 'petugas',
      nama_lengkap: 'Petugas Lapangan 3',
      is_active: true
    }
  });
  console.log('✅ Petugas 3 created:', petugas3.username);

  // Create Sample Events
  const event1 = await prisma.event.create({
    data: {
      nama_tender: 'Pembangunan Jembatan Sungai Ciliwung',
      lokasi: 'Jakarta Timur',
      deskripsi: 'Pembangunan jembatan penghubung antar wilayah dengan panjang 500 meter',
      budget: 15000000000.00,
      tanggal_mulai: new Date('2025-01-15'),
      tanggal_selesai: new Date('2025-12-31'),
      status: 'on_progress',
      created_by: admin.id
    }
  });
  console.log('✅ Event 1 created:', event1.nama_tender);

  const event2 = await prisma.event.create({
    data: {
      nama_tender: 'Renovasi Gedung Perkantoran',
      lokasi: 'Jakarta Pusat',
      deskripsi: 'Renovasi gedung perkantoran 10 lantai',
      budget: 8000000000.00,
      tanggal_mulai: new Date('2025-02-01'),
      tanggal_selesai: new Date('2025-08-31'),
      status: 'planning',
      created_by: admin.id
    }
  });
  console.log('✅ Event 2 created:', event2.nama_tender);

  const event3 = await prisma.event.create({
    data: {
      nama_tender: 'Pengaspalan Jalan Raya',
      lokasi: 'Bogor',
      deskripsi: 'Pengaspalan jalan sepanjang 10 KM',
      budget: 5000000000.00,
      tanggal_mulai: new Date('2024-10-01'),
      tanggal_selesai: new Date('2024-12-31'),
      status: 'completed',
      created_by: admin.id
    }
  });
  console.log('✅ Event 3 created:', event3.nama_tender);

  // Assign Petugas to Events
  await prisma.eventPetugas.createMany({
    data: [
      { event_id: event1.id, petugas_id: petugas1.id, assigned_by: admin.id },
      { event_id: event1.id, petugas_id: petugas2.id, assigned_by: admin.id },
      { event_id: event2.id, petugas_id: petugas2.id, assigned_by: admin.id },
      { event_id: event2.id, petugas_id: petugas3.id, assigned_by: admin.id },
      { event_id: event3.id, petugas_id: petugas1.id, assigned_by: admin.id }
    ],
    skipDuplicates: true
  });
  console.log('✅ Petugas assigned to events');

  // Create Milestones for Event 1
  await prisma.milestone.createMany({
    data: [
      {
        event_id: event1.id,
        nama_milestone: 'Persiapan Lahan',
        deskripsi: 'Pembersihan dan persiapan area pembangunan',
        deadline: new Date('2025-02-28'),
        status: 'completed',
        urutan: 1
      },
      {
        event_id: event1.id,
        nama_milestone: 'Pembuatan Pondasi',
        deskripsi: 'Konstruksi pondasi jembatan',
        deadline: new Date('2025-05-31'),
        status: 'on_progress',
        urutan: 2
      },
      {
        event_id: event1.id,
        nama_milestone: 'Pembangunan Struktur Utama',
        deskripsi: 'Pembangunan struktur utama jembatan',
        deadline: new Date('2025-09-30'),
        status: 'pending',
        urutan: 3
      },
      {
        event_id: event1.id,
        nama_milestone: 'Finishing dan Pengecatan',
        deskripsi: 'Penyelesaian akhir dan pengecatan',
        deadline: new Date('2025-12-15'),
        status: 'pending',
        urutan: 4
      }
    ]
  });
  console.log('✅ Milestones created for Event 1');

  // Create Milestones for Event 2
  await prisma.milestone.createMany({
    data: [
      {
        event_id: event2.id,
        nama_milestone: 'Survey dan Perencanaan',
        deskripsi: 'Survey kondisi gedung dan perencanaan renovasi',
        deadline: new Date('2025-03-01'),
        status: 'pending',
        urutan: 1
      },
      {
        event_id: event2.id,
        nama_milestone: 'Demolisi Interior',
        deskripsi: 'Pembongkaran interior lama',
        deadline: new Date('2025-04-30'),
        status: 'pending',
        urutan: 2
      },
      {
        event_id: event2.id,
        nama_milestone: 'Renovasi Struktur',
        deskripsi: 'Renovasi struktur gedung',
        deadline: new Date('2025-07-31'),
        status: 'pending',
        urutan: 3
      }
    ]
  });
  console.log('✅ Milestones created for Event 2');

  // Create Sample Progress Reports
  const milestone1 = await prisma.milestone.findFirst({
    where: { event_id: event1.id, urutan: 1 }
  });

  if (milestone1) {
    await prisma.progressReport.create({
      data: {
        event_id: event1.id,
        milestone_id: milestone1.id,
        petugas_id: petugas1.id,
        deskripsi: 'Pembersihan lahan telah selesai 100%. Area sudah siap untuk tahap selanjutnya.',
        foto_urls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ],
        tanggal_laporan: new Date('2025-02-25'),
        persentase_progress: 100
      }
    });
    console.log('✅ Progress report created for Event 1');
  }

  const milestone2 = await prisma.milestone.findFirst({
    where: { event_id: event1.id, urutan: 2 }
  });

  if (milestone2) {
    await prisma.progressReport.create({
      data: {
        event_id: event1.id,
        milestone_id: milestone2.id,
        petugas_id: petugas2.id,
        deskripsi: 'Pembuatan pondasi sudah mencapai 60%. Estimasi selesai sesuai jadwal.',
        foto_urls: [
          'https://example.com/photo3.jpg',
          'https://example.com/photo4.jpg',
          'https://example.com/photo5.jpg'
        ],
        tanggal_laporan: new Date('2025-05-15'),
        persentase_progress: 60
      }
    });
    console.log('✅ Progress report created for Milestone 2');
  }

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📝 Default Login Credentials:');
  console.log('================================');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Email: admin@tender.com');
  console.log('  Password: password123');
  console.log('\nSupervisor:');
  console.log('  Username: supervisor');
  console.log('  Email: supervisor@tender.com');
  console.log('  Password: password123');
  console.log('\nPetugas 1:');
  console.log('  Username: petugas1');
  console.log('  Email: petugas1@tender.com');
  console.log('  Password: password123');
  console.log('\nPetugas 2:');
  console.log('  Username: petugas2');
  console.log('  Email: petugas2@tender.com');
  console.log('  Password: password123');
  console.log('\nPetugas 3:');
  console.log('  Username: petugas3');
  console.log('  Email: petugas3@tender.com');
  console.log('  Password: password123');
  console.log('================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
