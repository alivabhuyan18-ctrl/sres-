import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    totalClasses: { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 }
  },
  { timestamps: true }
);

attendanceSchema.virtual("percentage").get(function percentage() {
  return this.totalClasses ? Math.round((this.attendedClasses / this.totalClasses) * 100) : 0;
});

attendanceSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Attendance", attendanceSchema);
