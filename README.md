# School Exam & Grading SaaS Platform

A multi-tenant EdTech SaaS platform for K-12 and higher education, enabling schools to create, administer, and grade exams digitally with transcript management and compliance features.

## Features

### Admin Panel
- School setup (District → School → Grade Level → Section)
- Academic year and semester management
- User roles and permissions (Super Admin, School Admin, Department Head, Teacher, Student, Parent)
- Subject and curriculum setup
- Audit logs with export

### Teacher Panel
- Exam creation (Multiple choice, True/False, Identification, Short answer, Essay)
- Question bank with tagging
- Randomized exam generator (shuffle questions/options)
- Auto-grading for objective items
- Grade computation with weighted categories
- CSV export (grades, question bank)

### Student Portal
- Secure login
- Online exam interface with timer
- Exam history and grade viewing
- Transcript preview

### Parent Portal (Premium)
- Child grade monitoring
- Multi-child support
- Guardian verification

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, raw PostgreSQL via `pg`
- **Database**: PostgreSQL
- **Auth**: JWT (httpOnly cookies)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Installation

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set:

```
DATABASE_URL="postgresql://user:password@localhost:5432/school_system?schema=public"
JWT_SECRET="your-secret-key"
```

3. Initialize the database and seed:

```bash
npm run db:schema
npm run db:seed
```

4. Start the dev server:

```bash
npm run dev
```

5. Open http://localhost:3000 and log in with:

- **Admin**: admin@demoschool.edu / password123
- **Teacher**: teacher@demoschool.edu / password123
- **Student**: student@demoschool.edu / password123

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Exams
- `POST /api/exams` - Create exam
- `PATCH /api/exams/attempt` - Save exam progress
- `POST /api/exams/submit` - Submit exam (auto-grades objectives)

### Import/Export
- `POST /api/import/users` - Bulk import users (CSV)
- `GET /api/export/grades?sectionId=&termId=` - Export grades CSV
- `GET /api/export/questions?subjectId=` - Export question bank CSV
- `GET /api/export/audit-logs` - Export audit logs CSV

## License

Private - All rights reserved.
