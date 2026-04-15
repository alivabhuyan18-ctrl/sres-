import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["semester", "hostel", "library", "exam", "misc"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
    reference: { type: String, required: true },
    paidAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
