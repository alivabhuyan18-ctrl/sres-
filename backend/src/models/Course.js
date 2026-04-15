import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
    semester: { type: Number, required: true },
    department: { type: String, default: "Computer Science" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
