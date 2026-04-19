# Student Registration and Enrolment System

A full-stack MERN academic workflow system for student onboarding, semester registration, course enrollment, faculty approval, attendance, document verification, payments, notifications, and admin reporting.

## Project Overview

This project was built as a college-level Student Registration and Enrollment System with three main user roles:

- **Student**: create an account, manage profile data, upload documents, view courses, request enrollment, track status, check attendance, pay fees, and review notifications.
- **Faculty / HOD / Advisor**: manage assigned courses, review enrollment requests, update attendance, view student lists, and publish notices.
- **Admin**: manage students, faculty, courses, documents, enrollments, reports, and system configuration.

The system is designed to reduce manual paperwork, centralize academic records, improve enrollment transparency, and provide a cleaner ERP-style experience.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT + bcrypt
- **Uploads**: Multer (local file storage in `/uploads`)

## Major Features

### Student Module
- Student signup and role-based login
- Profile management with required-field validation
- Profile photo and document uploads
- Semester registration with:
  - capacity visibility
  - prerequisite checking
  - pending / approved / rejected enrollment statuses
  - open course basket
  - my courses page
- Transaction history and miscellaneous fee handling
- Attendance tables and charts
- Notification center with read/unread support
- Settings and password change

### Faculty Module
- Faculty dashboard with course and approval stats
- Student list scoped to assigned/advised students
- Enrollment approval and rejection
- Attendance management for approved course enrollments only
- Reports and announcements

### Admin Module
- Student and faculty account management
- Course management with branch, category, capacity, schedule, instructor, and prerequisites
- Enrollment monitoring
- Document review and verification
- Reports, charts, audit activity, and exports

## Authentication and Security

- JWT-based protected API routes
- Role-based access control
- Password hashing with bcrypt
- Validation for auth, profile, course, and user-management flows
- Password reset flow with SMTP-ready mail support
- Audit logging for key system actions

## Project Structure

```text
backend/
  src/
    config/
    middleware/
    models/
    routes/
    seed/
    utils/
    server.js
frontend/
  src/
    api/
    components/
    context/
    pages/
      admin/
      auth/
      faculty/
      student/
    utils/
    App.jsx
    main.jsx
uploads/
```

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_enrolment_system
JWT_SECRET=replace_with_a_long_secret
CLIENT_URL=http://localhost:5173

# Optional SMTP settings for real password reset emails
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### 3. Seed demo data

```bash
npm run seed
```

### 4. Start the project

```bash
npm run dev
```

### 5. Open the app

- Frontend: `http://localhost:5173/login`
- Backend health check: `http://localhost:5000/api/health`

## Demo Accounts

- **Student**: `REG2024001` / `password123`
- **Faculty**: `EMP1001` / `password123`
- **Admin**: `ADM001` / `admin123`

Additional seeded faculty:

- `EMP1002` / `password123`
- `EMP1003` / `password123`

## Main API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `PUT /api/auth/change-password`

### Student
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `POST /api/student/uploads/avatar`
- `POST /api/student/uploads/qualification/:index`
- `POST /api/student/uploads/certificate/:index`
- `GET /api/student/courses`
- `POST /api/student/enroll`
- `DELETE /api/student/enrollments/:id`
- `PUT /api/student/payments/:id/pay`
- `PUT /api/student/notifications/read-all`
- `PUT /api/student/notifications/:id/read`

### Faculty
- `GET /api/faculty/dashboard`
- `GET /api/faculty/students`
- `GET /api/faculty/courses`
- `GET /api/faculty/enrollments`
- `PUT /api/faculty/approve`
- `PUT /api/faculty/attendance`
- `POST /api/faculty/notifications`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/courses`
- `POST /api/admin/courses`
- `PUT /api/admin/courses/:id`
- `GET /api/admin/enrollments`
- `GET /api/admin/documents`
- `PUT /api/admin/documents/verify`
- `GET /api/admin/reports`
- `GET /api/admin/audit-logs`

## Academic Scope Covered

This project covers the main academic objectives of a Student Registration and Enrollment System:

- automation of registration and enrollment
- centralized student and course records
- course capacity and prerequisite handling
- role-based academic workflow
- reports and statistics
- notifications and communication
- validation and controlled access

## Known Limitations

- Admin can monitor enrollments, but approval is currently faculty/HOD/advisor-driven
- File uploads are stored locally, not in cloud storage
- Real email delivery requires SMTP configuration
- No automated test suite is included yet

## Future Improvements

- PDF generation for receipts and academic summaries
- Cloud-based file storage
- stronger automated testing
- more granular faculty roles
- deployment configuration for production
