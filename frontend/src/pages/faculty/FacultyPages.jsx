import { Bell, BookOpen, ClipboardCheck, Send, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/faculty/dashboard").then((res) => setData(res.data));
  }, []);
  if (!data) return <Loader />;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Total Students" value={data.totalStudents} icon={Users} />
      <StatCard title="Pending Approvals" value={data.pendingApprovals} icon={ClipboardCheck} tone="coral" />
      <StatCard title="Courses Handled" value={data.coursesHandled} icon={BookOpen} tone="saffron" />
    </div>
  );
};

export const StudentList = () => {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/faculty/students").then((res) => setRows(res.data));
  }, []);
  if (!rows) return <Loader />;
  return (
    <DataTable
      rows={rows}
      searchPlaceholder="Search students"
      columns={[
        { key: "identifier", label: "Reg No." },
        { key: "name", label: "Name" },
        { key: "department", label: "Department" },
        { key: "semester", label: "Semester" },
        { key: "email", label: "Email" }
      ]}
    />
  );
};

export const ApproveEnrollments = () => {
  const [rows, setRows] = useState(null);
  const load = () => api.get("/faculty/enrollments").then((res) => setRows(res.data));
  useEffect(() => {
    load();
  }, []);
  if (!rows) return <Loader />;

  const decide = async (enrollmentId, status) => {
    await api.put("/faculty/approve", { enrollmentId, status });
    toast.success(`Enrollment ${status}`);
    load();
  };

  return (
    <DataTable
      rows={rows}
      searchPlaceholder="Search enrollment requests"
      columns={[
        { key: "student", label: "Student", render: (row) => `${row.student?.name} (${row.student?.identifier})` },
        { key: "course", label: "Course", render: (row) => `${row.course?.code} - ${row.course?.name}` },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Requested", render: (row) => new Date(row.createdAt).toLocaleDateString() },
        {
          key: "action",
          label: "Action",
          render: (row) =>
            row.status === "pending" ? (
              <div className="flex gap-2">
                <button onClick={() => decide(row._id, "approved")} className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-ink">Approve</button>
                <button onClick={() => decide(row._id, "rejected")} className="rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white">Reject</button>
              </div>
            ) : (
              <span className="text-ink/60 dark:text-white/60">Reviewed</span>
            )
        }
      ]}
    />
  );
};

export const AttendanceManagement = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: "", courseId: "", totalClasses: 40, attendedClasses: 35 });
  useEffect(() => {
    api.get("/faculty/students").then((res) => setStudents(res.data));
  }, []);
  const save = async (event) => {
    event.preventDefault();
    await api.put("/faculty/attendance", form);
    toast.success("Attendance updated");
  };
  return (
    <form onSubmit={save} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Attendance Management</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
          <option value="">Select student</option>
          {students.map((student) => <option key={student._id} value={student._id}>{student.name}</option>)}
        </select>
        <input placeholder="Course ID" className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} />
        <input type="number" className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.totalClasses} onChange={(event) => setForm({ ...form, totalClasses: Number(event.target.value) })} />
        <input type="number" className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.attendedClasses} onChange={(event) => setForm({ ...form, attendedClasses: Number(event.target.value) })} />
      </div>
      <button className="mt-5 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Update Attendance</button>
    </form>
  );
};

export const FacultyReports = () => {
  const data = [
    { name: "Approved", value: 64 },
    { name: "Pending", value: 24 },
    { name: "Rejected", value: 12 }
  ];
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <h2 className="text-xl font-bold dark:text-white">Enrollment Stats</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={115} label>
              {["#2fbf9f", "#f4b740", "#ef6f5e"].map((color) => <Cell key={color} fill={color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const FacultyNotifications = () => {
  const [form, setForm] = useState({ title: "", message: "" });
  const send = async (event) => {
    event.preventDefault();
    await api.post("/faculty/notifications", form);
    setForm({ title: "", message: "" });
    toast.success("Announcement sent");
  };
  return (
    <form onSubmit={send} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold dark:text-white"><Bell /> Send Announcement</h2>
      <input placeholder="Title" className="focus-ring mb-3 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <textarea placeholder="Message" className="focus-ring h-32 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      <button className="mt-4 flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-semibold text-ink"><Send size={18} /> Send</button>
    </form>
  );
};
