import express from "express";
import { body, validationResult } from "express-validator";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, authorize("student"));

router.get("/profile", async (req, res) => {
  const [enrollments, attendance, payments, notifications] = await Promise.all([
    Enrollment.find({ student: req.user._id }).populate("course", "code name credits"),
    Attendance.find({ student: req.user._id }).populate("course", "code name"),
    Payment.find({ student: req.user._id }).sort({ createdAt: -1 }),
    Notification.find({
      $or: [{ audience: "student" }, { audience: "all" }, { recipient: req.user._id }]
    }).sort({ createdAt: -1 })
  ]);

  res.json({ profile: req.user, enrollments, attendance, payments, notifications });
});

router.put(
  "/profile",
  [body("name").optional().trim().notEmpty(), body("email").optional().isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    const allowed = [
      "name",
      "email",
      "phone",
      "address",
      "department",
      "semester",
      "avatar",
      "applicationNo",
      "rank",
      "admissionStatus",
      "joiningYear",
      "programme",
      "programmeType",
      "branch",
      "allotmentDetails",
      "personalDetails",
      "communicationDetails",
      "qualificationDetails",
      "certificates"
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  }
);

router.get("/courses", async (req, res) => {
  const [courses, enrollments] = await Promise.all([
    Course.find({ isActive: true }).populate("prerequisites", "code name").populate("instructor", "name"),
    Enrollment.find({ student: req.user._id })
  ]);
  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { status: { $in: ["pending", "approved"] } } },
    { $group: { _id: "$course", count: { $sum: 1 } } }
  ]);
  const counts = new Map(enrollmentCounts.map((item) => [String(item._id), item.count]));
  const enrolledCourseIds = new Set(enrollments.map((item) => String(item.course)));

  res.json(
    courses.map((course) => ({
      ...course.toJSON(),
      enrolled: enrolledCourseIds.has(String(course._id)),
      availableSeats: Math.max(course.capacity - (counts.get(String(course._id)) || 0), 0)
    }))
  );
});

router.post("/enroll", [body("courseId").isMongoId()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });

  const course = await Course.findById(req.body.courseId).populate("prerequisites");
  if (!course || !course.isActive) return res.status(404).json({ message: "Course not found" });

  const duplicate = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (duplicate) return res.status(409).json({ message: "You already requested or enrolled in this course" });

  const occupied = await Enrollment.countDocuments({ course: course._id, status: { $in: ["pending", "approved"] } });
  if (occupied >= course.capacity) return res.status(400).json({ message: "Course capacity is full" });

  const approved = await Enrollment.find({ student: req.user._id, status: "approved" }).select("course");
  const approvedIds = new Set(approved.map((item) => String(item.course)));
  const missing = course.prerequisites.filter((item) => !approvedIds.has(String(item._id)));
  if (missing.length) {
    return res.status(400).json({ message: `Prerequisite missing: ${missing.map((item) => item.code).join(", ")}` });
  }

  const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });
  res.status(201).json(await enrollment.populate("course", "code name credits"));
});

export default router;
