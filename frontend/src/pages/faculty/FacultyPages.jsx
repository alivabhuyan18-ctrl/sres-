import { Bell, BookOpen, CalendarDays, ClipboardCheck, Clock3, Download, Printer, Send, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import { exportCsv } from "../../utils/exportCsv";
import { escapeHtml, openPrintableDocument } from "../../utils/printDocument";

const pageSize = 6;

const toMeta = (payload) => ({
  items: payload.items || [],
  total: payload.total || 0,
  pages: payload.pages || 1
});

const printFacultyReport = (title, rows) =>
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
              .map((row) => `<tr>${Object.values(row).map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`)
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

const FacultyEmptyState = ({ title = "Unable to load faculty data", message = "Please refresh the page or sign in again." }) => (
  <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-ink">
    <h2 className="text-xl font-bold dark:text-white">{title}</h2>
    <p className="mt-2 text-sm text-ink/60 dark:text-white/60">{message}</p>
  </div>
);

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, courseData] = await Promise.all([api.get("/faculty/dashboard"), api.get("/faculty/courses")]);
        setData(dashboard.data);
        setCourses(courseData.data);
      } catch {
        setError("Faculty dashboard could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (error) return <FacultyEmptyState title="Faculty dashboard unavailable" message={error} />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Students" value={data.totalStudents} icon={Users} />
        <StatCard title="Pending Approvals" value={data.pendingApprovals} icon={ClipboardCheck} tone="coral" />
        <StatCard title="Courses Handled" value={data.coursesHandled} icon={BookOpen} tone="saffron" />
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="text-mint" />
          <h2 className="text-xl font-bold dark:text-white">Course Load and Schedule</h2>
        </div>
        {courses.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course._id} className="rounded-lg border border-ink/10 p-4 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{course.branch} - {course.category}</p>
                <h3 className="mt-1 font-bold dark:text-white">{course.code}: {course.name}</h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-white/60">{course.schedule?.days || "Schedule pending"}</p>
                <p className="text-sm text-ink/60 dark:text-white/60">{course.schedule?.time || "Time pending"} - {course.schedule?.room || "Room pending"}</p>
              </div>
            ))}
          </div>
        ) : (
          <FacultyEmptyState title="No assigned courses yet" message="Assign at least one course to this faculty account to see the semester workload." />
        )}
      </div>
    </div>
  );
};

export const StudentList = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query, nextBranch = selectedBranch } = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/faculty/students", {
        params: {
          page: nextPage,
          limit: pageSize,
          search: nextQuery || undefined,
          branch: nextBranch !== "All" ? nextBranch : undefined
        }
      });
      const payload = toMeta(data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setPage(nextPage);
      setQuery(nextQuery);
      setSelectedBranch(nextBranch);
    } catch {
      setError("Student records could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextQuery: "", nextBranch: "All" });
  }, []);

  const branches = useMemo(() => ["All", "CSE", "AIML", "IT"], []);

  if (error) return <FacultyEmptyState title="Student list unavailable" message={error} />;
  if (loading && !rows.length) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Student Directory</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">These are your advisees and the students linked to your assigned courses.</p>
          </div>
          <div className="flex gap-2">
            <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white" value={selectedBranch} onChange={(event) => load({ nextPage: 1, nextBranch: event.target.value })}>
              {branches.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                exportCsv(
                  "faculty-students.csv",
                  rows.map((row) => ({
                    identifier: row.identifier,
                    name: row.name,
                    branch: row.branch,
                    department: row.department,
                    semester: row.semester,
                    email: row.email
                  }))
                )
              }
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>
      <DataTable
        rows={rows}
        searchPlaceholder="Search students"
        columns={[
          { key: "identifier", label: "Reg No." },
          { key: "name", label: "Name" },
          { key: "branch", label: "Branch" },
          { key: "department", label: "Department" },
          { key: "semester", label: "Semester" },
          { key: "email", label: "Email" }
        ]}
        serverSide
        query={query}
        onQueryChange={(value) => load({ nextPage: 1, nextQuery: value })}
        page={page}
        pageCount={meta.pages}
        onPageChange={(nextPage) => load({ nextPage })}
        totalCount={meta.total}
      />
    </div>
  );
};

