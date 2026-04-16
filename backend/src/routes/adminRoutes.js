import express from "express";
import { body, validationResult } from "express-validator";
import AuditLog from "../models/AuditLog.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";
import { getPagination, paginatedResponse, shouldPaginate } from "../utils/pagination.js";

const router = express.Router();
router.use(protect, authorize("admin"));

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed", errors: errors.array() });
    return true;
  }
  return false;
};

const makeSearchRegex = (value) => new RegExp(value, "i");
const optionalPhoneRule = body("phone").optional({ values: "falsy" }).matches(/^\d{10}$/).withMessage("Phone number must be exactly 10 digits");

router.get("/dashboard", async (req, res) => {
  const [students, faculty, courses, enrollments, payments, documentsPending, recentActions] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "faculty" }),
    Course.countDocuments({ isActive: true }),
    Enrollment.countDocuments(),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    User.countDocuments({
      role: "student",
      $or: [
        { "qualificationDetails.verificationStatus": "Pending" },
        { "certificates.verificationStatus": "Pending" }
      ]
    }),
    AuditLog.find().sort({ createdAt: -1 }).limit(6)
  ]);
  res.json({
    students,
    faculty,
    courses,
    enrollments,
    revenue: payments[0]?.total || 0,
    documentsPending,
    recentActions
  });
});

router.get("/users", async (req, res) => {
  const { role, branch, search = "", status = "" } = req.query;
  const filter = {
    ...(role ? { role } : {}),
    ...(branch ? { branch } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {})
  };

  if (search) {
    const regex = makeSearchRegex(search);
    filter.$or = [{ name: regex }, { identifier: regex }, { email: regex }, { department: regex }, { branch: regex }, { designation: regex }];
  }

  const query = User.find(filter).select("-password").populate("advisor", "name identifier").sort({ createdAt: -1 });
  if (!shouldPaginate(req.query)) {
    return res.json(await query);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    query.clone().skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ items, total, page, limit }));
});

router.post(
  "/users",
  [
    body("name").trim().notEmpty(),
    body("identifier").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["student", "faculty", "admin"]),
    body("semester").optional({ values: "falsy" }).isInt({ min: 1, max: 12 }),
    optionalPhoneRule,
    body("advisor").optional({ values: "falsy" }).isMongoId()
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const exists = await User.findOne({ $or: [{ email: req.body.email }, { identifier: req.body.identifier }] });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const user = await User.create(req.body);
    await logAudit({
      actor: req.user,
      action: "admin.user.created",
      entity: "user",
      entityId: user._id,
      summary: `${user.role} account created for ${user.identifier}`
    });
    res.status(201).json({ ...user.toJSON(), password: undefined });
  }
);

router.put(
  "/users/:id",
  [
    body("email").optional().isEmail(),
    body("semester").optional({ values: "falsy" }).isInt({ min: 1, max: 12 }),
    optionalPhoneRule,
    body("advisor").optional({ values: "falsy" }).isMongoId()
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    const allowed = ["name", "email", "department", "designation", "phone", "address", "semester", "isActive", "branch", "programme", "programmeType", "advisor"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select("-password")
      .populate("advisor", "name identifier");
    if (!user) return res.status(404).json({ message: "User not found" });

    await logAudit({
      actor: req.user,
      action: "admin.user.updated",
      entity: "user",
      entityId: user._id,
      summary: `${user.identifier} updated`,
      details: { keys: Object.keys(updates) }
    });
    res.json(user);
  }
);

router.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  await logAudit({
    actor: req.user,
    action: "admin.user.deactivated",
    entity: "user",
    entityId: user._id,
    summary: `${user.identifier} deactivated`
  });
  res.json({ message: "User deactivated" });
});

router.get("/courses", async (req, res) => {
  const { search = "", branch = "", status = "" } = req.query;
  const filter = {
    ...(branch ? { branch } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {})
  };

  if (search) {
    const regex = makeSearchRegex(search);
    filter.$or = [{ code: regex }, { name: regex }, { department: regex }, { category: regex }, { branch: regex }];
  }

  const query = Course.find(filter)
    .populate("instructor", "name identifier department")
    .populate("prerequisites", "code name")
    .sort({ branch: 1, semester: 1, code: 1 });

  if (!shouldPaginate(req.query)) {
    return res.json(await query);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    query.clone().skip(skip).limit(limit),
    Course.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ items, total, page, limit }));
});

