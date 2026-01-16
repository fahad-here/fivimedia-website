import prisma from "./prisma";
import { Prisma } from "../../prisma/generated/prisma/client";

// Re-export utilities for backwards compatibility in server-side code
export {
  formatAuditAction,
  formatAuditEntity,
  createChanges,
} from "./audit-utils";

export interface AuditLogInput {
  userId: string;
  userEmail: string;
  action: "create" | "update" | "delete";
  entity: "order" | "pricing" | "user" | "promo_code" | "state" | "lead" | "faq" | "faq_category";
  entityId: string;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
}

/**
 * Log an audit trail entry for admin actions
 * This is a fire-and-forget operation - errors are logged but don't block the main operation
 */
export async function logAudit({
  userId,
  userEmail,
  action,
  entity,
  entityId,
  changes,
}: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        entity,
        entityId,
        changes: changes ? (changes as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not block main operations
    console.error("Failed to create audit log:", error);
  }
}
