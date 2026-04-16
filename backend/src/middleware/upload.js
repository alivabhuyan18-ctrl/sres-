import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const avatarDir = path.join(uploadsRoot, "avatars");
const documentDir = path.join(uploadsRoot, "documents");

[uploadsRoot, avatarDir, documentDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const target = req.path.includes("avatar") ? avatarDir : documentDir;
    callback(null, target);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-");
    callback(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const fileFilter = (req, file, callback) => {
  const allowed = req.path.includes("avatar")
    ? ["image/jpeg", "image/png", "image/webp"]
    : ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    callback(new Error(req.path.includes("avatar") ? "Profile photos must be JPG, PNG, or WEBP images." : "Only JPG, PNG, WEBP, and PDF files are allowed"));
    return;
  }
  callback(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});
