import express from "express";
import { body, param, validationResult } from "express-validator";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { logAudit } from "../utils/audit.js";

const router = express.Router();
router.use(protect, authorize("student"));

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed", errors: errors.array() });
    return true;
  }
  return false;
};

const allowedProfileFields = [
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

const studentNotificationFilter = (userId) => ({
  $or: [{ audience: "student" }, { audience: "all" }, { recipient: userId }]
});

const buildUploadUrl = (req, folder, filename) => `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;

const ensureFileEntry = (collection = [], index, fallback) => {
  const next = [...collection];
  while (next.length <= index) {
    next.push(fallback());
  }
  return next;
};

const validatePhone = (value) => !value || /^\d{10}$/.test(String(value));
const validatePin = (value) => !value || /^\d{6}$/.test(String(value));
const validateMaskedAadhaar = (value) => !value || /^[0-9Xx-]{8,18}$/.test(String(value));
const validateIfsc = (value) => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(value));
const getNestedValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);
const requiredProfileFields = [
  ["identifier", "Registration No."],
  ["applicationNo", "Application No."],
  ["name", "Name"],
  ["admissionStatus", "Admission Status"],
  ["joiningYear", "Joining Year"],
  ["semester", "Semester"],
  ["programme", "Programme"],
  ["programmeType", "Programme Type"],
  ["branch", "Branch"],
  ["allotmentDetails.batch", "Batch"],
  ["allotmentDetails.admissionType", "Admission Type"],
  ["allotmentDetails.feeType", "Fee Type"],
  ["allotmentDetails.seatCategory", "Seat Category"],
  ["allotmentDetails.category", "Category"],
  ["allotmentDetails.entranceExam", "Entrance Exam"],
  ["allotmentDetails.entranceRank", "Entrance Rank"],
  ["personalDetails.dob", "DOB"],
  ["personalDetails.gender", "Gender"],
  ["personalDetails.fatherName", "Father Name"],
  ["personalDetails.motherName", "Mother Name"],
  ["personalDetails.bloodGroup", "Blood Group"],
  ["personalDetails.nationality", "Nationality"],
  ["personalDetails.aadharNo", "Aadhar No."],
  ["communicationDetails.parentMobile", "Parent Mobile"],
  ["communicationDetails.studentMobileWhatsapp", "Student Mobile WhatsApp"],
  ["communicationDetails.studentEmail", "Student Email"],
  ["communicationDetails.correspondenceGuardian", "Correspondence Guardian"],
  ["communicationDetails.correspondenceDoorNo", "Correspondence Door No."],
  ["communicationDetails.correspondenceStreet", "Correspondence Street"],
  ["communicationDetails.correspondenceVillageCity", "Correspondence Village/City"],
  ["communicationDetails.correspondenceState", "Correspondence State"],
  ["communicationDetails.correspondenceDistrict", "Correspondence District"],
  ["communicationDetails.correspondencePinCode", "Correspondence Pin Code"],
  ["communicationDetails.permanentGuardian", "Permanent Guardian"],
  ["communicationDetails.permanentDoorNo", "Permanent Door No."],
  ["communicationDetails.permanentStreet", "Permanent Street"],
  ["communicationDetails.permanentVillageCity", "Permanent Village/City"],
  ["communicationDetails.permanentState", "Permanent State"],
  ["communicationDetails.permanentDistrict", "Permanent District"],
  ["communicationDetails.permanentPinCode", "Permanent Pin Code"]
];
const requiredFieldsBySection = {
  profile: requiredProfileFields.filter(([path]) => ["identifier", "applicationNo", "name", "admissionStatus", "joiningYear", "semester", "programme", "programmeType", "branch"].includes(path)),
  allotment: requiredProfileFields.filter(([path]) => path.startsWith("allotmentDetails.")),
  personal: requiredProfileFields.filter(([path]) => path.startsWith("personalDetails.")),
  communication: requiredProfileFields.filter(([path]) => path.startsWith("communicationDetails."))
};

const validateProfilePayload = (updates, section = "") => {
  const issues = [];
  const fieldsToCheck = requiredFieldsBySection[section] || requiredProfileFields;
  const missingRequired = fieldsToCheck.filter(([path]) => !String(getNestedValue(updates, path) || "").trim());
  if (missingRequired.length) {
    issues.push(`${missingRequired[0][1]} is required.`);
  }
  if (updates.phone && !validatePhone(updates.phone)) {
    issues.push("Student phone number must be exactly 10 digits.");
  }
  if (updates.semester && (!Number.isInteger(Number(updates.semester)) || Number(updates.semester) < 1)) {
    issues.push("Semester must be a positive whole number.");
  }
  if (updates.personalDetails?.aadharNo && !validateMaskedAadhaar(updates.personalDetails.aadharNo)) {
    issues.push("Aadhaar number format is invalid.");
  }
  if (updates.personalDetails?.fatherAadhar && !validateMaskedAadhaar(updates.personalDetails.fatherAadhar)) {
    issues.push("Father Aadhaar format is invalid.");
  }
  if (updates.personalDetails?.motherAadhar && !validateMaskedAadhaar(updates.personalDetails.motherAadhar)) {
    issues.push("Mother Aadhaar format is invalid.");
  }
  if (updates.personalDetails?.ifscCode && !validateIfsc(updates.personalDetails.ifscCode)) {
    issues.push("IFSC code format is invalid.");
  }
  if (updates.communicationDetails?.parentMobile && !validatePhone(updates.communicationDetails.parentMobile)) {
    issues.push("Parent mobile number must be exactly 10 digits.");
  }
  if (updates.communicationDetails?.studentMobileWhatsapp && !validatePhone(updates.communicationDetails.studentMobileWhatsapp)) {
    issues.push("Student mobile/WhatsApp number must be exactly 10 digits.");
  }
  if (updates.communicationDetails?.correspondencePinCode && !validatePin(updates.communicationDetails.correspondencePinCode)) {
    issues.push("Correspondence pin code must be 6 digits.");
  }
  if (updates.communicationDetails?.permanentPinCode && !validatePin(updates.communicationDetails.permanentPinCode)) {
    issues.push("Permanent pin code must be 6 digits.");
  }
  return issues;
};

router.get("/profile", async (req, res) => {
  const [profile, enrollments, attendance, payments, notifications] = await Promise.all([
    User.findById(req.user._id).select("-password").populate("advisor", "name identifier"),
    Enrollment.find({ student: req.user._id }).populate("course", "code name credits category branch schedule courseKind"),
    Attendance.find({ student: req.user._id }).populate("course", "code name"),
    Payment.find({ student: req.user._id }).sort({ createdAt: -1 }),
    Notification.find(studentNotificationFilter(req.user._id)).sort({ createdAt: -1 })
  ]);

  res.json({
    profile,
    enrollments,
    attendance,
    payments,
    notifications: notifications.map((note) => ({
      ...note.toJSON(),
      isRead: note.readBy?.some((reader) => String(reader) === String(req.user._id))
    }))
  });
});

router.put(
  "/profile",
  [body("name").optional().trim().notEmpty(), body("email").optional().isEmail().normalizeEmail()],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const profileSection = req.body.profileSection || "";
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedProfileFields.includes(key)));
    const existingUser = await User.findById(req.user._id).select("-password");
    if (!existingUser) return res.status(404).json({ message: "Student not found" });

    const currentProfile = existingUser.toObject();
    const mergedUpdates = {
      ...currentProfile,
      ...updates,
      allotmentDetails: { ...(currentProfile.allotmentDetails || {}), ...(updates.allotmentDetails || {}) },
      personalDetails: { ...(currentProfile.personalDetails || {}), ...(updates.personalDetails || {}) },
      communicationDetails: { ...(currentProfile.communicationDetails || {}), ...(updates.communicationDetails || {}) },
      qualificationDetails: updates.qualificationDetails || currentProfile.qualificationDetails,
      certificates: updates.certificates || currentProfile.certificates
    };
    const issues = validateProfilePayload(mergedUpdates, profileSection);
    if (issues.length) return res.status(400).json({ message: issues[0] });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    await logAudit({
      actor: req.user,
      action: "student.profile.updated",
      entity: "user",
      entityId: req.user._id,
      summary: "Student profile updated",
      details: { keys: Object.keys(updates) }
    });

    res.json(user);
  }
);

router.post("/uploads/avatar", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please choose an image file to upload." });

  const avatar = buildUploadUrl(req, "avatars", req.file.filename);
  const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true }).select("-password");

  await logAudit({
    actor: req.user,
    action: "student.avatar.uploaded",
    entity: "user",
    entityId: req.user._id,
    summary: "Profile photo uploaded"
  });

  res.json({ avatar, profile: user });
});

router.post(
  "/uploads/qualification/:index",
  [param("index").isInt({ min: 0 })],
  upload.single("file"),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    if (!req.file) return res.status(400).json({ message: "Choose a PDF or image file to upload." });

    const index = Number(req.params.index);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.qualificationDetails = ensureFileEntry(user.qualificationDetails, index, () => ({
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
    }));

    const fileUrl = buildUploadUrl(req, "documents", req.file.filename);
    user.qualificationDetails[index].marksheetCertificate = req.file.originalname;
    user.qualificationDetails[index].marksheetCertificateData = fileUrl;
    user.qualificationDetails[index].verificationStatus = "Pending";
    user.qualificationDetails[index].verificationRemark = "";
    await user.save();

    await logAudit({
      actor: req.user,
      action: "student.qualification.uploaded",
      entity: "document",
      entityId: `${req.user._id}:qualification:${index}`,
      summary: "Qualification document uploaded",
      details: { file: req.file.originalname, index }
    });

    res.json({
      file: req.file.originalname,
      fileData: fileUrl,
      verificationStatus: "Pending",
      verificationRemark: ""
    });
  }
);

router.post(
  "/uploads/certificate/:index",
  [param("index").isInt({ min: 0 })],
  upload.single("file"),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    if (!req.file) return res.status(400).json({ message: "Choose a PDF or image file to upload." });

    const index = Number(req.params.index);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.certificates = ensureFileEntry(user.certificates, index, () => ({
      certificate: "",
      file: "",
      fileData: "",
      verificationStatus: "Not Uploaded",
      verificationRemark: ""
    }));

    const fileUrl = buildUploadUrl(req, "documents", req.file.filename);
    user.certificates[index].file = req.file.originalname;
    user.certificates[index].fileData = fileUrl;
    user.certificates[index].verificationStatus = "Pending";
    user.certificates[index].verificationRemark = "";
    await user.save();

    await logAudit({
      actor: req.user,
      action: "student.certificate.uploaded",
      entity: "document",
      entityId: `${req.user._id}:certificate:${index}`,
      summary: "Supporting certificate uploaded",
      details: { file: req.file.originalname, index }
    });

    res.json({
      file: req.file.originalname,
      fileData: fileUrl,
      verificationStatus: "Pending",
      verificationRemark: ""
    });
  }
);

router.get("/courses", async (req, res) => {
  const filter = { isActive: true, semester: req.user.semester };
  if (req.user.branch) filter.branch = req.user.branch;

  const [courses, enrollments, enrollmentCounts] = await Promise.all([
    Course.find(filter).populate("prerequisites", "code name").populate("instructor", "name"),
    Enrollment.find({ student: req.user._id, status: { $in: ["pending", "approved"] } }),
    Enrollment.aggregate([
      { $match: { status: { $in: ["pending", "approved"] } } },
      { $group: { _id: "$course", count: { $sum: 1 } } }
    ])
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
  if (sendValidationErrors(req, res)) return;

  const course = await Course.findById(req.body.courseId).populate("prerequisites");
  if (!course || !course.isActive) return res.status(404).json({ message: "Course not found" });

  const duplicate = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (duplicate?.status === "pending" || duplicate?.status === "approved") {
    return res.status(409).json({ message: "You already requested or enrolled in this course" });
  }

  const occupied = await Enrollment.countDocuments({ course: course._id, status: { $in: ["pending", "approved"] } });
  if (occupied >= course.capacity) return res.status(400).json({ message: "Course capacity is full" });

  const approved = await Enrollment.find({ student: req.user._id, status: "approved" }).select("course");
  const approvedIds = new Set(approved.map((item) => String(item.course)));
  const missing = course.prerequisites.filter((item) => !approvedIds.has(String(item._id)));
  if (missing.length) {
    return res.status(400).json({ message: `Prerequisite missing: ${missing.map((item) => item.code).join(", ")}` });
  }

  if (duplicate?.status === "rejected") {
    duplicate.status = "pending";
    duplicate.remarks = "";
    duplicate.approvedBy = undefined;
    duplicate.approvedAt = undefined;
    await duplicate.save();
    await logAudit({
      actor: req.user,
      action: "student.enrollment.re-requested",
      entity: "enrollment",
      entityId: duplicate._id,
      summary: `Enrollment request resubmitted for ${course.code}`
    });
    return res.status(201).json(await duplicate.populate("course", "code name credits"));
  }

  const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });
  await logAudit({
    actor: req.user,
    action: "student.enrollment.requested",
    entity: "enrollment",
    entityId: enrollment._id,
    summary: `Enrollment requested for ${course.code}`
  });
  res.status(201).json(await enrollment.populate("course", "code name credits"));
});

router.delete("/enrollments/:id", async (req, res) => {
  const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.user._id, status: "pending" });
  if (!enrollment) return res.status(404).json({ message: "Pending enrollment not found" });

  await enrollment.deleteOne();
  await logAudit({
    actor: req.user,
    action: "student.enrollment.withdrawn",
    entity: "enrollment",
    entityId: req.params.id,
    summary: "Pending enrollment request withdrawn"
  });

  res.json({ message: "Enrollment request withdrawn" });
});

router.put("/payments/:id/pay", async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, student: req.user._id },
    { status: "paid", paidAt: new Date(), paymentMode: req.body.paymentMode || "Online" },
    { new: true }
  );
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  await logAudit({
    actor: req.user,
    action: "student.payment.completed",
    entity: "payment",
    entityId: payment._id,
    summary: `${payment.label || payment.type} paid`
  });

  res.json(payment);
});

router.put("/notifications/read-all", async (req, res) => {
  const result = await Notification.updateMany(studentNotificationFilter(req.user._id), {
    $addToSet: { readBy: req.user._id }
  });

  await logAudit({
    actor: req.user,
    action: "student.notifications.read-all",
    entity: "notification",
    summary: "Marked all notifications as read"
  });

  res.json({ updated: result.modifiedCount });
});

router.put("/notifications/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, ...studentNotificationFilter(req.user._id) },
    { $addToSet: { readBy: req.user._id } },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });

  await logAudit({
    actor: req.user,
    action: "student.notification.read",
    entity: "notification",
    entityId: notification._id,
    summary: `Read notification: ${notification.title}`
  });

  res.json({ ...notification.toJSON(), isRead: true });
});

export default router;
