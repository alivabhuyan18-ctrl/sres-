import {
  Bell,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  Sun,
  User,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const menuByRole = {
  student: [
    ["Dashboard", "/student", LayoutDashboard],
    ["Student Profile", "/student/profile", User],
    ["Transaction History", "/student/transactions", Receipt],
    ["Miscellaneous Fees", "/student/misc-fees", CreditCard],
    ["Misc Transaction History", "/student/misc-transactions", Receipt],
    ["Semester Registration", "/student/registration", BookOpen],
    ["My Courses", "/student/my-courses", FileCheck],
    ["Attendance", "/student/attendance", ClipboardCheck],
    ["Notifications", "/student/notifications", Bell],
    ["Settings", "/student/settings", Settings]
  ],
  faculty: [
    ["Dashboard", "/faculty", LayoutDashboard],
    ["Student List", "/faculty/students", Users],
    ["Approve Enrollments", "/faculty/approvals", ClipboardCheck],
    ["Attendance Management", "/faculty/attendance", BookOpen],
    ["Reports", "/faculty/reports", FileBarChart],
    ["Notifications", "/faculty/notifications", Bell]
  ],
  admin: [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Manage Students", "/admin/students", Users],
    ["Manage Faculty", "/admin/faculty", GraduationCap],
    ["Manage Courses", "/admin/courses", BookOpen],
    ["Enrollment Management", "/admin/enrollments", ClipboardCheck],
    ["Document Review", "/admin/documents", FileCheck],
    ["Reports", "/admin/reports", FileBarChart],
    ["System Settings", "/admin/settings", Settings]
  ]
};

const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("sres_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sres_theme", dark ? "dark" : "light");
  }, [dark]);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-[#181c1a] dark:text-white">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-ink text-white transition-all lg:block ${collapsed ? "w-20" : "w-72"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint font-bold text-ink">SR</div>
          {!collapsed && <span className="text-sm font-semibold leading-tight">Student Registration and Enrolment System</span>}
        </div>
        <nav className="space-y-1 p-3">
          {menuByRole[user.role].map(([label, href, Icon]) => (
            <NavLink
              key={href}
              end={href === `/${user.role}`}
              to={href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${isActive ? "bg-mint text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} className="absolute bottom-4 left-3 right-3 flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-white/75 hover:bg-coral hover:text-white">
          <LogOut size={19} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <div className={`transition-all ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/10 bg-paper/90 px-4 backdrop-blur dark:border-white/10 dark:bg-[#181c1a]/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="focus-ring rounded-lg border border-ink/10 p-2 dark:border-white/10" onClick={() => setCollapsed((value) => !value)}>
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm text-ink/60 dark:text-white/60">Logged in as {user.role}</p>
              <h1 className="font-semibold">{user.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="focus-ring rounded-lg border border-ink/10 p-2 dark:border-white/10" onClick={() => setDark((value) => !value)}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="focus-ring rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white lg:hidden" onClick={signOut}>
              Logout
            </button>
          </div>
        </header>
        <nav className="sticky top-16 z-10 flex gap-2 overflow-x-auto border-b border-ink/10 bg-paper px-4 py-2 dark:border-white/10 dark:bg-[#181c1a] lg:hidden">
          {menuByRole[user.role].map(([label, href, Icon]) => (
            <NavLink
              key={href}
              end={href === `/${user.role}`}
              to={href}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${isActive ? "bg-mint text-ink" : "bg-white text-ink/70 dark:bg-white/10 dark:text-white/70"}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
