# Provaliant Sales Pipeline & Dashboard

Aplikasi manajemen sales pipeline dan dashboard untuk PT Provaliant, mencakup:
- Funnel sales (Canvassing → Pipeline → Closing)
- Project P&L tracking (Sales Amount, COGS, Operating Profit)
- Executive Dashboard dengan KPI, grafik, dan filter
- RBAC (Role-Based Access Control) dengan 4 level: Admin, Corporate, Manager, User
- Master data: Company, Contact, Division, Industry, dll

## Tech Stack

**Backend:**
- Node.js + NestJS (TypeScript)
- Prisma ORM
- SQLite (dev) → PostgreSQL/MySQL (production)
- JWT Authentication
- bcrypt untuk password hashing

**Frontend:**
- React + TypeScript
- Vite
- TanStack Query (React Query)
- Tailwind CSS
- Recharts / Chart.js untuk grafik

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Backend Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database dengan data awal
npm run db:seed
```

### 3. Start Development

```bash
# Start backend & frontend concurrently
npm run dev

# Or start separately:
npm run dev:backend   # Backend API: http://localhost:3000/api
npm run dev:frontend  # Frontend: http://localhost:5173
```

### 4. Login Credentials

Setelah seeding, gunakan kredensial berikut untuk login:

- **Admin**: `admin@provaliant.com` / `password123`
- **Corporate**: `reynaldo@provaliant.com` / `password123`  
- **Manager**: `andi@provaliant.com` / `password123`
- **User**: `sinta@provaliant.com` / `password123`

## Database Management

```bash
# Open Prisma Studio (GUI database)
npm run db:studio

# Create new migration
npm run db:migrate

# Push schema changes without migration
npm run db:push

# Re-seed database
npm run db:seed
```

## Project Structure

```
sales-pipeline/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── prisma/       # Database schema & migrations
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── divisions/
│   │   │   │   ├── companies/
│   │   │   │   ├── contacts/
│   │   │   │   ├── deals/
│   │   │   │   ├── activities/
│   │   │   │   ├── jobs/
│   │   │   │   └── dashboard/
│   │   │   └── common/   # Guards, decorators, filters
│   │   └── .env
│   │
│   └── frontend/         # React SPA
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── types/
│       └── .env
│
├── files/                # Excel data sumber
├── PLAN.md              # Rencana arsitektur
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - List users (filtered by scope)
- `GET /api/users/:id` - Get user detail
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Master Data
- `GET /api/divisions` - List divisions
- `GET /api/companies?search=...&industryId=...` - List companies with search
- `GET /api/contacts` - List contacts
- `GET /api/deals` - List deals (pipeline)
- `GET /api/jobs` - List jobs/projects
- `GET /api/activities` - List activities

### Dashboard
- `GET /api/dashboard/kpis` - Get KPI summary
- `GET /api/dashboard/funnel` - Get funnel chart data
- `GET /api/dashboard/revenue-forecast` - Get revenue forecast
- `GET /api/dashboard/deals-at-risk` - Get deals at risk

## Database Migration (SQLite → PostgreSQL/MySQL)

Untuk migrasi dari SQLite ke PostgreSQL/MySQL:

### PostgreSQL

1. Install driver:
```bash
cd apps/backend
npm install pg
```

2. Update `apps/backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update `apps/backend/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/provaliant_sales"
```

4. Run migrations:
```bash
npm run db:migrate:deploy
npm run db:seed
```

### MySQL

1. Install driver:
```bash
cd apps/backend
npm install mysql2
```

2. Update `apps/backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

3. Update `apps/backend/.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/provaliant_sales"
```

4. Run migrations:
```bash
npm run db:migrate:deploy
npm run db:seed
```

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

## RBAC (Role-Based Access Control)

Sistem menggunakan 2 dimensi hak akses:

1. **Role** - menentukan action yang bisa dilakukan (create/read/update/delete/approve/export)
2. **Scope Level** - menentukan data yang bisa diakses:
   - `all` - semua data (Admin, Corporate)
   - `division` - data divisi sendiri (Manager)
   - `own` - data milik sendiri (User)

### Permission Matrix

| Module | Admin | Corporate | Manager | User |
|--------|-------|-----------|---------|------|
| Users | CRUD | R | R | R |
| Companies | CRUD | R | RU | CRU |
| Deals | CRUD | RX | CRUDA | CRU |
| Jobs | CRUD | RX | CRUDA | CRU |
| Dashboard | RX | RX | RX (div) | R (own) |

C=Create, R=Read, U=Update, D=Delete, A=Approve, X=Export

## Data Migration dari Excel

Untuk migrate data dari file Excel eksisting:

```bash
cd apps/backend
ts-node scripts/migrate-excel.ts
```

Script akan:
1. Membaca `files/IP_Licensing_Sales_Report_Advanced.xlsx`
2. Membaca `files/report-abc-p.xlsx`
3. Cleansing & normalisasi data
4. Import ke database dengan mapping:
   - Sheet Canvassing → Activities
   - Sheet Pipeline → Deals
   - Sheet Closing → Deals (Won)
   - report-abc-p → Jobs

## Production Build

```bash
# Build semua
npm run build

# Start production backend
npm start
```

## Troubleshooting

### Database locked error (SQLite)

Jika ada error "database is locked", stop semua proses yang menggunakan database:
```bash
# Kill all node processes
pkill -f node

# Atau restart development server
npm run dev
```

### Prisma Client not generated

```bash
npm run db:generate
```

### Migration failed

Reset database dan migrate ulang:
```bash
rm apps/backend/prisma/dev.db
npm run db:migrate
npm run db:seed
```

## Support

Untuk pertanyaan atau issue, hubungi tim development Provaliant.

## License

Proprietary - PT Provaliant
