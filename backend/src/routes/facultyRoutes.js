import express from "express";
import { body, validationResult } from "express-validator";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";
import { getPagination, paginatedResponse, shouldPaginate } from "../utils/pagination.js";

const router = express.Router();
router.use(protect, authorize("faculty"));

const canApproveEnrollments = (designation = "") => /hod|advisor/i.test(designation);

const getFacultyScope = async (facultyId) => {
  const [courseIds, adviseeIds] = await Promise.all([
    Course.distinct("_id", { instructor: facultyId, isActive: true }),
    User.distinct("_id", { role: "student", advisor: facultyId })
  ]);
  const enrolledStudentIds = courseIds.length ? await Enrollment.distinct("student", { course: { $in: courseIds } }) : [];

  return {
    courseIds,
    studentIds: [...new Set([...adviseeIds, ...enrolledStudentIds].map((id) => String(id)))]
  };
};

router.get("/dashboard", async (req, res) => {
  const scope = await getFacultyScope(req.user._id);
  const [pending, handled] = await Promise.all([
    Enrollment.countDocuments({
      status: "pending",
      ...(scope.courseIds.length || scope.studentIds.length
        ? {
            $or: [
              ...(scope.courseIds.length ? [{ course: { $in: scope.courseIds } }] : []),
              ...(scope.studentIds.length ? [{ student: { $in: scope.studentIds } }] : [])
            ]
          }
        : { _id: null })
    }),
    Course.find({ instructor: req.user._id, isActive: true })
  ]);
  res.json({
    totalStudents: scope.studentIds.length,
    pendingApprovals: pending,
    coursesHandled: handled.length,
    approvalAccess: canApproveEnrollments(req.user.designation)
  });
});

router.get("/students", async (req, res) => {
  const search = req.query.search || "";
  const branch = req.query.branch || "";
  const scope = await getFacultyScope(req.user._id);
  if (!scope.studentIds.length) {
    return res.json(shouldPaginate(req.query) ? paginatedResponse({ items: [], total: 0, page: 1, limit: Number(req.query.limit || 10) }) : []);
  }

  const filter = {
    _id: { $in: scope.studentIds },
    role: "student",
    ...(branch ? { branch } : {}),
    ...(search
      ? {
          $or: [{ name: new RegExp(search, "i") }, { identifier: new RegExp(search, "i") }, { department: new RegExp(search, "i") }]
        }
      : {})
  };

  if (!shouldPaginate(req.query)) {
    const students = await User.find(filter).select("-password").sort({ name: 1 });
    return res.json(students);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [students, total] = await Promise.all([
    User.find(filter).select("-password").sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ items: students, total, page, limit }));
});

// Faculty tools use this route to build schedule and attendance views.
router.get("/courses", async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id, isActive: true }).sort({ branch: 1, code: 1 });
  res.json(courses);
});

router.get("/enrollments", async (req, res) => {
  const scope = await getFacultyScope(req.user._id);
  if (!scope.courseIds.length && !scope.studentIds.length) {
    return res.json(shouldPaginate(req.query) ? paginatedResponse({ items: [], total: 0, page: 1, limit: Number(req.query.limit || 10) }) : []);
  }

  const search = req.query.search || "";
  const status = req.query.status || "";
  const courseFilter = scope.courseIds.length ? { _id: { $in: scope.courseIds } } : {};
  const studentFilter = scope.studentIds.length ? { _id: { $in: scope.studentIds } } : {};

  const [matchingCourseIds, matchingStudentIds] = search
    ? await Promise.all([
        Course.find({
          ...courseFilter,
          $or: [{ code: new RegExp(search, "i") }, { name: new RegExp(search, "i") }, { branch: new RegExp(search, "i") }]
        }).distinct("_id"),
        User.find({
          ...studentFilter,
          role: "student",
          $or: [{ name: new RegExp(search, "i") }, { identifier: new RegExp(search, "i") }, { department: new RegExp(search, "i") }]
        }).distinct("_id")
      ])
    : [[], []];

  const filter = {
    ...(status ? { status } : {}),
    $or: [
      ...(scope.courseIds.length ? [{ course: { $in: search ? matchingCourseIds : scope.courseIds } }] : []),
      ...(scope.studentIds.length ? [{ student: { $in: search ? matchingStudentIds : scope.studentIds } }] : [])
    ]
  };

  if (!shouldPaginate(req.query)) {
    const enrollments = await Enrollment.find(filter)
      .populate("student", "name identifier department semester branch")
      .populate("course", "code name credits branch category courseKind schedule")
      .sort({ createdAt: -1 });
    return res.json(enrollments);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate("student", "name identifier department semester branch")
      .populate("course", "code name credits branch category courseKind schedule")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ items: enrollments, total, page, limit }));
});

