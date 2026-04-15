import { BookOpen, ClipboardCheck, FileCheck, GraduationCap, Plus, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data));
  }, []);
  if (!data) return <Loader />;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard title="Students" value={data.students} icon={Users} />
      <StatCard title="Faculty" value={data.faculty} icon={GraduationCap} tone="saffron" />
      <StatCard title="Courses" value={data.courses} icon={BookOpen} tone="coral" />
      <StatCard title="Revenue" value={`INR ${data.revenue.toLocaleString("en-IN")}`} icon={ClipboardCheck} tone="ink" />
    </div>
  );
};

const UserManagement = ({ role, title }) => {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ name: "", identifier: "", email: "", password: "password123", role });
  const load = () => api.get(`/admin/users?role=${role}`).then((res) => setRows(res.data));
  useEffect(() => {
    load();
  }, [role]);
  const create = async (event) => {
    event.preventDefault();
    await api.post("/admin/users", form);
    toast.success(`${title.slice(0, -1)} added`);
    setForm({ name: "", identifier: "", email: "", password: "password123", role });
    load();
  };
  if (!rows) return <Loader />;
  return (
    <div className="space-y-5">
      <form onSubmit={create} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold dark:text-white"><Plus /> Add {title.slice(0, -1)}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {["name", "identifier", "email", "password"].map((field) => (
            <input key={field} placeholder={field} className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
          ))}
        </div>
        <button className="mt-4 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Create</button>
      </form>
      <DataTable
        rows={rows}
        searchPlaceholder={`Search ${title.toLowerCase()}`}
        columns={[
          { key: "identifier", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "department", label: "Department" },
          { key: "isActive", label: "Status", render: (row) => (row.isActive ? "Active" : "Inactive") }
        ]}
      />
    </div>
  );
};

export const ManageStudents = () => <UserManagement role="student" title="Students" />;
export const ManageFaculty = () => <UserManagement role="faculty" title="Faculty" />;

export const ManageCourses = () => {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", credits: 3, capacity: 50, semester: 1 });
  const load = () => api.get("/admin/courses").then((res) => setRows(res.data));
  useEffect(() => {
    load();
  }, []);
  const create = async (event) => {
    event.preventDefault();
    await api.post("/admin/courses", form);
    toast.success("Course added");
    setForm({ code: "", name: "", credits: 3, capacity: 50, semester: 1 });
    load();
  };
  if (!rows) return <Loader />;
  return (
    <div className="space-y-5">
      <form onSubmit={create} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Add Course</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {["code", "name", "credits", "capacity", "semester"].map((field) => (
            <input key={field} placeholder={field} type={["credits", "capacity", "semester"].includes(field) ? "number" : "text"} className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form[field]} onChange={(event) => setForm({ ...form, [field]: ["credits", "capacity", "semester"].includes(field) ? Number(event.target.value) : event.target.value })} />
          ))}
        </div>
        <button className="mt-4 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Add Course</button>
      </form>
      <DataTable
        rows={rows}
        searchPlaceholder="Search courses"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "credits", label: "Credits" },
          { key: "capacity", label: "Capacity" },
          { key: "semester", label: "Semester" },
          { key: "prerequisites", label: "Prerequisites", render: (row) => row.prerequisites?.map((item) => item.code).join(", ") || "None" }
        ]}
      />
    </div>
  );
};

export const EnrollmentManagement = () => {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/admin/enrollments").then((res) => setRows(res.data));
  }, []);
  if (!rows) return <Loader />;
  return (
    <DataTable
      rows={rows}
      searchPlaceholder="Search all enrollments"
      columns={[
        { key: "student", label: "Student", render: (row) => row.student?.name },
        { key: "course", label: "Course", render: (row) => `${row.course?.code} ${row.course?.name}` },
        { key: "status", label: "Status" },
        { key: "approvedBy", label: "Approved By", render: (row) => row.approvedBy?.name || "Pending" },
        { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleDateString() }
      ]}
    />
  );
};

export const DocumentReview = () => {
  const [rows, setRows] = useState(null);
  const [remarks, setRemarks] = useState({});
  const load = () => api.get("/admin/documents").then((res) => setRows(res.data));

  useEffect(() => {
    load();
  }, []);

  const decide = async (row, verificationStatus) => {
    await api.put("/admin/documents/verify", {
      studentId: row.studentId,
      type: row.type,
      index: row.index,
      verificationStatus,
      verificationRemark: remarks[`${row.studentId}-${row.type}-${row.index}`] || ""
    });
    toast.success(`Document marked ${verificationStatus}`);
    load();
  };

  if (!rows) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h2 className="flex items-center gap-2 text-xl font-bold dark:text-white"><FileCheck /> Document Review</h2>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Verify or reject student qualification and certificate uploads.</p>
      </div>
      <DataTable
        rows={rows}
        searchPlaceholder="Search documents"
        columns={[
          { key: "student", label: "Student", render: (row) => `${row.studentName} (${row.identifier})` },
          { key: "type", label: "Type" },
          { key: "name", label: "Document" },
          {
            key: "file",
            label: "File",
            render: (row) =>
              row.fileData ? (
                <a href={row.fileData} target="_blank" rel="noreferrer" className="font-semibold text-mint">{row.file}</a>
              ) : (
                row.file
              )
          },
          {
            key: "verificationStatus",
            label: "Status",
            render: (row) => <span className={`rounded-lg px-2 py-1 text-xs font-bold ${row.verificationStatus === "Verified" ? "bg-mint/20 text-mint" : row.verificationStatus === "Rejected" ? "bg-coral/20 text-coral" : "bg-saffron/25 text-ink"}`}>{row.verificationStatus}</span>
          },
          {
            key: "action",
            label: "Review",
            render: (row) => {
              const key = `${row.studentId}-${row.type}-${row.index}`;
              return (
                <div className="flex min-w-80 flex-col gap-2">
                  <input
                    placeholder="Remark"
                    className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-xs dark:border-white/10 dark:bg-white/10 dark:text-white"
                    value={remarks[key] || ""}
                    onChange={(event) => setRemarks({ ...remarks, [key]: event.target.value })}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => decide(row, "Verified")} className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-ink">Verify</button>
                    <button onClick={() => decide(row, "Rejected")} className="rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white">Reject</button>
                    <button onClick={() => decide(row, "Pending")} className="rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-white">Pending</button>
                  </div>
                </div>
              );
            }
          }
        ]}
      />
    </div>
  );
};

export const AdminReports = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/admin/reports").then((res) => setData(res.data));
  }, []);
  if (!data) return <Loader />;
  const chart = data.usersByRole.map((item) => ({ role: item._id, count: item.count }));
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <h2 className="text-xl font-bold dark:text-white">System-wide Reports</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="role" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef6f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SystemSettings = () => (
  <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold dark:text-white"><Settings /> System Settings</h2>
    <div className="grid gap-4 md:grid-cols-3">
      {["Enrollment window", "Default capacity", "Notification email"].map((item) => (
        <label key={item} className="text-sm font-medium dark:text-white">
          {item}
          <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder={item} />
        </label>
      ))}
    </div>
    <button onClick={() => toast.success("Settings saved")} className="mt-5 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Save Settings</button>
  </div>
);