router.post(
  "/courses",
  [
    body("code").trim().notEmpty(),
    body("name").trim().notEmpty(),
    body("credits").isInt({ min: 1 }),
    body("capacity").isInt({ min: 1 }),
    body("semester").isInt({ min: 1 }),
    body("branch").optional().trim().notEmpty(),
    body("category").optional().trim().notEmpty(),
    body("courseKind").optional().isIn(["theory", "lab"]),
    body("instructor").optional({ values: "falsy" }).isMongoId(),
    body("prerequisites").optional().isArray(),
    body("schedule.days").optional().trim(),
    body("schedule.time").optional().trim(),
    body("schedule.room").optional().trim()
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    const course = await Course.create(req.body);
    await logAudit({
      actor: req.user,
      action: "admin.course.created",
      entity: "course",
      entityId: course._id,
      summary: `${course.code} created`
    });
    res.status(201).json(course);
  }
);

router.put(
  "/courses/:id",
  [
    body("code").optional().trim().notEmpty(),
    body("name").optional().trim().notEmpty(),
    body("credits").optional().isInt({ min: 1 }),
    body("capacity").optional().isInt({ min: 1 }),
    body("semester").optional().isInt({ min: 1, max: 12 }),
    body("courseKind").optional().isIn(["theory", "lab"]),
    body("instructor").optional({ values: "falsy" }).isMongoId(),
    body("prerequisites").optional().isArray()
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    const allowed = ["code", "name", "credits", "capacity", "semester", "department", "branch", "category", "courseKind", "instructor", "prerequisites", "isActive", "schedule"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate("instructor", "name identifier department")
      .populate("prerequisites", "code name");
    if (!course) return res.status(404).json({ message: "Course not found" });

    await logAudit({
      actor: req.user,
      action: "admin.course.updated",
      entity: "course",
      entityId: course._id,
      summary: `${course.code} updated`,
      details: { keys: Object.keys(updates) }
    });
    res.json(course);
  }
);

router.get("/enrollments", async (req, res) => {
  const { search = "", status = "", branch = "" } = req.query;
  const [matchingStudents, matchingCourses] = search
    ? await Promise.all([
        User.find({
          role: "student",
          $or: [{ name: makeSearchRegex(search) }, { identifier: makeSearchRegex(search) }, { branch: makeSearchRegex(search) }]
        }).distinct("_id"),
        Course.find({
          $or: [{ code: makeSearchRegex(search) }, { name: makeSearchRegex(search) }, { branch: makeSearchRegex(search) }]
        }).distinct("_id")
      ])
    : [[], []];

  const filter = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          $or: [{ student: { $in: matchingStudents } }, { course: { $in: matchingCourses } }]
        }
      : {})
  };

  const query = Enrollment.find(filter)
    .populate("student", "name identifier branch semester")
    .populate("course", "code name branch category courseKind")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });

  const postFilter = (rows) => (branch ? rows.filter((item) => item.student?.branch === branch || item.course?.branch === branch) : rows);

  if (!shouldPaginate(req.query)) {
    return res.json(postFilter(await query));
  }

  const { page, limit, skip } = getPagination(req.query);
  const rows = postFilter(await query);
  res.json(paginatedResponse({ items: rows.slice(skip, skip + limit), total: rows.length, page, limit }));
});

