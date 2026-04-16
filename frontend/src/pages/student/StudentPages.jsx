import { Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, CreditCard, FileText, Hourglass, Pencil, Printer, Receipt, Save, Settings2, ShieldCheck, Upload, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import {
  allotmentFields,
  allotmentGroups,
  basicFields,
  communicationFields,
  communicationGroups,
  documentSummary,
  getMissingRequiredFields,
  getNestedValue,
  personalFields,
  personalGroups,
  profileCompletion,
  sectionStatus,
  setNestedValue
} from "./profileConfig";
import { escapeHtml, openPrintableDocument } from "../../utils/printDocument";

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

const uploadFormFile = async (url, file) => {
  const payload = new FormData();
  payload.append("file", file);
  const { data } = await api.post(url, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
};

const printProfileDocument = (profile) => {
  const rows = [
    ["Registration No.", profile.identifier],
    ["Application No.", profile.applicationNo],
    ["Name", profile.name],
    ["Programme", profile.programme],
    ["Programme Type", profile.programmeType],
    ["Branch", profile.branch],
    ["Semester", profile.semester],
    ["Email", profile.email],
    ["Phone", profile.phone],
    ["Admission Status", profile.admissionStatus]
  ];

  const profileWindow = openPrintableDocument({
    title: "Student Profile Summary",
    subtitle: "Use your browser print dialog to save this profile as a PDF.",
    content: `
      <div class="grid">
        ${rows
          .map(
            ([label, value]) => `
              <div class="card">
                <div class="label">${escapeHtml(label)}</div>
                <div class="value">${escapeHtml(value || "-")}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `
  });
  if (!profileWindow) {
    toast.error("Allow pop-ups in your browser to print the profile.");
  }
  return profileWindow;
};

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

const FieldGrid = ({ fields, form, setForm, editable, columns = "md:grid-cols-2 xl:grid-cols-3", errors = {}, onFieldChange }) => (
  <div className={`grid gap-4 ${columns}`}>
    {fields.map((field) => (
      <label key={field.path} className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/55">
        <span className="inline-flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-coral">*</span>}
        </span>
        <input
          disabled={!editable}
          className={`focus-ring mt-2 w-full rounded-lg border bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/65 dark:bg-white/10 dark:text-white dark:disabled:bg-white/5 dark:disabled:text-white/65 ${errors[field.path] ? "border-coral" : "border-ink/20 dark:border-white/10"}`}
          value={getNestedValue(form, field.path)}
          onChange={(event) => (onFieldChange ? onFieldChange(field.path, event.target.value) : setForm(setNestedValue(form, field.path, event.target.value)))}
        />
        {errors[field.path] && <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-coral">{errors[field.path]}</span>}
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

const ProfileSection = ({ title, subtitle, status, children, editing, onEdit, onSave, onCancel, requiredHint = false }) => (
  <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-bold text-ink/80 dark:text-white">{title}</h3>
          {status && <StatusBadge status={status} />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink/55 dark:text-white/55">{subtitle}</p>}
        {requiredHint && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-coral">Fields marked * are mandatory.</p>}
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

const FieldGroup = ({ title, fields, form, setForm, editable, columns, errors, onFieldChange }) => (
  <div className="rounded-lg border border-ink/10 bg-paper/70 p-4 dark:border-white/10 dark:bg-white/5">
    <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink/70 dark:text-white/70">{title}</h4>
    <FieldGrid fields={fields} form={form} setForm={setForm} editable={editable} columns={columns} errors={errors} onFieldChange={onFieldChange} />
  </div>
);

export const StudentProfile = () => {
  const { loading, data, reload } = useStudentData();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState({});
  const [qrOpen, setQrOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  useEffect(() => {
    if (data?.profile) setForm(data.profile);
  }, [data]);
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;

  const sectionFields = {
    profile: basicFields,
    allotment: allotmentFields,
    personal: personalFields,
    communication: communicationFields
  };

  const clearFieldErrors = (paths) =>
    setValidationErrors((current) => {
      const next = { ...current };
      paths.forEach((path) => delete next[path]);
      return next;
    });

  const updateFieldValue = (path, value) => {
    setForm((current) => setNestedValue(current, path, value));
    clearFieldErrors([path]);
  };

  const saveSection = async (section) => {
    const fields = sectionFields[section] || [];
    const missingFields = getMissingRequiredFields(fields, form);
    if (missingFields.length) {
      setValidationErrors((current) => ({
        ...current,
        ...Object.fromEntries(missingFields.map((field) => [field.path, `${field.label} is required.`]))
      }));
      const fieldPreview = missingFields.slice(0, 3).map((field) => field.label).join(", ");
      toast.error(
        missingFields.length > 3
          ? `Complete the required fields first: ${fieldPreview}, and more.`
          : `Complete the required fields first: ${fieldPreview}.`
      );
      return;
    }

    try {
      const { data: updated } = await api.put("/student/profile", { ...form, profileSection: section });
      setForm(updated);
      toast.success(`${section} updated`);
      setEditing((current) => ({ ...current, [section]: false }));
      clearFieldErrors(fields.map((field) => field.path));
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile section");
    }
  };

  const cancelSection = (section) => {
    setForm(data.profile);
    setEditing((current) => ({ ...current, [section]: false }));
    clearFieldErrors((sectionFields[section] || []).map((field) => field.path));
  };

  const startEdit = (section) => {
    setEditing((current) => ({ ...current, [section]: true }));
    clearFieldErrors((sectionFields[section] || []).map((field) => field.path));
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
    try {
      const uploaded = await uploadFormFile("/student/uploads/avatar", file);
      setForm((current) => ({ ...current, avatar: uploaded.avatar }));
      toast.success("Profile photo uploaded");
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload profile photo");
    }
  };

  const uploadQualificationFile = async (file, index) => {
    if (!file) return;
    try {
      const uploaded = await uploadFormFile(`/student/uploads/qualification/${index}`, file);
      updateArrayItem("qualificationDetails", index, {
        marksheetCertificate: uploaded.file,
        marksheetCertificateData: uploaded.fileData,
        verificationStatus: uploaded.verificationStatus,
        verificationRemark: uploaded.verificationRemark
      });
      toast.success("Qualification document uploaded");
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload qualification document");
    }
  };

  const uploadCertificateFile = async (file, index) => {
    if (!file) return;
    try {
      const uploaded = await uploadFormFile(`/student/uploads/certificate/${index}`, file);
      updateArrayItem("certificates", index, {
        file: uploaded.file,
        fileData: uploaded.fileData,
        verificationStatus: uploaded.verificationStatus,
        verificationRemark: uploaded.verificationRemark
      });
      toast.success("Certificate uploaded");
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload certificate");
    }
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
            <button type="button" onClick={() => printProfileDocument(form)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white dark:bg-mint dark:text-ink">
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
          requiredHint
          onEdit={() => startEdit("profile")}
          onSave={() => saveSection("profile")}
          onCancel={() => cancelSection("profile")}
        >
          <FieldGrid fields={basicFields} form={form} setForm={setForm} editable={editing.profile} errors={validationErrors} onFieldChange={updateFieldValue} />
        </ProfileSection>
      </section>

      <ProfileSection
        title="Allotment Details"
        subtitle="Admission, seat, category, and hostel information"
        status={sectionStatus(allotmentFields, form)}
        editing={editing.allotment}
        requiredHint
        onEdit={() => startEdit("allotment")}
        onSave={() => saveSection("allotment")}
        onCancel={() => cancelSection("allotment")}
      >
        <div className="space-y-4">
          {allotmentGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.allotment} errors={validationErrors} onFieldChange={updateFieldValue} />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Personal Details"
        subtitle="Student, parent, identity, and bank information"
        status={sectionStatus(personalFields, form)}
        editing={editing.personal}
        requiredHint
        onEdit={() => startEdit("personal")}
        onSave={() => saveSection("personal")}
        onCancel={() => cancelSection("personal")}
      >
        <div className="space-y-4">
          {personalGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.personal} errors={validationErrors} onFieldChange={updateFieldValue} />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Communication Details"
        subtitle="Contact, correspondence address, and permanent address"
        status={sectionStatus(communicationFields, form)}
        editing={editing.communication}
        requiredHint
        onEdit={() => startEdit("communication")}
        onSave={() => saveSection("communication")}
        onCancel={() => cancelSection("communication")}
      >
        <div className="space-y-4">
          {communicationGroups.map((group) => (
            <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} editable={editing.communication} errors={validationErrors} onFieldChange={updateFieldValue} />
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

const paymentChip = (status) => {
  const styles = {
    paid: "bg-mint/20 text-mint",
    pending: "bg-saffron/25 text-ink",
    failed: "bg-coral/20 text-coral"
  };
  return <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}>{status}</span>;
};

const printReceipt = (payment, profile) => {
  const paidDate = payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending";
  const receiptWindow = openPrintableDocument({
    title: "Payment Receipt",
    subtitle: "Use your browser print dialog to save this receipt as a PDF.",
    content: `
      <div class="grid">
        <div class="card"><div class="label">Student</div><div class="value">${escapeHtml(profile.name)}</div></div>
        <div class="card"><div class="label">Registration No.</div><div class="value">${escapeHtml(profile.identifier)}</div></div>
        <div class="card"><div class="label">Fee</div><div class="value">${escapeHtml(payment.label || payment.type)}</div></div>
        <div class="card"><div class="label">Receipt Ref</div><div class="value">${escapeHtml(payment.reference)}</div></div>
        <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(payment.status)}</div></div>
        <div class="card"><div class="label">Payment Mode</div><div class="value">${escapeHtml(payment.paymentMode || "Online")}</div></div>
        <div class="card"><div class="label">Paid On</div><div class="value">${escapeHtml(paidDate)}</div></div>
        <div class="card"><div class="label">Amount</div><div class="value">INR ${escapeHtml(payment.amount.toLocaleString("en-IN"))}</div></div>
      </div>
    `
  });
  if (!receiptWindow) {
    toast.error("Allow pop-ups in your browser to print the receipt.");
  }
};

const PaymentHistoryTable = ({ rows, profile, onPay, focusId }) => {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="rounded-lg border border-ink/10 bg-white shadow-soft dark:border-white/10 dark:bg-ink">
      <div className="flex flex-col gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search payments"
          className="focus-ring w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white sm:max-w-xs"
        />
        <span className="text-sm text-ink/55 dark:text-white/55">{filtered.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-ink/60 dark:bg-white/5 dark:text-white/60">
            <tr>
              {["Reference", "Fee", "Amount", "Status", "Date", "Action"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-white/10">
            {filtered.map((row) => (
              <tr key={row._id} className={`${focusId === row._id ? "bg-mint/10" : ""} dark:text-white`}>
                <td className="px-4 py-3">{row.reference}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold">{row.label || row.type}</p>
                    <p className="text-xs text-ink/55 dark:text-white/55">{row.type}</p>
                  </div>
                </td>
                <td className="px-4 py-3">INR {row.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{paymentChip(row.status)}</td>
                <td className="px-4 py-3">{row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-3">
                  {row.status === "paid" ? (
                    <button type="button" onClick={() => printReceipt(row, profile)} className="rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold text-ink dark:border-white/10 dark:text-white">
                      Print Receipt
                    </button>
                  ) : (
                    <button type="button" onClick={() => onPay(row._id)} className="rounded-lg bg-mint px-3 py-2 text-xs font-semibold text-ink">
                      Make Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Transactions = ({ misc = false }) => {
  const { loading, data, reload } = useStudentData();
  const location = useLocation();
  const focusId = new URLSearchParams(location.search).get("focus");
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const rows = data.payments.filter((item) => (misc ? item.type !== "semester" : item.type === "semester"));

  const payNow = async (paymentId) => {
    await api.put(`/student/payments/${paymentId}/pay`, { paymentMode: "Online Gateway" });
    toast.success("Payment completed successfully");
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <h2 className="text-xl font-bold dark:text-white">{misc ? "Miscellaneous Transaction History" : "Transaction History"}</h2>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
          {misc ? "Manage library, hostel, and registration fee payments." : "Track semester fee records and complete pending academic payments."}
        </p>
      </div>
      <PaymentHistoryTable rows={rows} profile={data.profile} onPay={payNow} focusId={focusId} />
    </div>
  );
};

export const MiscFees = () => {
  const { loading, data } = useStudentData();
  const navigate = useNavigate();
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const fees = data.payments.filter((item) => item.type !== "semester");
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fees.map((fee) => (
        <div key={fee._id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <Receipt className="text-coral" />
          <h3 className="mt-4 font-bold dark:text-white">{fee.label || fee.type}</h3>
          <p className="mt-2 text-2xl font-bold dark:text-white">INR {fee.amount.toLocaleString("en-IN")}</p>
          <p className="mt-2">{paymentChip(fee.status)}</p>
          <button
            type="button"
            onClick={() => (fee.status === "paid" ? printReceipt(fee, data.profile) : navigate(`/student/misc-transactions?focus=${fee._id}`))}
            className="focus-ring mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink"
          >
            {fee.status === "paid" ? "Receipt" : "Go to Payment"}
          </button>
        </div>
      ))}
    </div>
  );
};

export const SemesterRegistration = () => {
  const { loading: profileLoading, data: profileData, reload } = useStudentData();
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

  if (loading || profileLoading) return <Loader />;
  if (!profileData) return <EmptyState />;

  const enroll = async (courseId) => {
    try {
      await api.post("/student/enroll", { courseId });
      toast.success("Enrollment request submitted");
      await load();
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to enroll");
    }
  };

  const withdraw = async (enrollmentId) => {
    try {
      await api.delete(`/student/enrollments/${enrollmentId}`);
      toast.success("Enrollment request withdrawn");
      await load();
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to withdraw request");
    }
  };

  const approvedCourses = profileData.enrollments.filter((item) => item.status === "approved");
  const pendingCourses = profileData.enrollments.filter((item) => item.status === "pending");
  const activeEnrollmentIds = new Set(
    profileData.enrollments
      .filter((item) => ["pending", "approved"].includes(item.status))
      .map((item) => String(item.course?._id || item.course))
  );
  const availableCourses = courses.filter((course) => !activeEnrollmentIds.has(String(course._id)));
  const registrationPayment = profileData.payments.find((item) => item.type === "registration");
  const semStatus = pendingCourses.length ? "Under Advisor Review" : approvedCourses.length ? "Registered" : "Not Started";
  const approvedCredits = approvedCourses.reduce((sum, item) => sum + (item.course?.credits || 0), 0);
  const groupedApproved = approvedCourses.reduce((grouped, item) => {
    const category = item.course?.category || "Registered Courses";
    grouped[category] = [...(grouped[category] || []), item.course];
    return grouped;
  }, {});
  const uniqueCourses = (courseList) =>
    Object.values(
      courseList.reduce((accumulator, course) => {
        if (course?._id) accumulator[course._id] = course;
        return accumulator;
      }, {})
    );
  const registeredCoursePool = uniqueCourses(approvedCourses.map((item) => item.course).filter(Boolean));
  const theoryCourses = registeredCoursePool.filter((course) => course.courseKind === "theory" || !/lab/i.test(course.name));
  const labCourses = registeredCoursePool.filter((course) => course.courseKind === "lab" || /lab/i.test(course.name));
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const theorySlots = ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM"];
  const labDays = ["Tuesday", "Thursday", "Friday"];
  const timetableGrid = weekdays.map((day, dayIndex) => ({
    day,
    sessions: theorySlots.map((time, slotIndex) => ({
      time,
      course: theoryCourses.length ? theoryCourses[(dayIndex * theorySlots.length + slotIndex) % theoryCourses.length] : null
    }))
  }));
  const labSessions = labDays.map((day, index) => ({
    day,
    time: "02:00 PM - 05:00 PM",
    course: labCourses.length ? labCourses[index % labCourses.length] : null
  }));
  const infoRows = [
    ["Registration No.", profileData.profile.identifier],
    ["Student Name", profileData.profile.name],
    ["Semester", profileData.profile.semester],
    ["Programme", profileData.profile.programme],
    ["Branch", profileData.profile.branch],
    ["Fee Programme Type", profileData.profile.programmeType],
    ["Fee Stud Type", profileData.profile.allotmentDetails?.feeType || "-"],
    ["Is Hostelier", profileData.profile.allotmentDetails?.hostelAllocated || "No"],
    ["Regn Fee Pay Status", registrationPayment?.status || "pending"],
    ["Sem Registration Status", semStatus]
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-wrap items-center gap-3">
          <BookOpen className="text-mint" />
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Semester Registration</h2>
            <p className="text-sm text-ink/60 dark:text-white/60">Check status, review approved subjects, and manage your current course basket.</p>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <div className="mb-4 flex items-center gap-3">
            <ClipboardCheck className="text-mint" />
            <h3 className="text-xl font-bold dark:text-white">Student Registration Snapshot</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {infoRows.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-paper px-4 py-3 dark:bg-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-white/55">{label}</p>
                <p className="mt-1 font-semibold capitalize dark:text-white">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <StatCard title="Approved Credits" value={approvedCredits} icon={WalletCards} />
          <StatCard title="Approved Subjects" value={approvedCourses.length} icon={CheckCircle2} tone="saffron" />
          <StatCard title="Pending Requests" value={pendingCourses.length} icon={Hourglass} tone="coral" />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="text-mint" />
          <h3 className="text-xl font-bold dark:text-white">Registered Subjects</h3>
        </div>
        {Object.keys(groupedApproved).length ? (
          <div className="space-y-4">
            {Object.entries(groupedApproved).map(([category, courseList]) => (
              <div key={category} className="rounded-lg border border-ink/10 dark:border-white/10">
                <div className="border-b border-ink/10 px-4 py-3 text-sm font-bold uppercase tracking-wide text-saffron dark:border-white/10">{category}</div>
                <div className="divide-y divide-ink/10 dark:divide-white/10">
                  {courseList.map((course) => (
                    <div key={course._id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink dark:text-white">{course.code}: {course.name}</p>
                        <p className="text-sm text-ink/60 dark:text-white/60">{course.courseKind === "lab" ? "Lab course" : "Theory course"}</p>
                      </div>
                      <span className="text-sm font-semibold text-mint">{course.credits} Credits</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60 dark:border-white/20 dark:text-white/60">
            No courses have been approved yet.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-3">
          <Hourglass className="text-saffron" />
          <h3 className="text-xl font-bold dark:text-white">Pending Request Queue</h3>
        </div>
        {pendingCourses.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingCourses.map((item) => (
              <div key={item._id} className="rounded-lg border border-ink/10 p-4 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{item.course?.category || "Course Request"}</p>
                <h4 className="mt-1 font-bold dark:text-white">{item.course?.code}: {item.course?.name}</h4>
                <div className="mt-4 flex items-center justify-between text-sm text-ink/60 dark:text-white/60">
                  <span>{item.course?.credits || 0} Credits</span>
                  <span>{item.course?.courseKind === "lab" ? "Lab" : "Theory"}</span>
                </div>
                <button type="button" onClick={() => withdraw(item._id)} className="focus-ring mt-4 rounded-lg border border-coral px-4 py-2 text-sm font-semibold text-coral">
                  Withdraw Request
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60 dark:border-white/20 dark:text-white/60">
            No pending requests. Any withdrawn subject will immediately return to the course basket.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-3">
          <CalendarDays className="text-mint" />
          <h3 className="text-xl font-bold dark:text-white">Weekly Timetable</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-ink/60 dark:bg-white/5 dark:text-white/60">
              <tr>
                <th className="rounded-l-lg px-4 py-3 font-semibold">Day</th>
                {theorySlots.map((slot) => (
                  <th key={slot} className="px-4 py-3 font-semibold">{slot}</th>
                ))}
                <th className="rounded-r-lg px-4 py-3 font-semibold">Lab Slot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 dark:divide-white/10">
              {timetableGrid.map((row) => {
                const lab = labSessions.find((item) => item.day === row.day);
                return (
                  <tr key={row.day} className="align-top dark:text-white">
                    <td className="px-4 py-4 font-semibold">{row.day}</td>
                    {row.sessions.map((session) => (
                      <td key={`${row.day}-${session.time}`} className="px-4 py-4">
                        {session.course ? (
                          <div>
                            <p className="font-semibold">{session.course.code}</p>
                            <p className="text-xs text-ink/55 dark:text-white/55">{session.course.name}</p>
                          </div>
                        ) : (
                          <span className="text-ink/50 dark:text-white/50">TBA</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      {lab?.course ? (
                        <div>
                          <p className="font-semibold">{lab.course.code}</p>
                          <p className="text-xs text-ink/55 dark:text-white/55">{lab.time}</p>
                          <p className="text-xs text-ink/55 dark:text-white/55">{lab.course.name}</p>
                        </div>
                      ) : (
                        <span className="text-ink/50 dark:text-white/50">No lab scheduled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="mb-4 flex items-center gap-3">
          <CalendarDays className="text-mint" />
          <h3 className="text-xl font-bold dark:text-white">Open Course Basket</h3>
        </div>
        {availableCourses.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {availableCourses.map((course) => (
              <div key={course._id} className="rounded-lg border border-ink/10 p-4 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{course.category}</p>
                  <h4 className="mt-1 font-bold dark:text-white">{course.code}: {course.name}</h4>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-ink/60 dark:text-white/60">
                  <span>{course.credits} Credits</span>
                  <span>Prereq: {course.prerequisites?.map((item) => item.code).join(", ") || "None"}</span>
                </div>
                <button type="button" onClick={() => enroll(course._id)} className="focus-ring mt-4 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink">
                  Enroll
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60 dark:border-white/20 dark:text-white/60">
            No additional courses are open for your current branch and semester.
          </div>
        )}
      </section>
    </div>
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
  const { loading, data, reload } = useStudentData();
  const [filter, setFilter] = useState("all");
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;
  const unreadCount = data.notifications.filter((note) => !note.isRead).length;
  const visible = data.notifications.filter((note) => {
    if (filter === "unread") return !note.isRead;
    if (filter === "read") return note.isRead;
    return true;
  });

  const markRead = async (id) => {
    try {
      await api.put(`/student/notifications/${id}/read`);
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update notification");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/student/notifications/read-all");
      toast.success("All notifications marked as read");
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update notifications");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Notifications Center</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{unreadCount} unread notices across approvals, fees, and administration updates.</p>
          </div>
          <button type="button" onClick={markAllRead} className="focus-ring rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:text-white">
            Mark All as Read
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["unread", "Unread"],
            ["read", "Read"]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`focus-ring rounded-lg px-3 py-2 text-sm font-semibold ${filter === key ? "bg-mint text-ink" : "border border-ink/20 text-ink dark:border-white/10 dark:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {visible.map((note) => (
        <div key={note._id} className={`rounded-lg border bg-white p-4 shadow-soft dark:bg-ink ${note.isRead ? "border-ink/10 dark:border-white/10" : "border-mint/40"}`}>
          <div className="flex gap-3">
            <Bell className={`mt-1 ${note.isRead ? "text-ink/40 dark:text-white/40" : "text-saffron"}`} />
            <div className="flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold dark:text-white">{note.title}</h3>
                  <p className="text-sm text-ink/65 dark:text-white/65">{note.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${note.isRead ? "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60" : "bg-mint/15 text-mint"}`}>
                    {note.isRead ? "Read" : "Unread"}
                  </span>
                  {!note.isRead && (
                    <button type="button" onClick={() => markRead(note._id)} className="focus-ring rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:text-white">
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs uppercase tracking-wide text-ink/45 dark:text-white/45">{new Date(note.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
      {!visible.length && (
        <div className="rounded-lg border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60 dark:border-white/20 dark:text-white/60">
          No notifications match this filter right now.
        </div>
      )}
    </div>
  );
};

export const SettingsPage = () => {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("sres_settings");
    return saved ? JSON.parse(saved) : {
      attendanceAlerts: true,
      feeReminders: true,
      approvalNotifications: true,
      emailCopies: false,
      compactReceipts: true,
      rememberDevices: true
    };
  });

  const togglePreference = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const savePreferences = () => {
    localStorage.setItem("sres_settings", JSON.stringify(preferences));
    toast.success("Preferences saved");
  };
  const changePassword = async () => {
    setSavingPassword(true);
    try {
      await api.put("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
        <div className="flex items-center gap-3">
          <Settings2 className="text-mint" />
          <div>
            <h2 className="text-xl font-bold dark:text-white">Settings</h2>
            <p className="text-sm text-ink/60 dark:text-white/60">Manage security, alerts, and student portal preferences.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Security</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["currentPassword", "Current password"],
              ["newPassword", "New password"],
              ["confirmPassword", "Confirm password"]
            ].map(([key, label]) => (
              <input
                key={key}
                type="password"
                placeholder={label}
                className="focus-ring rounded-lg border border-ink/20 bg-paper px-3 py-2 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={passwordForm[key]}
                onChange={(event) => setPasswordForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            ))}
          </div>
          <button disabled={savingPassword} onClick={changePassword} className="focus-ring mt-5 rounded-lg bg-mint px-4 py-2 font-semibold text-ink disabled:opacity-60">
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
          <h3 className="mb-4 text-lg font-bold dark:text-white">Portal Preferences</h3>
          <div className="space-y-3">
            {[
              ["attendanceAlerts", "Attendance Alerts"],
              ["feeReminders", "Fee Reminders"],
              ["approvalNotifications", "Approval Notifications"],
              ["emailCopies", "Email Copies for Notices"],
              ["compactReceipts", "Compact Receipt Layout"],
              ["rememberDevices", "Remember Trusted Devices"]
            ].map(([key, label]) => (
              <button key={key} type="button" onClick={() => togglePreference(key)} className="flex w-full items-center justify-between rounded-lg border border-ink/10 bg-paper px-4 py-3 text-left dark:border-white/10 dark:bg-white/10">
                <span className="font-medium dark:text-white">{label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${preferences[key] ? "bg-mint/20 text-mint" : "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60"}`}>
                  {preferences[key] ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>
          <button onClick={savePreferences} className="focus-ring mt-5 rounded-lg bg-ink px-4 py-2 font-semibold text-white dark:bg-mint dark:text-ink">Save Preferences</button>
        </div>
      </div>
    </div>
  );
};
