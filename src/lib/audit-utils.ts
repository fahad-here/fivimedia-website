/**
 * Format action for display
 */
export function formatAuditAction(action: string): string {
  switch (action) {
    case "create":
      return "Created";
    case "update":
      return "Updated";
    case "delete":
      return "Deleted";
    default:
      return action;
  }
}

/**
 * Format entity for display
 */
export function formatAuditEntity(entity: string): string {
  switch (entity) {
    case "order":
      return "Order";
    case "pricing":
      return "Pricing";
    case "user":
      return "User";
    case "promo_code":
      return "Promo Code";
    case "state":
      return "State";
    case "lead":
      return "Lead";
    case "faq":
      return "FAQ";
    case "faq_category":
      return "FAQ Category";
    default:
      return entity;
  }
}

/**
 * Helper to create a changes object for field updates
 */
export function createChanges(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> | undefined {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of fields) {
    if (oldValues[field] !== newValues[field]) {
      changes[field] = {
        from: oldValues[field],
        to: newValues[field],
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}
