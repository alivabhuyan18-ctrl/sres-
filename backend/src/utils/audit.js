import AuditLog from "../models/AuditLog.js";

export const logAudit = async ({ actor, action, entity, entityId = "", summary = "", details = {} }) => {
  try {
    await AuditLog.create({
      actor: actor?._id,
      actorName: actor?.name || "",
      actorRole: actor?.role || "",
      action,
      entity,
      entityId: entityId ? String(entityId) : "",
      summary,
      details
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
};
