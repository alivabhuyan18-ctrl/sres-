import express from "express";
import { body, validationResult } from "express-validator";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/dashboard", async (req, res) => {
  const [students, faculty, courses, enrollments, payments] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "faculty" }),
    Course.countDocuments({ isActive: true }),
    Enrollment.countDocuments(),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
  ]);
  res.json({ students, faculty, courses, enrollments, revenue: payments[0]?.total || 0 });
});

router.get("/users", async (req, res) => {
  const role = req.query.role;
  const filter = role ? { role } : {};
  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

router.post("/users", [body("name").trim().notEmpty(), body("identifier").trim().notEmpty(), body("email").isEmail(), body("password").isLength({ min: 6 }), body("role").isIn(["student", "faculty", "admin"])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  const user = await User.create(req.body);
  res.status(201).json({ ...user.toJSON(), password: undefined });
});

router.put("/users/:id", async (req, res) => {
  const allowed = ["name", "email", "department", "designation", "phone", "address", "semester", "isActive"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "User deactivated" });
});

router.get("/courses", async (req, res) => {
  const courses = await Course.find({}).populate("instructor", "name identifier").populate("prerequisites", "code name");
  res.json(courses);
});

router.post("/courses", [body("code").trim().notEmpty(), body("name").trim().notEmpty(), body("credits").isInt({ min: 1 }), body("capacity").isInt({ min: 1 }), body("semester").isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

router.put("/courses/:id", async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

router.get("/enrollments", async (req, res) => {
  const enrollments = await Enrollment.find({}).populate("student", "name identifier").populate("course", "code name").populate("approvedBy", "name");
  res.json(enrollments);
});

router.get("/documents", async (req, res) => {
  const students = await User.find({ role: "student" }).select("name identifier qualificationDetails certificates");
  const documents = students.flatMap((student) => [
    ...(student.qualificationDetails || []).map((item, index) => ({
      studentId: student._id,
      studentName: student.name,
      identifier: student.identifier,
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
      type: "certificate",
      index,
      name: item.certificate || "Certificate",
      file: item.file || "Not uploaded",
      fileData: item.fileData || "",
      verificationStatus: item.verificationStatus || "Not Uploaded",
      verificationRemark: item.verificationRemark || ""
    }))
  ]);
  res.json(documents);
});

router.put("/documents/verify", [body("studentId").isMongoId(), body("type").isIn(["qualification", "certificate"]), body("index").isInt({ min: 0 }), body("verificationStatus").isIn(["Pending", "Verified", "Rejected"])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  const user = await User.findById(req.body.studentId);
  if (!user) return res.status(404).json({ message: "Student not found" });

  const collection = req.body.type === "qualification" ? user.qualificationDetails : user.certificates;
  if (!collection?.[req.body.index]) return res.status(404).json({ message: "Document not found" });
  collection[req.body.index].verificationStatus = req.body.verificationStatus;
  collection[req.body.index].verificationRemark = req.body.verificationRemark || "";
  await user.save();

  res.json({ message: "Document status updated" });
});

router.get("/reports", async (req, res) => {
  const [byStatus, byRole, notifications] = await Promise.all([
    Enrollment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Notification.countDocuments()
  ]);
  res.json({ enrollmentStatus: byStatus, usersByRole: byRole, notifications });
});

export default router;
