import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["semester", "hostel", "library", "registration", "misc"], required: true },
    label: { type: String, default: "" },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
    reference: { type: String, required: true },
    paymentMode: { type: String, default: "Online" },
    paidAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
