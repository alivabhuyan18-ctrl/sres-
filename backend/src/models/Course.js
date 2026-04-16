import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
    semester: { type: Number, required: true, min: 1, max: 12 },
    department: { type: String, default: "Computer Science", trim: true },
    branch: { type: String, default: "CSE", trim: true },
    category: { type: String, default: "Professional Core", trim: true },
    courseKind: { type: String, enum: ["theory", "lab"], default: "theory" },
    schedule: {
      days: { type: String, default: "", trim: true },
      time: { type: String, default: "", trim: true },
      room: { type: String, default: "", trim: true }
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
