import crypto from "crypto";
import express from "express";
import { body, validationResult } from "express-validator";
import { logAudit } from "../utils/audit.js";
import { sendMail } from "../utils/mail.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { signToken } from "../utils/token.js";

const router = express.Router();

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed", errors: errors.array() });
    return true;
  }
  return false;
};

const authPayload = (user) => ({
  token: signToken(user),
  user: { id: user._id, name: user.name, identifier: user.identifier, role: user.role, email: user.email }
});

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("identifier").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["student", "faculty", "admin"])
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    const exists = await User.findOne({ $or: [{ email: req.body.email }, { identifier: req.body.identifier }] });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const user = await User.create(req.body);
    await logAudit({
      actor: user,
      action: "auth.register",
      entity: "user",
      entityId: user._id,
      summary: `New ${user.role} account created`
    });
    res.status(201).json(authPayload(user));
  }
);

router.post(
  "/login",
  [body("identifier").trim().notEmpty(), body("password").notEmpty(), body("role").isIn(["student", "faculty", "admin"])],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;
    const { identifier, password, role } = req.body;
    const user = await User.findOne({ identifier, role });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials for selected role" });
    }

    await logAudit({
      actor: user,
      action: "auth.login",
      entity: "user",
      entityId: user._id,
      summary: `${user.role} login successful`
    });
    res.json(authPayload(user));
  }
);

router.post("/forgot-password", [body("identifier").trim().notEmpty()], async (req, res) => {
  if (sendValidationErrors(req, res)) return;
  const user = await User.findOne({ identifier: req.body.identifier });
  const genericMessage = "If an account matches that identifier, password reset instructions have been sent.";
  if (!user) return res.json({ message: genericMessage, emailSent: false, smtpConfigured: Boolean(process.env.SMTP_HOST) });

  const rawToken = crypto.randomBytes(24).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/login?mode=reset&token=${rawToken}`;
  const mailResult = await sendMail({
    to: user.email,
    subject: "Reset your Student Registration and Enrolment System password",
    text: `Hello ${user.name},\n\nUse this link to reset your password: ${resetLink}\nThis link expires in 15 minutes.`,
    html: `<p>Hello ${user.name},</p><p>Use the link below to reset your password.</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 15 minutes.</p>`
  });
  await logAudit({
    actor: user,
    action: "auth.reset.requested",
    entity: "user",
    entityId: user._id,
    summary: "Password reset requested"
  });
  res.json({
    message: genericMessage,
    emailSent: Boolean(process.env.SMTP_HOST),
    smtpConfigured: Boolean(process.env.SMTP_HOST),
    previewAvailable: !process.env.SMTP_HOST && Boolean(mailResult.preview),
    expiresAt: user.resetPasswordExpires
  });
});

router.post(
  "/reset-password",
  [body("token").trim().notEmpty(), body("password").isLength({ min: 6 }), body("confirmPassword").custom((value, { req }) => value === req.body.password)],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Reset link is invalid or has expired" });

    user.password = req.body.password;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();
    await logAudit({
      actor: user,
      action: "auth.reset.completed",
      entity: "user",
      entityId: user._id,
      summary: "Password reset completed"
    });

    res.json({ message: "Password reset successful. Please sign in with your new password." });
  }
);

router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.newPassword)
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (req.body.currentPassword === req.body.newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    user.password = req.body.newPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();
    await logAudit({
      actor: user,
      action: "auth.password.changed",
      entity: "user",
      entityId: user._id,
      summary: "Password changed from settings"
    });

    res.json({ message: "Password changed successfully" });
  }
);

export default router;
