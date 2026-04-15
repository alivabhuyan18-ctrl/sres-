import { Bell, BookOpen, ClipboardCheck, CreditCard, Hourglass, Pencil, Printer, Receipt, Save, ShieldCheck, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";

const useStudentData = () => {
  const [state, setState] = useState({ loading: true, data: null });
  const load = async () => {
    try {
      const { data } = await api.get("/student/profile");
      setState({ loading: false, data });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("sres_token");
        localStorage.removeItem("sres_user");
        window.location.href = "/login";
        return;
      }
      setState({ loading: false, data: null });
    }
  };
  useEffect(() => {
    load();
  }, []);
  return { ...state, reload: load };
};

const EmptyState = ({ title = "Unable to load data", message = "Please refresh the page or login again." }) => (
  <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-ink">
    <h2 className="text-xl font-bold dark:text-white">{title}</h2>
    <p className="mt-2 text-sm text-ink/60 dark:text-white/60">{message}</p>
  </div>
);

export const StudentDashboard = () => {
  const { loading, data } = useStudentData();
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const approved = data.enrollments.filter((item) => item.status === "approved").length;
  const pending = data.enrollments.filter((item) => item.status === "pending").length;
  const attendance = data.attendance.length ? Math.round(data.attendance.reduce((sum, item) => sum + item.percentage, 0) / data.attendance.length) : 0;
  const feeStatus = data.payments.some((item) => item.status === "pending") ? "Due" : "Clear";

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-ink p-6 text-white shadow-soft">
        <p className="text-white/70">Registration No. {data.profile.identifier}</p>
        <h2 className="mt-2 text-3xl font-bold">Welcome, {data.profile.name}</h2>
        <p className="mt-2 text-white/70">Semester {data.profile.semester} - {data.profile.department}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Enrolled Courses" value={approved} icon={BookOpen} />
        <StatCard title="Attendance" value={`${attendance}%`} icon={ClipboardCheck} tone="saffron" />
        <StatCard title="Fee Status" value={feeStatus} icon={CreditCard} tone="coral" />
        <StatCard title="Pending Approvals" value={pending} icon={Hourglass} tone="ink" />
      </div>
    </div>
  );
};

const getNestedValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source) || "";