router.put("/approve", [body("enrollmentId").isMongoId(), body("status").isIn(["approved", "rejected"])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  if (!canApproveEnrollments(req.user.designation)) {
    return res.status(403).json({ message: "Only HODs and advisors can review enrollment requests." });
  }

  const scope = await getFacultyScope(req.user._id);
  const enrollment = await Enrollment.findOne({
    _id: req.body.enrollmentId,
    $or: [
      ...(scope.courseIds.length ? [{ course: { $in: scope.courseIds } }] : []),
      ...(scope.studentIds.length ? [{ student: { $in: scope.studentIds } }] : [])
    ]
  }).populate("student course");

  if (!enrollment) return res.status(404).json({ message: "Enrollment not found for this faculty scope" });
  enrollment.status = req.body.status;
  enrollment.remarks = req.body.remarks || "";
  enrollment.approvedBy = req.user._id;
  enrollment.approvedAt = new Date();
  await enrollment.save();
  await Notification.create({
    title: `Enrollment ${req.body.status}`,
    message: `${enrollment.course.name} has been ${req.body.status}.`,
    audience: "student",
    recipient: enrollment.student._id,
    createdBy: req.user._id
  });
  await logAudit({
    actor: req.user,
    action: `faculty.enrollment.${req.body.status}`,
    entity: "enrollment",
    entityId: enrollment._id,
    summary: `${enrollment.course.code} ${req.body.status} for ${enrollment.student.identifier}`,
    details: { remarks: enrollment.remarks }
  });
  res.json(enrollment);
});

router.put("/attendance", [body("studentId").isMongoId(), body("courseId").isMongoId()], async (req, res) => {
  const course = await Course.findOne({ _id: req.body.courseId, instructor: req.user._id, isActive: true });
  if (!course) return res.status(404).json({ message: "Assigned course not found" });

  const approvedEnrollment = await Enrollment.findOne({
    student: req.body.studentId,
    course: course._id,
    status: "approved"
  });
  if (!approvedEnrollment) {
    return res.status(400).json({ message: "Attendance can only be recorded for approved enrollments" });
  }

  const totalClasses = Number(req.body.totalClasses || 0);
  const attendedClasses = Number(req.body.attendedClasses || 0);
  if (totalClasses < 1 || attendedClasses < 0 || attendedClasses > totalClasses) {
    return res.status(400).json({ message: "Attendance values are invalid" });
  }

  const attendance = await Attendance.findOneAndUpdate(
    { student: req.body.studentId, course: req.body.courseId },
    { totalClasses, attendedClasses },
    { new: true, upsert: true }
  );
  await logAudit({
    actor: req.user,
    action: "faculty.attendance.updated",
    entity: "attendance",
    entityId: attendance._id,
    summary: `Attendance updated for ${course.code}`,
    details: { studentId: req.body.studentId, totalClasses, attendedClasses }
  });
  res.json(attendance);
});

router.post("/notifications", [body("title").trim().notEmpty(), body("message").trim().notEmpty()], async (req, res) => {
  const note = await Notification.create({ ...req.body, audience: "student", createdBy: req.user._id });
  await logAudit({
    actor: req.user,
    action: "faculty.notification.sent",
    entity: "notification",
    entityId: note._id,
    summary: `Announcement sent: ${note.title}`
  });
  res.status(201).json(note);
});

export default router;
