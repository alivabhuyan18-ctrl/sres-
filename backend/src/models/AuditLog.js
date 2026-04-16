import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