const setNestedValue = (source, path, value) => {
  const keys = path.split(".");
  const next = { ...source };
  let current = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }
    current[key] = { ...(current[key] || {}) };
    current = current[key];
  });
  return next;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const FieldGrid = ({ fields, form, setForm, editable, columns = "md:grid-cols-2 xl:grid-cols-3" }) => (
  <div className={`grid gap-4 ${columns}`}>
    {fields.map((field) => (
      <label key={field.path} className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/55">
        {field.label}
        <input
          disabled={!editable}
          className="focus-ring mt-2 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/65 dark:border-white/10 dark:bg-white/10 dark:text-white dark:disabled:bg-white/5 dark:disabled:text-white/65"
          value={getNestedValue(form, field.path)}
          onChange={(event) => setForm(setNestedValue(form, field.path, event.target.value))}
        />
      </label>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Complete: "bg-mint/15 text-mint",
    Incomplete: "bg-coral/15 text-coral",
    Verified: "bg-mint/15 text-mint",
    Pending: "bg-saffron/25 text-ink",
    Rejected: "bg-coral/15 text-coral",
    "Not Uploaded": "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60"
  };
  return <span className={`rounded-lg px-2 py-1 text-xs font-bold ${styles[status] || styles.Incomplete}`}>{status}</span>;
};

const ProfileSection = ({ title, subtitle, status, children, editing, onEdit, onSave, onCancel }) => (
  <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-bold text-ink/80 dark:text-white">{title}</h3>
          {status && <StatusBadge status={status} />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink/55 dark:text-white/55">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        {editing ? (
          <>
            <button type="button" onClick={onSave} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-semibold text-ink">
              <Save size={16} /> Save
            </button>
            <button type="button" onClick={onCancel} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
              <X size={16} /> Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={onEdit} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-mint dark:text-ink">
            <Pencil size={16} /> Edit
          </button>
        )}
      </div>
    </div>
    {children}
  </section>
);

const basicFields = [
  { label: "Registration No.", path: "identifier" },
  { label: "Application No.", path: "applicationNo" },
  { label: "Name", path: "name" },
  { label: "Rank", path: "rank" },
  { label: "Admission Status", path: "admissionStatus" },
  { label: "Joining Year", path: "joiningYear" },
  { label: "Semester", path: "semester" },
  { label: "Programme", path: "programme" },
  { label: "Programme Type", path: "programmeType" },
  { label: "Branch", path: "branch" }
];

const allotmentFields = [
  { label: "Batch", path: "allotmentDetails.batch" },
  { label: "Joining Year", path: "allotmentDetails.joiningYear" },
  { label: "Admission Dt.", path: "allotmentDetails.admissionDate" },
  { label: "Admission Type", path: "allotmentDetails.admissionType" },
  { label: "Fee Type", path: "allotmentDetails.feeType" },
  { label: "Is TFW", path: "allotmentDetails.isTfw" },
  { label: "Is PC", path: "allotmentDetails.isPc" },
  { label: "Seat Category", path: "allotmentDetails.seatCategory" },
  { label: "Category", path: "allotmentDetails.category" },
  { label: "Caste", path: "allotmentDetails.caste" },
  { label: "OJEE Rank", path: "allotmentDetails.ojeeRank" },
  { label: "Is Lateral", path: "allotmentDetails.isLateral" },
  { label: "Hostel Willingness", path: "allotmentDetails.hostelWillingness" },
  { label: "Hostel Allocated", path: "allotmentDetails.hostelAllocated" },
  { label: "Hostel Name", path: "allotmentDetails.hostelName" },
  { label: "Interested in Internal Sliding", path: "allotmentDetails.interestedInternalSliding" }
];

const personalFields = [
  { label: "DOB", path: "personalDetails.dob" },
  { label: "Gender", path: "personalDetails.gender" },
  { label: "Father Name", path: "personalDetails.fatherName" },
  { label: "Father Occupation", path: "personalDetails.fatherOccupation" },
  { label: "Father Aadhar", path: "personalDetails.fatherAadhar" },
  { label: "Mother Name", path: "personalDetails.motherName" },
  { label: "Mother Occupation", path: "personalDetails.motherOccupation" },
  { label: "Mother Aadhar", path: "personalDetails.motherAadhar" },
  { label: "Annual Income", path: "personalDetails.annualIncome" },
  { label: "Blood Group", path: "personalDetails.bloodGroup" },
  { label: "Mother Tongue", path: "personalDetails.motherTongue" },
  { label: "Religion", path: "personalDetails.religion" },
  { label: "Nationality", path: "personalDetails.nationality" },
  { label: "Country", path: "personalDetails.country" },
  { label: "Aadhar No.", path: "personalDetails.aadharNo" },
  { label: "Mole or Similar", path: "personalDetails.moleOrSimilar" },
  { label: "Account No.", path: "personalDetails.accountNo" },
  { label: "Bank Name", path: "personalDetails.bankName" },
  { label: "Bank Branch", path: "personalDetails.bankBranch" },
  { label: "IFSC Code", path: "personalDetails.ifscCode" }
];

const communicationFields = [
  { label: "Landline", path: "communicationDetails.landline" },
  { label: "Parent Mobile", path: "communicationDetails.parentMobile" },
  { label: "Student Mobile WhatsApp", path: "communicationDetails.studentMobileWhatsapp" },
  { label: "Student Email", path: "communicationDetails.studentEmail" },
  { label: "Parent Email", path: "communicationDetails.parentEmail" },
  { label: "Correspondence Guardian", path: "communicationDetails.correspondenceGuardian" },
  { label: "Correspondence Door No.", path: "communicationDetails.correspondenceDoorNo" },
  { label: "Correspondence Street", path: "communicationDetails.correspondenceStreet" },
  { label: "Correspondence Village/City", path: "communicationDetails.correspondenceVillageCity" },
  { label: "Correspondence State", path: "communicationDetails.correspondenceState" },
  { label: "Correspondence District", path: "communicationDetails.correspondenceDistrict" },
  { label: "Correspondence Pin Code", path: "communicationDetails.correspondencePinCode" },
  { label: "Permanent Guardian", path: "communicationDetails.permanentGuardian" },
  { label: "Permanent Door No.", path: "communicationDetails.permanentDoorNo" },
  { label: "Permanent Street", path: "communicationDetails.permanentStreet" },
  { label: "Permanent Village/City", path: "communicationDetails.permanentVillageCity" },
  { label: "Permanent State", path: "communicationDetails.permanentState" },
  { label: "Permanent District", path: "communicationDetails.permanentDistrict" },
  { label: "Permanent Pin Code", path: "communicationDetails.permanentPinCode" }
];

const FieldGroup = ({ title, fields, form, setForm, editable, columns }) => (
  <div className="rounded-lg border border-ink/10 bg-paper/70 p-4 dark:border-white/10 dark:bg-white/5">
    <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink/70 dark:text-white/70">{title}</h4>
    <FieldGrid fields={fields} form={form} setForm={setForm} editable={editable} columns={columns} />
  </div>
);

const allotmentGroups = [
  {
    title: "Admission Information",
    fields: [
      { label: "Batch", path: "allotmentDetails.batch" },
      { label: "Joining Year", path: "allotmentDetails.joiningYear" },
      { label: "Admission Dt.", path: "allotmentDetails.admissionDate" },
      { label: "Admission Type", path: "allotmentDetails.admissionType" },
      { label: "Fee Type", path: "allotmentDetails.feeType" }
    ]
  },
  {
    title: "Seat and Category",
    fields: [
      { label: "Is TFW", path: "allotmentDetails.isTfw" },
      { label: "Is PC", path: "allotmentDetails.isPc" },
      { label: "Seat Category", path: "allotmentDetails.seatCategory" },
      { label: "Category", path: "allotmentDetails.category" },
      { label: "Caste", path: "allotmentDetails.caste" },
      { label: "OJEE Rank", path: "allotmentDetails.ojeeRank" },
      { label: "Is Lateral", path: "allotmentDetails.isLateral" }
    ]
  },
  {
    title: "Hostel and Sliding",
    fields: [
      { label: "Hostel Willingness", path: "allotmentDetails.hostelWillingness" },
      { label: "Hostel Allocated", path: "allotmentDetails.hostelAllocated" },
      { label: "Hostel Name", path: "allotmentDetails.hostelName" },
      { label: "Interested in Internal Sliding", path: "allotmentDetails.interestedInternalSliding" }
    ]
  }
];

const personalGroups = [
  {
    title: "Student Identity",
    fields: [
      { label: "DOB", path: "personalDetails.dob" },
      { label: "Gender", path: "personalDetails.gender" },
      { label: "Blood Group", path: "personalDetails.bloodGroup" },
      { label: "Mother Tongue", path: "personalDetails.motherTongue" },
      { label: "Religion", path: "personalDetails.religion" },
      { label: "Nationality", path: "personalDetails.nationality" },
      { label: "Country", path: "personalDetails.country" }
    ]
  },
  {
    title: "Parent Details",
    fields: [
      { label: "Father Name", path: "personalDetails.fatherName" },
      { label: "Father Occupation", path: "personalDetails.fatherOccupation" },
      { label: "Father Aadhar", path: "personalDetails.fatherAadhar" },
      { label: "Mother Name", path: "personalDetails.motherName" },
      { label: "Mother Occupation", path: "personalDetails.motherOccupation" },
      { label: "Mother Aadhar", path: "personalDetails.motherAadhar" },
      { label: "Annual Income", path: "personalDetails.annualIncome" }
    ]
  },
  {
    title: "Identification and Bank Details",
    fields: [
      { label: "Aadhar No.", path: "personalDetails.aadharNo" },
      { label: "Mole or Similar", path: "personalDetails.moleOrSimilar" },
      { label: "Account No.", path: "personalDetails.accountNo" },
      { label: "Bank Name", path: "personalDetails.bankName" },
      { label: "Bank Branch", path: "personalDetails.bankBranch" },
      { label: "IFSC Code", path: "personalDetails.ifscCode" }
    ]
  }
];

const communicationGroups = [
  {
    title: "Contact Details",
    fields: [
      { label: "Landline", path: "communicationDetails.landline" },
      { label: "Parent Mobile", path: "communicationDetails.parentMobile" },
      { label: "Student Mobile WhatsApp", path: "communicationDetails.studentMobileWhatsapp" },
      { label: "Student Email", path: "communicationDetails.studentEmail" },
      { label: "Parent Email", path: "communicationDetails.parentEmail" }
    ]
  },
  {
    title: "Correspondence Address",
    fields: [
      { label: "Guardian", path: "communicationDetails.correspondenceGuardian" },
      { label: "Door No.", path: "communicationDetails.correspondenceDoorNo" },
      { label: "Street", path: "communicationDetails.correspondenceStreet" },
      { label: "Village/City", path: "communicationDetails.correspondenceVillageCity" },
      { label: "State", path: "communicationDetails.correspondenceState" },
      { label: "District", path: "communicationDetails.correspondenceDistrict" },
      { label: "Pin Code", path: "communicationDetails.correspondencePinCode" }
    ]
  },
  {
    title: "Permanent Address",
    fields: [
      { label: "Guardian", path: "communicationDetails.permanentGuardian" },
      { label: "Door No.", path: "communicationDetails.permanentDoorNo" },
      { label: "Street", path: "communicationDetails.permanentStreet" },
      { label: "Village/City", path: "communicationDetails.permanentVillageCity" },
      { label: "State", path: "communicationDetails.permanentState" },
      { label: "District", path: "communicationDetails.permanentDistrict" },
      { label: "Pin Code", path: "communicationDetails.permanentPinCode" }
    ]
  }
];

const completionPaths = [
  "identifier",
  "applicationNo",
  "name",
  "rank",
  "admissionStatus",
  "joiningYear",
  "programme",
  "programmeType",
  "branch",
  "personalDetails.dob",
  "personalDetails.gender",
  "personalDetails.fatherName",
  "personalDetails.motherName",
  "personalDetails.bloodGroup",
  "personalDetails.aadharNo",
  "communicationDetails.parentMobile",
  "communicationDetails.studentMobileWhatsapp",
  "communicationDetails.studentEmail",
  "communicationDetails.correspondenceCombined",
  "communicationDetails.permanentCombined"
];

const sectionStatus = (fields, form) => fields.every((field) => Boolean(getNestedValue(form, field.path))) ? "Complete" : "Incomplete";

const profileCompletion = (form) => {
  const filled = completionPaths.filter((path) => Boolean(getNestedValue(form, path))).length;
  return Math.round((filled / completionPaths.length) * 100);
};

const documentSummary = (form) => {
  const docs = [
    ...(form.qualificationDetails || []).map((item) => item.verificationStatus || "Not Uploaded"),
    ...(form.certificates || []).map((item) => item.verificationStatus || "Not Uploaded")
  ];
  return {
    total: docs.length,
    verified: docs.filter((status) => status === "Verified").length,
    pending: docs.filter((status) => status === "Pending").length,
    rejected: docs.filter((status) => status === "Rejected").length
  };
};

export const StudentProfile = () => {
  const { loading, data, reload } = useStudentData();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState({});
  const [qrOpen, setQrOpen] = useState(false);
  useEffect(() => {
    if (data?.profile) setForm(data.profile);
  }, [data]);
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;

  const saveSection = async (section) => {
    await api.put("/student/profile", form);
    toast.success(`${section} updated`);
    setEditing((current) => ({ ...current, [section]: false }));
    await reload();
  };

  const cancelSection = (section) => {
    setForm(data.profile);
    setEditing((current) => ({ ...current, [section]: false }));
  };

  const startEdit = (section) => {
    setEditing((current) => ({ ...current, [section]: true }));
  };

  const updateArrayItem = (path, index, updates) => {
    const items = [...(form[path] || [])];
    items[index] = { ...items[index], ...updates };
    setForm({ ...form, [path]: items });
  };

  const addQualification = () => {
    setForm({
      ...form,
      qualificationDetails: [
        ...(form.qualificationDetails || []),
        {
          qualification: "",
          institution: "",
          boardUniversity: "",
          passingYear: "",
          maxMarks: "",
          marksSecured: "",
          gradePercentage: "",
          marksheetCertificate: "",
          marksheetCertificateData: "",
          verificationStatus: "Not Uploaded",
          verificationRemark: ""
        }
      ]
    });
  };

  const addCertificate = () => {
    setForm({
      ...form,
      certificates: [...(form.certificates || []), { certificate: "", file: "", fileData: "", verificationStatus: "Not Uploaded", verificationRemark: "" }]
    });
  };

  const removeArrayItem = (path, index) => {
    setForm({ ...form, [path]: (form[path] || []).filter((_, itemIndex) => itemIndex !== index) });
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    const avatar = await fileToDataUrl(file);
    const updated = { ...form, avatar };
    setForm(updated);
    await api.put("/student/profile", updated);
    toast.success("Profile photo uploaded");
    await reload();
  };

  const uploadQualificationFile = async (file, index) => {
    if (!file) return;
    const marksheetCertificateData = await fileToDataUrl(file);
    updateArrayItem("qualificationDetails", index, { marksheetCertificate: file.name, marksheetCertificateData, verificationStatus: "Pending", verificationRemark: "" });
    toast.success("Qualification file selected");
  };

  const uploadCertificateFile = async (file, index) => {
    if (!file) return;
    const fileData = await fileToDataUrl(file);
    updateArrayItem("certificates", index, { file: file.name, fileData, verificationStatus: "Pending", verificationRemark: "" });
    toast.success("Certificate file selected");
  };

  const completion = profileCompletion(form);
  const docs = documentSummary(form);
  const studentQrPayload = encodeURIComponent(
    [
      `Student Registration and Enrolment System`,
      `Name: ${form.name || ""}`,
      `Registration No: ${form.identifier || ""}`,
      `Application No: ${form.applicationNo || ""}`,
      `Programme: ${form.programme || ""}`,
      `Branch: ${form.branch || form.department || ""}`,
      `Semester: ${form.semester || ""}`,
      `Admission Status: ${form.admissionStatus || ""}`
    ].join("\n")
  );
  const studentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&margin=10&data=${studentQrPayload}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-mint">Profile Readiness</p>
              <h2 className="mt-1 text-2xl font-bold dark:text-white">{completion}% Complete</h2>
              <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Complete missing details and upload documents for verification.</p>
            </div>
            <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white dark:bg-mint dark:text-ink">
              <Printer size={18} /> Print Profile
            </button>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
            <div className="h-full rounded-full bg-mint" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-paper p-3 dark:bg-white/10">
              <p className="text-xs text-ink/55 dark:text-white/55">Documents</p>
              <p className="text-xl font-bold dark:text-white">{docs.total}</p>
            </div>
            <div className="rounded-lg bg-paper p-3 dark:bg-white/10">
              <p className="text-xs text-ink/55 dark:text-white/55">Verified</p>
              <p className="text-xl font-bold text-mint">{docs.verified}</p>
            </div>
            <div className="rounded-lg bg-paper p-3 dark:bg-white/10">
              <p className="text-xs text-ink/55 dark:text-white/55">Pending</p>
              <p className="text-xl font-bold text-saffron">{docs.pending}</p>
            </div>
            <div className="rounded-lg bg-paper p-3 dark:bg-white/10">
              <p className="text-xs text-ink/55 dark:text-white/55">Rejected</p>
              <p className="text-xl font-bold text-coral">{docs.rejected}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">Digital Student ID</p>
              <h3 className="mt-1 text-xl font-bold">{form.name}</h3>
              <p className="text-white/70">{form.identifier}</p>
            </div>
            <ShieldCheck className="text-mint" />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <img src={form.avatar || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=256&q=80"} alt="Student ID" className="h-20 w-20 rounded-lg object-cover" />
            <div className="text-sm text-white/75">
              <p>{form.programme || "Programme"}</p>
              <p>{form.branch || form.department}</p>
              <p>Blood Group: {form.personalDetails?.bloodGroup || "-"}</p>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 rounded-lg bg-white/8 p-3">
            <div className="space-y-2 text-xs text-white/70">
              <p><span className="text-white/45">App No:</span> {form.applicationNo || "-"}</p>
              <p><span className="text-white/45">Batch:</span> {form.allotmentDetails?.batch || "-"}</p>
              <p><span className="text-white/45">Status:</span> {form.admissionStatus || "-"}</p>
            </div>
            <button type="button" onClick={() => setQrOpen(true)} className="focus-ring rounded-lg bg-white p-2 transition hover:scale-105">
              <img src={studentQrUrl} alt="Student QR code" className="h-24 w-24" />
            </button>
          </div>
        </div>
      </section>

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm" onClick={() => setQrOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-soft dark:bg-ink" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3 text-left">
              <div>
                <p className="text-sm font-semibold text-mint">Digital Student QR</p>
                <h3 className="text-xl font-bold text-ink dark:text-white">{form.name}</h3>
                <p className="text-sm text-ink/60 dark:text-white/60">{form.identifier}</p>
              </div>
              <button type="button" onClick={() => setQrOpen(false)} className="focus-ring rounded-lg border border-ink/20 p-2 dark:border-white/10 dark:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mx-auto flex h-72 w-72 animate-[qrZoom_1.8s_ease-in-out_infinite] items-center justify-center rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
              <img src={studentQrUrl} alt="Expanded student QR code" className="h-60 w-60" />
            </div>
            <p className="mt-4 text-sm text-ink/60 dark:text-white/60">Scan to view student identity details.</p>
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 text-center shadow-soft dark:border-white/10 dark:bg-ink">
          <img src={form.avatar || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=256&q=80"} alt="Profile" className="mx-auto h-32 w-32 rounded-full object-cover" />
          <h2 className="mt-4 text-xl font-bold dark:text-white">{form.name}</h2>
          <p className="text-sm text-ink/60 dark:text-white/60">{form.identifier}</p>
          <label className="focus-ring mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
            <Upload size={16} /> Upload Photo
            <input className="hidden" type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} />
          </label>
          <div className="mt-5 rounded-lg bg-paper p-4 text-left text-sm dark:bg-white/10">
            <p className="font-semibold dark:text-white">{form.programme || "Programme"}</p>
            <p className="mt-1 text-ink/60 dark:text-white/60">{form.branch || form.department}</p>
            <p className="mt-1 text-ink/60 dark:text-white/60">Semester {form.semester || "-"}</p>
          </div>
        </div>
        <ProfileSection
          title="Student Profile"
          subtitle="Registration and academic identity"
          status={sectionStatus(basicFields, form)}
          editing={editing.profile}
          onEdit={() => startEdit("profile")}
          onSave={() => saveSection("profile")}
          onCancel={() => cancelSection("profile")}
        >
          <FieldGrid fields={basicFields} form={form} setForm={setForm} editable={editing.profile} />
        </ProfileSection>
      </section>

      <ProfileSection
        title="Allotment Details"
        subtitle="Admission, seat, category, and hostel information"
        status={sectionStatus(allotmentFields, form)}
        editing={editing.allotment}
        onEdit={() => startEdit("allotment")}
        onSave={() => saveSection("allotment")}
        onCancel={() => cancelSection("allotment")}
      >
        <div className="space-y-4">
          {allotmentGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.allotment} />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Personal Details"
        subtitle="Student, parent, identity, and bank information"
        status={sectionStatus(personalFields, form)}
        editing={editing.personal}
        onEdit={() => startEdit("personal")}
        onSave={() => saveSection("personal")}
        onCancel={() => cancelSection("personal")}
      >
        <div className="space-y-4">
          {personalGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.personal} />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Communication Details"
        subtitle="Contact, correspondence address, and permanent address"
        status={sectionStatus(communicationFields, form)}
        editing={editing.communication}
        onEdit={() => startEdit("communication")}
        onSave={() => saveSection("communication")}
        onCancel={() => cancelSection("communication")}
      >
        <div className="space-y-4">
          {communicationGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.communication} />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Qualification Details"
        subtitle="Previous academic records"
        status={(form.qualificationDetails || []).length ? "Complete" : "Incomplete"}
        editing={editing.qualification}
        onEdit={() => startEdit("qualification")}
        onSave={() => saveSection("qualification")}
        onCancel={() => cancelSection("qualification")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ink text-xs uppercase tracking-wide text-white/70">
              <tr>
                {["Action", "Qualification", "Institution", "Board/University", "Passing Year", "Max Marks", "Marks Secured", "Grade/Percentage", "Marksheet & Certificate", "Status", "Remove"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 dark:divide-white/10">
              {(form.qualificationDetails || []).map((item, index) => (
                <tr key={`${item.qualification}-${index}`} className="dark:text-white">
                  <td className="px-4 py-3">
                    {item.marksheetCertificateData ? (
                      <a href={item.marksheetCertificateData} target="_blank" rel="noreferrer" className="font-semibold text-mint">View</a>
                    ) : (
                      <span className="text-ink/45 dark:text-white/45">View</span>
                    )}
                  </td>
                  {["qualification", "institution", "boardUniversity", "passingYear", "maxMarks", "marksSecured", "gradePercentage"].map((key) => (
                    <td key={key} className="px-4 py-3">
                      {editing.qualification ? (
                        <input
                          className="focus-ring w-full min-w-28 rounded-lg border border-ink/20 bg-paper px-2 py-2 dark:border-white/10 dark:bg-white/10"
                          value={item[key] || ""}
                          onChange={(event) => updateArrayItem("qualificationDetails", index, { [key]: event.target.value })}
                        />
                      ) : (
                        item[key]
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <span>{item.marksheetCertificate}</span>
                      {editing.qualification && (
                        <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10">
                          <Upload size={14} /> Upload
                          <input className="hidden" type="file" onChange={(event) => uploadQualificationFile(event.target.files?.[0], index)} />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <StatusBadge status={item.verificationStatus || "Not Uploaded"} />
                      {item.verificationRemark && <p className="text-xs text-ink/55 dark:text-white/55">{item.verificationRemark}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editing.qualification ? (
                      <button type="button" onClick={() => removeArrayItem("qualificationDetails", index)} className="rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white">
                        Remove
                      </button>
                    ) : (
                      <span className="text-ink/35 dark:text-white/35">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing.qualification && (
          <button type="button" onClick={addQualification} className="focus-ring mt-4 rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
            Add Qualification
          </button>
        )}
      </ProfileSection>

      <ProfileSection
        title="Other Certificates"
        subtitle="Uploaded supporting documents"
        status={(form.certificates || []).length ? "Complete" : "Incomplete"}
        editing={editing.certificates}
        onEdit={() => startEdit("certificates")}
        onSave={() => saveSection("certificates")}
        onCancel={() => cancelSection("certificates")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-ink text-xs uppercase tracking-wide text-white/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Certificate</th>
                <th className="px-4 py-3 font-semibold">Certificate File</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 dark:divide-white/10">
              {(form.certificates || []).map((item, index) => (
                <tr key={`${item.certificate}-${index}`} className="dark:text-white">
                  <td className="px-4 py-3">
                    {item.fileData ? (
                      <a href={item.fileData} target="_blank" rel="noreferrer" className="font-semibold text-mint">View</a>
                    ) : (
                      <span className="text-ink/45 dark:text-white/45">View</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing.certificates ? (
                      <input
                        className="focus-ring w-full rounded-lg border border-ink/20 bg-paper px-2 py-2 dark:border-white/10 dark:bg-white/10"
                        value={item.certificate || ""}
                        onChange={(event) => updateArrayItem("certificates", index, { certificate: event.target.value })}
                      />
                    ) : (
                      item.certificate
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <span>{item.file}</span>
                      {editing.certificates && (
                        <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10">
                          <Upload size={14} /> Upload
                          <input className="hidden" type="file" onChange={(event) => uploadCertificateFile(event.target.files?.[0], index)} />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <StatusBadge status={item.verificationStatus || "Not Uploaded"} />
                      {item.verificationRemark && <p className="text-xs text-ink/55 dark:text-white/55">{item.verificationRemark}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editing.certificates ? (
                      <button type="button" onClick={() => removeArrayItem("certificates", index)} className="rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white">
                        Remove
                      </button>
                    ) : (
                      <span className="text-ink/35 dark:text-white/35">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing.certificates && (
          <button type="button" onClick={addCertificate} className="focus-ring mt-4 rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
            Add Certificate
          </button>
        )}
      </ProfileSection>

    </div>
  );
};

export const Transactions = ({ misc = false }) => {
  const { loading, data } = useStudentData();
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const rows = data.payments.filter((item) => (misc ? item.type !== "semester" : item.type === "semester"));
  return (
    <DataTable
      rows={rows}
      searchPlaceholder="Search payments"
      columns={[
        { key: "reference", label: "Reference" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount", render: (row) => `INR ${row.amount.toLocaleString("en-IN")}` },
        { key: "status", label: "Status", render: (row) => <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${row.status === "paid" ? "bg-mint/20 text-mint" : "bg-coral/20 text-coral"}`}>{row.status}</span> },
        { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleDateString() }
      ]}
    />
  );
};

export const MiscFees = () => {
  const fees = [
    { name: "Hostel maintenance", amount: 18000, status: "Pending" },
    { name: "Library fine", amount: 750, status: "Paid" },
    { name: "Exam form", amount: 1500, status: "Available" }
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fees.map((fee) => (
        <div key={fee.name} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <Receipt className="text-coral" />
          <h3 className="mt-4 font-bold dark:text-white">{fee.name}</h3>
          <p className="mt-2 text-2xl font-bold dark:text-white">INR {fee.amount.toLocaleString("en-IN")}</p>
          <button className="focus-ring mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink">{fee.status === "Paid" ? "Receipt" : "Pay Now"}</button>
        </div>
      ))}
    </div>
  );
};

export const SemesterRegistration = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data } = await api.get("/student/courses");
    setCourses(data);
    setLoading(false);
  };
  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);
  if (loading) return <Loader />;

  const enroll = async (courseId) => {
    try {
      await api.post("/student/enroll", { courseId });
      toast.success("Enrollment request submitted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to enroll");
    }
  };

  return (
    <DataTable
      rows={courses}
      searchPlaceholder="Search courses"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Course Name" },
        { key: "credits", label: "Credits" },
        { key: "capacity", label: "Capacity" },
        { key: "availableSeats", label: "Available" },
        { key: "prerequisites", label: "Prerequisites", render: (row) => row.prerequisites?.map((item) => item.code).join(", ") || "None" },
        { key: "action", label: "Action", render: (row) => <button disabled={row.enrolled || row.availableSeats === 0} onClick={() => enroll(row._id)} className="focus-ring rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 dark:bg-mint dark:text-ink">{row.enrolled ? "Requested" : "Enroll"}</button> }
      ]}
    />
  );
};

export const Attendance = () => {
  const { loading, data } = useStudentData();
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const chartData = data.attendance.map((item) => ({ course: item.course.code, percentage: item.percentage }));
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Subject-wise Attendance</h2>
            <p className="text-sm text-ink/60 dark:text-white/60">Serial view of all subjects with class count and percentage.</p>
          </div>
          <span className="text-sm font-semibold text-mint">{data.attendance.length} subjects</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-ink/60 dark:bg-white/5 dark:text-white/60">
              <tr>
                <th className="rounded-l-lg px-4 py-3 font-semibold">Sl. No.</th>
                <th className="px-4 py-3 font-semibold">Subject Code</th>
                <th className="px-4 py-3 font-semibold">Subject Name</th>
                <th className="px-4 py-3 font-semibold">Total Classes</th>
                <th className="px-4 py-3 font-semibold">Classes Attended</th>
                <th className="rounded-r-lg px-4 py-3 font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 dark:divide-white/10">
              {data.attendance.map((item, index) => (
                <tr key={item._id} className="text-ink dark:text-white">
                  <td className="px-4 py-4 font-semibold">{index + 1}</td>
                  <td className="px-4 py-4">{item.course.code}</td>
                  <td className="px-4 py-4">{item.course.name}</td>
                  <td className="px-4 py-4">{item.totalClasses}</td>
                  <td className="px-4 py-4">{item.attendedClasses}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full ${item.percentage >= 75 ? "bg-mint" : "bg-coral"}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`font-bold ${item.percentage >= 75 ? "text-mint" : "text-coral"}`}>{item.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data.attendance.length && (
          <div className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60 dark:border-white/20 dark:text-white/60">
            No attendance records available yet.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h3 className="mb-4 text-lg font-bold dark:text-white">Attendance Percentage Chart</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" fill="#2fbf9f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const Notifications = () => {
  const { loading, data } = useStudentData();
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  return (
    <div className="space-y-3">
      {data.notifications.map((note) => (
        <div key={note._id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-ink">
          <div className="flex gap-3">
            <Bell className="mt-1 text-saffron" />
            <div>
              <h3 className="font-bold dark:text-white">{note.title}</h3>
              <p className="text-sm text-ink/65 dark:text-white/65">{note.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SettingsPage = () => {
  const fields = useMemo(() => ["Current password", "New password", "Confirm password"], []);
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Settings</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {fields.map((field) => (
          <input key={field} type="password" placeholder={field} className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white" />
        ))}
      </div>
      <button onClick={() => toast.success("Password change request saved")} className="focus-ring mt-5 rounded-lg bg-mint px-4 py-2 font-semibold text-ink">Change Password</button>
    </div>
  );
};
