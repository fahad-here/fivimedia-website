import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface OrderResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderResponse>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid order ID" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    // Get current order status for history
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const oldStatus = currentOrder.status;

    // Only update if status actually changed
    if (oldStatus !== status) {
      // Update order and create status history entry in a transaction
      await prisma.$transaction([
        prisma.order.update({
          where: { id },
          data: { status },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: oldStatus,
            toStatus: status,
            changedBy: session.user?.id || "unknown",
            changedByEmail: session.user?.email || null,
          },
        }),
      ]);

      // Log to audit trail
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "update",
        entity: "order",
        entityId: id,
        changes: {
          status: { from: oldStatus, to: status },
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Order update API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update order",
    });
  }
}
