# Student Registration and Enrolment System

A full-stack MERN application for student registration, semester enrolment, attendance, payments, notifications, faculty approvals, and admin management.

## Tech Stack

- Frontend: React.js, Tailwind CSS, React Router, Axios, Recharts
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Authentication: JWT and bcrypt

## Folder Structure

```text
backend/
  src/
    config/db.js
    middleware/auth.js
    models/
    routes/
    seed/seed.js
    server.js
frontend/
  src/
    api/client.js
    components/
    context/AuthContext.jsx
    pages/
    App.jsx
    main.jsx
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_enrolment_system
JWT_SECRET=replace_with_a_long_secret
CLIENT_URL=http://localhost:5173
```

3. Seed sample data:

```bash
npm run seed
```

4. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Sample Logins

- Student: `REG2024001` / `password123`
- Faculty: `EMP1001` / `password123`
- Admin: `ADM001` / `admin123`

## API Summary

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `GET /api/student/courses`
- `POST /api/student/enroll`
- `GET /api/faculty/students`
- `PUT /api/faculty/approve`
- `GET /api/admin/users`
- `POST /api/admin/courses`
