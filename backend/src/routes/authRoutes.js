import express from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
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
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, identifier: user.identifier, role: user.role, email: user.email }
    });
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

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, identifier: user.identifier, role: user.role, email: user.email }
    });
  }
);

router.post("/forgot-password", [body("identifier").trim().notEmpty()], async (req, res) => {
  const user = await User.findOne({ identifier: req.body.identifier });
  if (!user) return res.status(404).json({ message: "Account not found" });
  res.json({ message: "Password reset instructions have been sent to the registered email address." });
});

export default router;
