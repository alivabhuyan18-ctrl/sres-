import { Activity, BookOpen, ClipboardCheck, Download, FileCheck, FileText, GraduationCap, Pencil, Plus, Printer, RotateCcw, Save, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import { exportCsv } from "../../utils/exportCsv";
import { escapeHtml, openPrintableDocument } from "../../utils/printDocument";

const emptyUserForm = (role) => ({
  name: "",
  identifier: "",
  email: "",
  password: "password123",
  role,
  department: "",
  branch: "",
  semester: role === "student" ? 1 : "",
  designation: "",
  phone: "",
  programme: "B.Tech",
  programmeType: "Regular",
  advisor: "",
  isActive: true
});

const emptyCourseForm = {
  code: "",
  name: "",
  credits: 3,
  capacity: 50,
  semester: 1,
  department: "Computer Science",
  branch: "CSE",
  category: "Professional Core",
  courseKind: "theory",
  instructor: "",
  prerequisites: [],
  isActive: true,
  schedule: { days: "", time: "", room: "" }
};

const pageSize = 6;

const toMeta = (payload) => ({
  items: payload.items || [],
  total: payload.total || 0,
  pages: payload.pages || 1
});

const listItems = (payload) => (Array.isArray(payload) ? payload : toMeta(payload).items);

const reportCards = (data) => {
  const roleTotal = data.usersByRole.reduce((sum, item) => sum + item.count, 0);
  const enrollmentTotal = data.enrollmentStatus.reduce((sum, item) => sum + item.count, 0);
  const verifiedDocs = data.documentsByStatus?.find((item) => item._id === "Verified")?.count || 0;
  return { roleTotal, enrollmentTotal, verifiedDocs };
};

const printReportSummary = (title, rows) =>
  {
    const printWindow = openPrintableDocument({
      title,
      subtitle: "Use your browser print dialog to save this as a PDF.",
      content: `
        <table>
          <thead>
            <tr>${Object.keys(rows[0] || {}).map((key) => `<th>${escapeHtml(key)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${Object.values(row).map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      `
    });

    if (!printWindow) {
      toast.error("Allow pop-ups in your browser to export the report.");
    }
    return printWindow;
  };

const AdminEmptyState = ({ title = "Unable to load admin data", message = "Please refresh the page or sign in again." }) => (
  <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-ink">
    <h2 className="text-xl font-bold dark:text-white">{title}</h2>
    <p className="mt-2 text-sm text-ink/60 dark:text-white/60">{message}</p>
  </div>
);

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data)).catch(() => setError("Admin dashboard could not be loaded right now."));
  }, []);
  if (error) return <AdminEmptyState title="Admin dashboard unavailable" message={error} />;
  if (!data) return <Loader />;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Students" value={data.students} icon={Users} />
        <StatCard title="Faculty" value={data.faculty} icon={GraduationCap} tone="saffron" />
        <StatCard title="Courses" value={data.courses} icon={BookOpen} tone="coral" />
        <StatCard title="Revenue" value={`INR ${data.revenue.toLocaleString("en-IN")}`} icon={ClipboardCheck} tone="ink" />
        <StatCard title="Pending Docs" value={data.documentsPending || 0} icon={FileCheck} />
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="text-mint" />
          <h2 className="text-xl font-bold dark:text-white">Recent Admin Activity</h2>
        </div>
        <div className="space-y-3">
          {(data.recentActions || []).map((item) => (
            <div key={item._id} className="rounded-lg bg-paper px-4 py-3 dark:bg-white/10">
              <p className="font-semibold dark:text-white">{item.summary}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ink/55 dark:text-white/55">{item.action}</p>
              <p className="mt-1 text-xs text-ink/55 dark:text-white/55">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ role, title }) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [form, setForm] = useState(emptyUserForm(role));
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query } = {}) => {
    setLoading(true);
    try {
      const params = { role, page: nextPage, limit: pageSize };
      if (nextQuery.trim()) params.search = nextQuery.trim();
      const [usersRes, facultyRes] = await Promise.all([
        api.get("/admin/users", { params }),
        role === "student" ? api.get("/admin/users?role=faculty") : Promise.resolve({ data: [] })
      ]);
      const payload = toMeta(usersRes.data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setFacultyOptions(listItems(facultyRes.data));
      setPage(nextPage);
      setQuery(nextQuery);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(emptyUserForm(role));
    setEditingId("");
    load({ nextPage: 1, nextQuery: "" });
  }, [role]);

  const resetForm = () => {
    setEditingId("");
    setForm(emptyUserForm(role));
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form };
      if (role !== "student") {
        delete payload.semester;
        delete payload.branch;
        delete payload.programme;
        delete payload.programmeType;
        delete payload.advisor;
      } else {
        delete payload.designation;
      }
      if (!payload.advisor) delete payload.advisor;
      if (editingId) {
        delete payload.password;
        delete payload.identifier;
        delete payload.role;
        await api.put(`/admin/users/${editingId}`, payload);
        toast.success(`${title.slice(0, -1)} updated`);
      } else {
        await api.post("/admin/users", payload);
        toast.success(`${title.slice(0, -1)} added`);
      }
      resetForm();
      load({ nextPage: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save user");
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setForm({
      ...emptyUserForm(role),
      ...row,
      advisor: row.advisor?._id || row.advisor || "",
      password: ""
    });
  };

  const toggleStatus = async (row) => {
    try {
      await api.put(`/admin/users/${row._id}`, { isActive: !row.isActive });
      toast.success(`${title.slice(0, -1)} ${row.isActive ? "deactivated" : "reactivated"}`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update status");
    }
  };

  const exportRows = () =>
    exportCsv(
      `${role}-directory.csv`,
      rows.map((row) => ({
        identifier: row.identifier,
        name: row.name,
        email: row.email,
        department: row.department,
        branch: row.branch || "",
        designation: row.designation || "",
        status: row.isActive ? "Active" : "Inactive"
      }))
    );

  if (loading && !rows.length) return <Loader />;
  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold dark:text-white">
              {editingId ? <Pencil size={20} /> : <Plus size={20} />}
              {editingId ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
            </h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Manage account status, role data, and advisor assignments from one form.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportRows} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white">
              <Download size={16} />
              Export CSV
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white">
                <RotateCcw size={16} />
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Full Name
            <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Identifier
            <input disabled={Boolean(editingId)} className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Email
            <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          {!editingId && (
            <label className="text-sm font-medium text-ink/75 dark:text-white/75">
              Temporary Password
              <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
          )}
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Department
            <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          </label>
          {role === "student" ? (
            <label className="text-sm font-medium text-ink/75 dark:text-white/75">
              Branch
              <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} />
            </label>
          ) : (
            <label className="text-sm font-medium text-ink/75 dark:text-white/75">
              Designation
              <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
            </label>
          )}
          {role === "student" ? (
            <label className="text-sm font-medium text-ink/75 dark:text-white/75">
              Semester
              <input type="number" min="1" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.semester} onChange={(event) => setForm({ ...form, semester: Number(event.target.value) })} />
            </label>
          ) : (
            <label className="text-sm font-medium text-ink/75 dark:text-white/75">
              Phone
              <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
          )}
          {role === "student" && (
            <>
              <label className="text-sm font-medium text-ink/75 dark:text-white/75">
                Programme
                <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.programme} onChange={(event) => setForm({ ...form, programme: event.target.value })} />
              </label>
              <label className="text-sm font-medium text-ink/75 dark:text-white/75">
                Programme Type
                <input className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.programmeType} onChange={(event) => setForm({ ...form, programmeType: event.target.value })} />
              </label>
              <label className="text-sm font-medium text-ink/75 dark:text-white/75">
                Assigned Advisor
                <select className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.advisor} onChange={(event) => setForm({ ...form, advisor: event.target.value })}>
                  <option value="">Select Advisor</option>
                  {facultyOptions.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>{faculty.name} ({faculty.identifier})</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">
          <Save size={16} />
          {editingId ? "Update Account" : "Create Account"}
        </button>
      </form>
      <DataTable
        rows={rows}
        columns={[
          { key: "identifier", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "department", label: "Department" },
          { key: role === "student" ? "branch" : "designation", label: role === "student" ? "Branch" : "Designation" },
          { key: "advisor", label: role === "student" ? "Advisor" : "Status", render: (row) => (role === "student" ? row.advisor?.name || "Unassigned" : row.isActive ? "Active" : "Inactive") },
          {
            key: "action",
            label: "Action",
            render: (row) => (
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(row)} className="rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-white">Edit</button>
                <button type="button" onClick={() => toggleStatus(row)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${row.isActive ? "bg-coral text-white" : "bg-mint text-ink"}`}>
                  {row.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            )
          }
        ]}
        serverSide
        query={query}
        onQueryChange={(value) => load({ nextPage: 1, nextQuery: value })}
        page={page}
        pageCount={meta.pages}
        onPageChange={(nextPage) => load({ nextPage })}
        totalCount={meta.total}
        searchPlaceholder={`Search ${title.toLowerCase()}`}
      />
    </div>
  );
};

