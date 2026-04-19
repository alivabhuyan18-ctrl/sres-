import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
const Login = lazy(() => import("./pages/auth/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.AdminDashboard })));
const DocumentReview = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.DocumentReview })));
const AdminReports = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.AdminReports })));
const EnrollmentManagement = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.EnrollmentManagement })));
const ManageCourses = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.ManageCourses })));
const ManageFaculty = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.ManageFaculty })));
const ManageStudents = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.ManageStudents })));
const SystemSettings = lazy(() => import("./pages/admin/AdminPages").then((module) => ({ default: module.SystemSettings })));
const ApproveEnrollments = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.ApproveEnrollments })));
const AttendanceManagement = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.AttendanceManagement })));
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.FacultyDashboard })));
const FacultyNotifications = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.FacultyNotifications })));
const FacultyReports = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.FacultyReports })));
const StudentList = lazy(() => import("./pages/faculty/FacultyPages").then((module) => ({ default: module.StudentList })));
const Attendance = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.Attendance })));
const MiscFees = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.MiscFees })));
const MyCourses = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.MyCourses })));
const Notifications = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.Notifications })));
const SemesterRegistration = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.SemesterRegistration })));
const SettingsPage = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.SettingsPage })));
const StudentDashboard = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.StudentDashboard })));
const StudentProfile = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.StudentProfile })));
const Transactions = lazy(() => import("./pages/student/StudentPages").then((module) => ({ default: module.Transactions })));

const App = () => (
  <Suspense fallback={<div className="p-6"><Loader /></div>}>
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
          <Route path="my-courses" element={<MyCourses />} />
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
  </Suspense>
);

export default App;
