# Dashboard Monitor Tender API

Backend API untuk sistem manajemen dan monitoring tender/proyek dengan role-based access control (Admin, Supervisor, Petugas).

## 📋 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Storage**: ImageKit
- **File Upload**: Multer + ImageKit SDK
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd Dashboard-Monitor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` dan sesuaikan dengan konfigurasi Anda:

```bash
cp .env.example .env
```

Edit file `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres.clzogizacghljzyuommi:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png
MAX_FILES_PER_UPLOAD=10

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional - creates sample data)
npm run prisma:seed
```

### 5. Run Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:5000`

## 👥 User Roles & Permissions

### 1. **Supervisor** (View Only)
- ✅ Lihat semua event tender
- ✅ Lihat progress reports
- ✅ Lihat dashboard dan statistik
- ❌ Tidak bisa create, update, atau delete apapun

### 2. **Admin** (Full Access)
- ✅ CRUD Users (create, edit, delete semua user)
- ✅ CRUD Events/Tender
- ✅ Assign/Remove Petugas ke event
- ✅ CRUD Milestones
- ✅ View Dashboard dan statistik

### 3. **Petugas** (Limited Access)
- ✅ View assigned tender saja
- ✅ Create progress report dengan foto
- ✅ Update/Delete progress report milik sendiri
- ❌ Tidak bisa akses tender yang tidak di-assign

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login dan dapatkan JWT token | - |
| POST | `/api/auth/logout` | Logout | Required |
| GET | `/api/auth/me` | Get current user info | Required |
| PUT | `/api/auth/change-password` | Change password | Required |

### Users (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (with filters) |
| GET | `/api/users/:id` | Get user detail |
| GET | `/api/users/petugas` | Get all petugas (for assignment) |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Soft delete user |
| PATCH | `/api/users/:id/status` | Toggle user status |

### Events

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events` | Get all events | All (filtered by role) |
| GET | `/api/events/:id` | Get event detail | All |
| POST | `/api/events` | Create event | Admin |
| PUT | `/api/events/:id` | Update event | Admin |
| DELETE | `/api/events/:id` | Soft delete event | Admin |
| PATCH | `/api/events/:id/status` | Update event status | Admin |
| POST | `/api/events/:id/petugas` | Assign petugas | Admin |
| DELETE | `/api/events/:id/petugas/:petugasId` | Remove petugas | Admin |
| GET | `/api/events/:id/petugas` | Get assigned petugas | All |

### Milestones

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events/:eventId/milestones` | Get milestones for event | All |
| GET | `/api/milestones/:id` | Get milestone detail | All |
| POST | `/api/events/:eventId/milestones` | Create milestone | Admin |
| PUT | `/api/milestones/:id` | Update milestone | Admin |
| DELETE | `/api/milestones/:id` | Soft delete milestone | Admin |
| PATCH | `/api/milestones/:id/status` | Update milestone status | Admin |

### Progress Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events/:eventId/progress` | Get progress for event | All |
| GET | `/api/progress/:id` | Get progress detail | All |
| POST | `/api/events/:eventId/progress` | Create progress (with photos) | Petugas |
| PUT | `/api/progress/:id` | Update progress | Owner |
| DELETE | `/api/progress/:id` | Soft delete progress | Owner |

### Dashboard (Admin & Supervisor Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get statistics |
| GET | `/api/dashboard/events-summary` | Get events with progress % |
| GET | `/api/dashboard/recent-activities` | Get recent progress reports |

### Upload (Petugas Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/progress-photos` | Pre-upload photos |

## 🔐 Authentication

API menggunakan **JWT (JSON Web Token)** untuk authentication.

### Login Request

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@tender.com",
      "role": "admin",
      "nama_lengkap": "Administrator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Menggunakan Token

Setiap request yang memerlukan authentication harus menyertakan token di header:

```bash
Authorization: Bearer <your-token-here>
```

## 📝 Seeded Data (Default Users)

Setelah menjalankan `npm run prisma:seed`, database akan terisi dengan user default:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Admin | `admin` | admin@tender.com | `password123` |
| Supervisor | `supervisor` | supervisor@tender.com | `password123` |
| Petugas 1 | `petugas1` | petugas1@tender.com | `password123` |
| Petugas 2 | `petugas2` | petugas2@tender.com | `password123` |
| Petugas 3 | `petugas3` | petugas3@tender.com | `password123` |

## 📮 Postman Collection

Import file `Dashboard-Monitor.postman_collection.json` ke Postman untuk testing API.

### Cara Import:
1. Buka Postman
2. Click **Import** button
3. Pilih file `Dashboard-Monitor.postman_collection.json`
4. Collection akan otomatis ter-import dengan semua endpoints

### Environment Variables di Postman:
- `base_url`: `http://localhost:5000/api`
- `access_token`: (akan otomatis terisi setelah login)