export const ManageStudents = () => <UserManagement role="student" title="Students" />;
export const ManageFaculty = () => <UserManagement role="faculty" title="Faculty" />;

export const ManageCourses = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [form, setForm] = useState(emptyCourseForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query } = {}) => {
    setLoading(true);
    try {
      const [courseRes, allRes, facultyRes] = await Promise.all([
        api.get("/admin/courses", { params: { page: nextPage, limit: pageSize, search: nextQuery || undefined } }),
        api.get("/admin/courses"),
        api.get("/admin/users?role=faculty")
      ]);
      const payload = toMeta(courseRes.data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setAllCourses(listItems(allRes.data));
      setFacultyOptions(listItems(facultyRes.data));
      setPage(nextPage);
      setQuery(nextQuery);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextQuery: "" });
  }, []);

  const resetForm = () => {
    setEditingId("");
    setForm(emptyCourseForm);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        prerequisites: form.prerequisites.filter(Boolean)
      };
      if (!payload.instructor) delete payload.instructor;
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, payload);
        toast.success("Course updated");
      } else {
        await api.post("/admin/courses", payload);
        toast.success("Course added");
      }
      resetForm();
      load({ nextPage: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save course");
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setForm({
      code: row.code,
      name: row.name,
      credits: row.credits,
      capacity: row.capacity,
      semester: row.semester,
      department: row.department || "Computer Science",
      branch: row.branch || "CSE",
      category: row.category || "Professional Core",
      courseKind: row.courseKind || "theory",
      instructor: row.instructor?._id || row.instructor || "",
      prerequisites: (row.prerequisites || []).map((item) => item._id || item),
      isActive: row.isActive,
      schedule: {
        days: row.schedule?.days || "",
        time: row.schedule?.time || "",
        room: row.schedule?.room || ""
      }
    });
  };

  const toggleCourseStatus = async (row) => {
    try {
      await api.put(`/admin/courses/${row._id}`, { isActive: !row.isActive });
      toast.success(`Course ${row.isActive ? "disabled" : "activated"}`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update course");
    }
  };

  if (loading && !rows.length) return <Loader />;
  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">{editingId ? "Edit Course" : "Add Course"}</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Control delivery, capacity, prerequisites, and the assigned instructor in one place.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                exportCsv(
                  "course-catalog.csv",
                  rows.map((row) => ({
                    code: row.code,
                    name: row.name,
                    branch: row.branch,
                    semester: row.semester,
                    category: row.category,
                    type: row.courseKind,
                    instructor: row.instructor?.name || "Unassigned",
                    status: row.isActive ? "Active" : "Inactive"
                  }))
                )
              }
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white"
            >
              <Download size={16} />
              Export CSV
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white">
                <RotateCcw size={16} />
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Course Code
            <input placeholder="Course code" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Course Name
            <input placeholder="Course name" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Semester
            <input type="number" min="1" placeholder="Semester number" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.semester} onChange={(event) => setForm({ ...form, semester: Number(event.target.value) })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Credits
            <input type="number" min="1" placeholder="Credits" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.credits} onChange={(event) => setForm({ ...form, credits: Number(event.target.value) })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Capacity
            <input type="number" min="1" placeholder="Seat capacity" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Department
            <input placeholder="Department" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Branch
            <input placeholder="Branch" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Course Category
            <input placeholder="Category" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Course Type
            <select className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.courseKind} onChange={(event) => setForm({ ...form, courseKind: event.target.value })}>
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
            </select>
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Assigned Instructor
            <select className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.instructor} onChange={(event) => setForm({ ...form, instructor: event.target.value })}>
              <option value="">Assign Instructor</option>
              {facultyOptions.map((faculty) => (
                <option key={faculty._id} value={faculty._id}>{faculty.name} ({faculty.identifier})</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Schedule Days
            <input placeholder="Mon, Wed" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.schedule.days} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, days: event.target.value } })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Schedule Time
            <input placeholder="09:00 AM - 10:00 AM" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.schedule.time} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, time: event.target.value } })} />
          </label>
          <label className="text-sm font-medium text-ink/75 dark:text-white/75">
            Room
            <input placeholder="Room / Lab" className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.schedule.room} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, room: event.target.value } })} />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium dark:text-white">
          Prerequisites
          <select
            multiple
            className="focus-ring mt-2 min-h-32 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white"
            value={form.prerequisites}
            onChange={(event) => setForm({ ...form, prerequisites: Array.from(event.target.selectedOptions, (option) => option.value) })}
          >
            {allCourses
              .filter((course) => !editingId || course._id !== editingId)
              .map((course) => (
                <option key={course._id} value={course._id}>{course.code} - {course.name}</option>
              ))}
          </select>
        </label>
        <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">
          <Save size={16} />
          {editingId ? "Update Course" : "Add Course"}
        </button>
      </form>
      <DataTable
        rows={rows}
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "branch", label: "Branch" },
          { key: "category", label: "Category" },
          { key: "credits", label: "Credits" },
          { key: "capacity", label: "Capacity" },
          { key: "semester", label: "Semester" },
          { key: "instructor", label: "Instructor", render: (row) => row.instructor?.name || "Unassigned" },
          { key: "schedule", label: "Schedule", render: (row) => `${row.schedule?.days || "-"} / ${row.schedule?.time || "-"}` },
          { key: "prerequisites", label: "Prerequisites", render: (row) => row.prerequisites?.map((item) => item.code).join(", ") || "None" },
          { key: "status", label: "Status", render: (row) => (row.isActive ? "Active" : "Inactive") },
          {
            key: "action",
            label: "Action",
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={() => startEdit(row)} className="rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-white">Edit</button>
                <button onClick={() => toggleCourseStatus(row)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${row.isActive ? "bg-coral text-white" : "bg-mint text-ink"}`}>
                  {row.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            )
          }
        ]}
        serverSide
        query={query}
        onQueryChange={(value) => load({ nextPage: 1, nextQuery: value })}
        page={page}
        pageCount={meta.pages}
        onPageChange={(nextPage) => load({ nextPage })}
        totalCount={meta.total}
        searchPlaceholder="Search courses"
      />
    </div>
  );
};

export const EnrollmentManagement = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query, nextStatus = status } = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/enrollments", {
        params: { page: nextPage, limit: pageSize, search: nextQuery || undefined, status: nextStatus || undefined }
      });
      const payload = toMeta(data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setPage(nextPage);
      setQuery(nextQuery);
      setStatus(nextStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextQuery: "", nextStatus: "" });
  }, []);
  if (loading && !rows.length) return <Loader />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white" value={status} onChange={(event) => load({ nextPage: 1, nextStatus: event.target.value })}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="button"
          onClick={() =>
            exportCsv(
              "admin-enrollments.csv",
              rows.map((row) => ({
                student: row.student?.name || "",
                identifier: row.student?.identifier || "",
                branch: row.student?.branch || "",
                courseCode: row.course?.code || "",
                courseName: row.course?.name || "",
                status: row.status,
                approvedBy: row.approvedBy?.name || "Pending",
                createdAt: new Date(row.createdAt).toLocaleDateString()
              }))
            )
          }
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <DataTable
        rows={rows}
        columns={[
          { key: "student", label: "Student", render: (row) => `${row.student?.name} (${row.student?.identifier})` },
          { key: "course", label: "Course", render: (row) => `${row.course?.code} ${row.course?.name}` },
          { key: "status", label: "Status" },
          { key: "approvedBy", label: "Approved By", render: (row) => row.approvedBy?.name || "Pending" },
          { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleDateString() }
        ]}
        serverSide
        query={query}
        onQueryChange={(value) => load({ nextPage: 1, nextQuery: value })}
        page={page}
        pageCount={meta.pages}
        onPageChange={(nextPage) => load({ nextPage })}
        totalCount={meta.total}
        searchPlaceholder="Search all enrollments"
      />
    </div>
  );
};

export const DocumentReview = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query, nextStatus = status } = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/documents", {
        params: { page: nextPage, limit: pageSize, search: nextQuery || undefined, status: nextStatus || undefined }
      });
      const payload = toMeta(data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setPage(nextPage);
      setQuery(nextQuery);
      setStatus(nextStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextQuery: "", nextStatus: "" });
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

  if (loading && !rows.length) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold dark:text-white"><FileCheck /> Document Review</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Verify or reject student qualification and certificate uploads.</p>
          </div>
          <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white" value={status} onChange={(event) => load({ nextPage: 1, nextStatus: event.target.value })}>
            <option value="">All documents</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Not Uploaded">Not Uploaded</option>
          </select>
        </div>
      </div>
      <DataTable
        rows={rows}
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
        serverSide
        query={query}
        onQueryChange={(value) => load({ nextPage: 1, nextQuery: value })}
        page={page}
        pageCount={meta.pages}
        onPageChange={(nextPage) => load({ nextPage })}
        totalCount={meta.total}
        searchPlaceholder="Search documents"
      />
    </div>
  );
};

export const AdminReports = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/admin/reports").then((res) => setData(res.data)).catch(() => setError("Admin reports could not be loaded right now."));
  }, []);
  if (error) return <AdminEmptyState title="Reports unavailable" message={error} />;
  if (!data) return <Loader />;
  const roleChart = data.usersByRole.map((item) => ({ label: item._id, count: item.count }));
  const enrollmentChart = data.enrollmentStatus.map((item) => ({ label: item._id, count: item.count }));
  const documentChart = (data.documentsByStatus || []).map((item) => ({ label: item._id, count: item.count }));
  const cards = reportCards(data);
  const reportRows = [
    ...roleChart.map((row) => ({ section: "Users By Role", label: row.label, count: row.count })),
    ...enrollmentChart.map((row) => ({ section: "Enrollment Status", label: row.label, count: row.count })),
    ...documentChart.map((row) => ({ section: "Document Status", label: row.label, count: row.count })),
    { section: "Pending Payments", label: "count", count: data.pendingPayments?.count || 0 },
    { section: "Pending Payments", label: "amount", count: data.pendingPayments?.total || 0 }
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">System-wide Reports</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Export quick snapshots for users, enrollments, documents, and financial follow-ups.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => exportCsv("admin-report-summary.csv", reportRows)}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button type="button" onClick={() => printReportSummary("Admin Report Summary", reportRows)} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-mint dark:text-ink">
              <Printer size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="User Accounts" value={cards.roleTotal} icon={Users} />
        <StatCard title="Enrollment Records" value={cards.enrollmentTotal} icon={ClipboardCheck} tone="saffron" />
        <StatCard title="Verified Documents" value={cards.verifiedDocs} icon={FileCheck} tone="coral" />
        <StatCard title="Pending Fees" value={`INR ${(data.pendingPayments?.total || 0).toLocaleString("en-IN")}`} icon={FileText} tone="ink" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Users By Role</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef6f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Enrollment Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2fbf9f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Document Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={documentChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f4b740" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Students By Branch</h3>
          <div className="space-y-3">
            {(data.branchWiseStudents || []).map((item) => (
              <div key={item._id || "unassigned"} className="rounded-lg bg-paper px-4 py-3 dark:bg-white/10">
                <div className="flex items-center justify-between">
                  <p className="font-semibold dark:text-white">{item._id || "Unassigned"}</p>
                  <span className="rounded-lg bg-mint/15 px-2 py-1 text-xs font-bold text-mint">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Recent Audit Trail</h3>
          <div className="space-y-3">
            {(data.recentActivity || []).map((item) => (
              <div key={item._id} className="rounded-lg border border-ink/10 p-3 dark:border-white/10">
                <p className="font-semibold dark:text-white">{item.summary}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink/55 dark:text-white/55">{item.action}</p>
                <p className="mt-1 text-xs text-ink/55 dark:text-white/55">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
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