export const ApproveEnrollments = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async ({ nextPage = page, nextQuery = query, nextStatus = status } = {}) => {
    try {
      setLoading(true);
      const { data } = await api.get("/faculty/enrollments", {
        params: { page: nextPage, limit: pageSize, search: nextQuery || undefined, status: nextStatus || undefined }
      });
      const payload = toMeta(data);
      setRows(payload.items);
      setMeta({ total: payload.total, pages: payload.pages });
      setPage(nextPage);
      setQuery(nextQuery);
      setStatus(nextStatus);
    } catch {
      setError("Enrollment requests could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ nextPage: 1, nextQuery: "", nextStatus: "" });
  }, []);

  if (error) return <FacultyEmptyState title="Approvals unavailable" message={error} />;
  if (loading && !rows.length) return <Loader />;

  const decide = async (enrollmentId, status) => {
    try {
      await api.put("/faculty/approve", { enrollmentId, status, remarks: remarks[enrollmentId] || "" });
      toast.success(`Enrollment ${status}`);
      load();
    } catch {
      toast.error("Unable to update enrollment right now.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white" value={status} onChange={(event) => load({ nextPage: 1, nextStatus: event.target.value })}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <DataTable
        rows={rows}
        searchPlaceholder="Search enrollment requests"
        columns={[
          { key: "student", label: "Student", render: (row) => `${row.student?.name} (${row.student?.identifier})` },
          {
            key: "course",
          label: "Course",
          render: (row) => (
            <div>
              <p className="font-semibold">{row.course?.code} - {row.course?.name}</p>
              <p className="text-xs text-ink/55 dark:text-white/55">{row.course?.branch || "Common"} - {row.course?.category || "General"}</p>
            </div>
          )
        },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Requested", render: (row) => new Date(row.createdAt).toLocaleDateString() },
        {
          key: "action",
          label: "Action",
          render: (row) =>
            row.status === "pending" ? (
              <div className="flex min-w-72 flex-col gap-2">
                <input
                  value={remarks[row._id] || ""}
                  onChange={(event) => setRemarks((current) => ({ ...current, [row._id]: event.target.value }))}
                  placeholder="Optional approval remark"
                  className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 text-xs dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <div className="flex gap-2">
                  <button onClick={() => decide(row._id, "approved")} className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-ink">Approve</button>
                  <button onClick={() => decide(row._id, "rejected")} className="rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white">Reject</button>
                </div>
              </div>
            ) : (
              <span className="text-ink/60 dark:text-white/60">Reviewed</span>
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
      />
    </div>
  );
};

export const AttendanceManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState({ studentId: "", courseId: "", totalClasses: 40, attendedClasses: 35 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [studentData, courseData, enrollmentData] = await Promise.all([
          api.get("/faculty/students"),
          api.get("/faculty/courses"),
          api.get("/faculty/enrollments")
        ]);
        setStudents(studentData.data);
        setCourses(courseData.data);
        setEnrollments(enrollmentData.data);
      } catch {
        setError("Attendance tools could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedCourse = courses.find((course) => course._id === form.courseId);
  const approvedStudentIds = new Set(
    enrollments
      .filter((item) => item.status === "approved" && item.course?._id === form.courseId)
      .map((item) => String(item.student?._id))
  );
  const filteredStudents = selectedCourse ? students.filter((student) => approvedStudentIds.has(String(student._id))) : [];

  const save = async (event) => {
    event.preventDefault();
    if (!form.courseId || !form.studentId) {
      toast.error("Select a course and a student first.");
      return;
    }
    try {
      await api.put("/faculty/attendance", form);
      toast.success("Attendance updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update attendance right now.");
    }
  };

  if (loading) return <Loader />;
  if (error) return <FacultyEmptyState title="Attendance tools unavailable" message={error} />;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Attendance Management</h2>
        <p className="text-sm text-ink/60 dark:text-white/60">Only approved students in your assigned courses can receive attendance updates.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {courses.map((course) => (
          <button
            key={course._id}
            type="button"
            onClick={() => setForm({ ...form, courseId: course._id, studentId: "" })}
            className={`rounded-lg border p-4 text-left shadow-soft transition ${form.courseId === course._id ? "border-mint bg-mint/10" : "border-ink/10 bg-white dark:border-white/10 dark:bg-ink"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{course.branch} - {course.category}</p>
            <h3 className="mt-1 font-bold dark:text-white">{course.code}</h3>
            <p className="text-sm text-ink/65 dark:text-white/65">{course.name}</p>
            <p className="mt-2 text-xs text-ink/55 dark:text-white/55">
              Approved students: {enrollments.filter((item) => item.status === "approved" && item.course?._id === course._id).length}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink/55 dark:text-white/55"><Clock3 size={14} /> {course.schedule?.days || "Days pending"} - {course.schedule?.time || "Time pending"}</p>
          </button>
        ))}
      </div>

      <form onSubmit={save} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="grid gap-4 md:grid-cols-4">
          <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value, studentId: "" })}>
            <option value="">Select course</option>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.code} - {course.name}</option>)}
          </select>
          <select className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
            <option value="">Select student</option>
            {filteredStudents.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.identifier})</option>)}
          </select>
          <input type="number" className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.totalClasses} onChange={(event) => setForm({ ...form, totalClasses: Number(event.target.value) })} />
          <input type="number" className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" value={form.attendedClasses} onChange={(event) => setForm({ ...form, attendedClasses: Number(event.target.value) })} />
        </div>
        {selectedCourse && (
          <div className="mt-4 rounded-lg bg-paper p-4 text-sm dark:bg-white/10">
            <p className="font-semibold dark:text-white">{selectedCourse.code}: {selectedCourse.name}</p>
            <p className="mt-1 text-ink/60 dark:text-white/60">{selectedCourse.branch} - {selectedCourse.category}</p>
            <p className="mt-1 text-ink/60 dark:text-white/60">{selectedCourse.schedule?.days || "Days pending"} - {selectedCourse.schedule?.time || "Time pending"} - {selectedCourse.schedule?.room || "Room pending"}</p>
            {!filteredStudents.length && <p className="mt-2 text-coral">No approved students are linked to this course yet.</p>}
          </div>
        )}
        <button className="mt-5 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Update Attendance</button>
      </form>
    </div>
  );
};

export const FacultyReports = () => {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get("/faculty/enrollments").then((res) => setRows(res.data)).catch(() => setRows([]));
  }, []);

  if (!rows) return <Loader />;

  const data = ["approved", "pending", "rejected"].map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: rows.filter((row) => row.status === status).length
  }));
  const reportRows = rows.map((row) => ({
    student: row.student?.name || "",
    identifier: row.student?.identifier || "",
    courseCode: row.course?.code || "",
    courseName: row.course?.name || "",
    branch: row.course?.branch || "",
    status: row.status,
    requestedOn: new Date(row.createdAt).toLocaleDateString()
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Enrollment Stats</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Live approval data for your assigned students and courses.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportCsv(
                "faculty-enrollment-report.csv",
                reportRows
              )
            }
            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button type="button" onClick={() => printFacultyReport("Faculty Enrollment Report", reportRows)} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-mint dark:text-ink">
            <Printer size={16} />
            Export PDF
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Approved" value={data.find((item) => item.name === "Approved")?.value || 0} icon={ClipboardCheck} />
        <StatCard title="Pending" value={data.find((item) => item.name === "Pending")?.value || 0} icon={Clock3} tone="saffron" />
        <StatCard title="Rejected" value={data.find((item) => item.name === "Rejected")?.value || 0} icon={Bell} tone="coral" />
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
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
    </div>
  );
};

export const FacultyNotifications = () => {
  const [form, setForm] = useState({ title: "", message: "" });
  const send = async (event) => {
    event.preventDefault();
    try {
      await api.post("/faculty/notifications", form);
      setForm({ title: "", message: "" });
      toast.success("Announcement sent");
    } catch {
      toast.error("Unable to send announcement right now.");
    }
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