## 📂 Project Structure

```
Dashboard-Monitor/
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   └── seed.js                # Database seeder
├── src/
│   ├── config/
│   │   ├── prismaConfig.js    # Prisma client
│   │   └── imagekitConfig.js  # ImageKit config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usersController.js
│   │   ├── eventsController.js
│   │   ├── milestonesController.js
│   │   ├── progressController.js
│   │   ├── dashboardController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # Auth & authorization
│   │   ├── validatorMiddleware.js  # Request validation
│   │   ├── uploadMiddleware.js     # File upload handler
│   │   └── errorMiddleware.js      # Error handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── usersRoutes.js
│   │   ├── eventsRoutes.js
│   │   ├── milestonesRoutes.js
│   │   ├── eventMilestonesRoutes.js
│   │   ├── progressRoutes.js
│   │   ├── eventProgressRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── uploadRoutes.js
│   ├── utils/
│   │   ├── jwtUtils.js         # JWT helper
│   │   ├── bcryptUtils.js      # Password hashing
│   │   └── responseUtils.js    # Response formatter
│   └── app.js                  # Main app
├── .env                        # Environment variables
├── .env.example               # Environment template
├── package.json
├── README.md
└── Dashboard-Monitor.postman_collection.json
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-Origin Resource Sharing protection
- **Rate Limiting**:
  - General: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing dengan salt rounds 10
- **Input Validation**: express-validator untuk validasi request

## 📊 Database Schema

### Users
- id, username, email, password (hashed)
- role (admin/supervisor/petugas)
- nama_lengkap, foto_profil
- is_active, created_at, updated_at

### Events
- id, nama_tender, lokasi, deskripsi
- budget, tanggal_mulai, tanggal_selesai
- status (planning/on_progress/completed/cancelled)
- created_by, is_active, created_at, updated_at

### Milestones
- id, event_id, nama_milestone, deskripsi
- deadline, status (pending/on_progress/completed)
- urutan, is_active, created_at, updated_at

### EventPetugas (Many-to-Many)
- id, event_id, petugas_id
- assigned_by, assigned_at

### ProgressReport
- id, event_id, milestone_id, petugas_id
- deskripsi, foto_urls (JSON array)
- tanggal_laporan, persentase_progress
- is_active, created_at, updated_at

## 🔧 Available NPM Scripts

```bash
# Start server
npm start                 # Production mode
npm run dev              # Development mode (with nodemon)

# Prisma commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:reset     # Reset database
npm run prisma:seed      # Seed database with sample data
```

## 📸 File Upload

### Configuration
- **Max File Size**: 5MB per file
- **Allowed Types**: JPG, JPEG, PNG
- **Max Files**: 10 files per upload
- **Storage**: ImageKit CDN

### Upload Endpoint

```bash
POST /api/events/:eventId/progress
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- photos: [file1, file2, file3]
- deskripsi: "Progress update..."
- tanggal_laporan: "2025-06-15"
- persentase_progress: 75
- milestone_id: "uuid"
```

### Response

```json
{
  "success": true,
  "message": "Progress report berhasil dibuat",
  "data": {
    "id": "uuid",
    "deskripsi": "Progress update...",
    "foto_urls": [
      "https://ik.imagekit.io/.../photo1.jpg",
      "https://ik.imagekit.io/.../photo2.jpg"
    ],
    "persentase_progress": 75,
    "tanggal_laporan": "2025-06-15"
  }
}
```

## ❗ Important Notes

1. **No Self-Registration**: Tidak ada endpoint `/api/auth/register`. Semua user dibuat oleh Admin melalui `/api/users`
2. **Default Password**: Jika password tidak diisi saat create user, default adalah `password123`
3. **Soft Delete**: Semua delete operation menggunakan soft delete (set `is_active = false`)
4. **File Upload**: Photo upload hanya untuk Petugas yang sudah di-assign ke event
5. **JWT Expiry**: Token expired setelah 24 jam (configurable di .env)

## 🐛 Error Handling

API mengembalikan error response dengan format konsisten:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (only in development)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## 🧪 Testing with Postman

1. Import collection `Dashboard-Monitor.postman_collection.json`
2. Login dengan user `admin` / `password123`
3. Token akan otomatis tersimpan di collection variable
4. Test endpoints sesuai role yang di-login

### Test Flow:
1. **Login** → Get token
2. **Create Event** (as Admin)
3. **Assign Petugas** to event
4. **Create Milestones** for event
5. **Login as Petugas**
6. **Create Progress Report** with photos
7. **View Dashboard** stats

## 📞 Support

Jika ada pertanyaan atau issues, silakan buat issue di repository atau hubungi tim development.

## 📄 License

ISC

---

**Happy Coding! 🚀**
