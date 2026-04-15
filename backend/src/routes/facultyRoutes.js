import express from "express";
import { body, validationResult } from "express-validator";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, authorize("faculty"));

router.get("/dashboard", async (req, res) => {
  const [students, pending, handled] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Enrollment.countDocuments({ status: "pending" }),
    Enrollment.find({}).populate("course", "instructor")
  ]);
  const courseIds = new Set(handled.filter((item) => String(item.course?.instructor) === String(req.user._id)).map((item) => String(item.course?._id)));
  res.json({ totalStudents: students, pendingApprovals: pending, coursesHandled: courseIds.size });
});

router.get("/students", async (req, res) => {
  const search = req.query.search || "";
  const students = await User.find({
    role: "student",
    $or: [{ name: new RegExp(search, "i") }, { identifier: new RegExp(search, "i") }, { department: new RegExp(search, "i") }]
  }).select("-password");
  res.json(students);
});

router.get("/enrollments", async (req, res) => {
  const enrollments = await Enrollment.find({})
    .populate("student", "name identifier department semester")
    .populate("course", "code name credits")
    .sort({ createdAt: -1 });
  res.json(enrollments);
});

router.put("/approve", [body("enrollmentId").isMongoId(), body("status").isIn(["approved", "rejected"])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });

  const enrollment = await Enrollment.findByIdAndUpdate(
    req.body.enrollmentId,
    { status: req.body.status, remarks: req.body.remarks || "", approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  ).populate("student course");

  if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
  await Notification.create({
    title: `Enrollment ${req.body.status}`,
    message: `${enrollment.course.name} has been ${req.body.status}.`,
    audience: "student",
    recipient: enrollment.student._id,
    createdBy: req.user._id
  });
  res.json(enrollment);
});

router.put("/attendance", [body("studentId").isMongoId(), body("courseId").isMongoId()], async (req, res) => {
  const attendance = await Attendance.findOneAndUpdate(
    { student: req.body.studentId, course: req.body.courseId },
    { totalClasses: req.body.totalClasses || 0, attendedClasses: req.body.attendedClasses || 0 },
    { new: true, upsert: true }
  );
  res.json(attendance);
});

router.post("/notifications", [body("title").trim().notEmpty(), body("message").trim().notEmpty()], async (req, res) => {
  const note = await Notification.create({ ...req.body, audience: "student", createdBy: req.user._id });
  res.status(201).json(note);
});

export default router;