router.get("/documents", async (req, res) => {
  const { search = "", status = "" } = req.query;
  const students = await User.find({ role: "student" }).select("name identifier branch qualificationDetails certificates");
  let documents = students.flatMap((student) => [
    ...(student.qualificationDetails || []).map((item, index) => ({
      studentId: student._id,
      studentName: student.name,
      identifier: student.identifier,
      branch: student.branch,
      type: "qualification",
      index,
      name: item.qualification || "Qualification",
      file: item.marksheetCertificate || "Not uploaded",
      fileData: item.marksheetCertificateData || "",
      verificationStatus: item.verificationStatus || "Not Uploaded",
      verificationRemark: item.verificationRemark || ""
    })),
    ...(student.certificates || []).map((item, index) => ({
      studentId: student._id,
      studentName: student.name,
      identifier: student.identifier,
      branch: student.branch,
      type: "certificate",
      index,
      name: item.certificate || "Certificate",
      file: item.file || "Not uploaded",
      fileData: item.fileData || "",
      verificationStatus: item.verificationStatus || "Not Uploaded",
      verificationRemark: item.verificationRemark || ""
    }))
  ]);

  if (search) {
    const regex = makeSearchRegex(search);
    documents = documents.filter((item) => regex.test(item.studentName) || regex.test(item.identifier) || regex.test(item.name) || regex.test(item.branch || ""));
  }
  if (status) documents = documents.filter((item) => item.verificationStatus === status);

  if (!shouldPaginate(req.query)) {
    return res.json(documents);
  }

  const { page, limit, skip } = getPagination(req.query);
  res.json(paginatedResponse({ items: documents.slice(skip, skip + limit), total: documents.length, page, limit }));
});

router.put(
  "/documents/verify",
  [
    body("studentId").isMongoId(),
    body("type").isIn(["qualification", "certificate"]),
    body("index").isInt({ min: 0 }),
    body("verificationStatus").isIn(["Pending", "Verified", "Rejected"])
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const user = await User.findById(req.body.studentId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    const collection = req.body.type === "qualification" ? user.qualificationDetails : user.certificates;
    if (!collection?.[req.body.index]) return res.status(404).json({ message: "Document not found" });
    collection[req.body.index].verificationStatus = req.body.verificationStatus;
    collection[req.body.index].verificationRemark = req.body.verificationRemark || "";
    await user.save();

    const label = req.body.type === "qualification" ? collection[req.body.index].qualification : collection[req.body.index].certificate;
    await Notification.create({
      title: `Document ${req.body.verificationStatus}`,
      message: `${label || "Your document"} has been marked ${req.body.verificationStatus.toLowerCase()}.`,
      audience: "student",
      recipient: user._id,
      createdBy: req.user._id
    });
    await logAudit({
      actor: req.user,
      action: "admin.document.reviewed",
      entity: "document",
      entityId: `${user._id}:${req.body.type}:${req.body.index}`,
      summary: `${label || "Document"} marked ${req.body.verificationStatus}`,
      details: { remark: req.body.verificationRemark || "" }
    });

    res.json({ message: "Document status updated" });
  }
);

router.get("/audit-logs", async (req, res) => {
  const { search = "", entity = "" } = req.query;
  const filter = {
    ...(entity ? { entity } : {}),
    ...(search
      ? {
          $or: [{ actorName: makeSearchRegex(search) }, { action: makeSearchRegex(search) }, { summary: makeSearchRegex(search) }]
        }
      : {})
  };

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ items, total, page, limit }));
});

router.get("/reports", async (req, res) => {
  const [byStatus, byRole, notifications, pendingPayments, branchWiseStudents, auditTrail] = await Promise.all([
    Enrollment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Notification.countDocuments(),
    Payment.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]),
    User.aggregate([{ $match: { role: "student" } }, { $group: { _id: "$branch", count: { $sum: 1 } } }]),
    AuditLog.find().sort({ createdAt: -1 }).limit(10)
  ]);

  const students = await User.find({ role: "student" }).select("qualificationDetails certificates");
  const documentStatus = students.flatMap((student) => [
    ...(student.qualificationDetails || []).map((item) => item.verificationStatus || "Not Uploaded"),
    ...(student.certificates || []).map((item) => item.verificationStatus || "Not Uploaded")
  ]);
  const documentsByStatus = ["Verified", "Pending", "Rejected", "Not Uploaded"].map((label) => ({
    _id: label,
    count: documentStatus.filter((status) => status === label).length
  }));

  res.json({
    enrollmentStatus: byStatus,
    usersByRole: byRole,
    notifications,
    pendingPayments: pendingPayments[0] || { total: 0, count: 0 },
    branchWiseStudents,
    documentsByStatus,
    recentActivity: auditTrail
  });
});

export default router;
