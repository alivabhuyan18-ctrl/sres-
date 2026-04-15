import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import {
  AdminDashboard,
  DocumentReview,
  AdminReports,
  EnrollmentManagement,
  ManageCourses,
  ManageFaculty,
  ManageStudents,
  SystemSettings
} from "./pages/admin/AdminPages";
import {
  ApproveEnrollments,
  AttendanceManagement,
  FacultyDashboard,
  FacultyNotifications,
  FacultyReports,
  StudentList
} from "./pages/faculty/FacultyPages";
import {
  Attendance,
  MiscFees,
  Notifications,
  SemesterRegistration,
  SettingsPage,
  StudentDashboard,
  StudentProfile,
  Transactions
} from "./pages/student/StudentPages";

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute role="student" />}>
      <Route path="/student" element={<AppShell />}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="misc-fees" element={<MiscFees />} />
        <Route path="misc-transactions" element={<Transactions misc />} />
        <Route path="registration" element={<SemesterRegistration />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute role="faculty" />}>
      <Route path="/faculty" element={<AppShell />}>
        <Route index element={<FacultyDashboard />} />
        <Route path="students" element={<StudentList />} />
        <Route path="approvals" element={<ApproveEnrollments />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="reports" element={<FacultyReports />} />
        <Route path="notifications" element={<FacultyNotifications />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<AppShell />}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="enrollments" element={<EnrollmentManagement />} />
        <Route path="documents" element={<DocumentReview />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
