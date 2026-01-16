import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "@/lib/prisma";

const customerInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  country: z.string().min(1, "Country is required"),
  businessName: z.string().min(1, "Business name is required"),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  stateCode: z.string().length(2, "Invalid state code"),
  addOnSlugs: z.array(z.string()),
  customerInfo: customerInfoSchema,
  promoCode: z.string().optional().nullable(),
});

interface OrderResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Validate request body
    const parseResult = orderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid input",
      });
    }

    const { stateCode, addOnSlugs, customerInfo, promoCode } = parseResult.data;

    // Fetch state from database
    const state = await prisma.state.findUnique({
      where: { code: stateCode },
    });

    if (!state) {
      return res.status(400).json({
        success: false,
        error: "Invalid state",
      });
    }

    // Fetch add-ons from database
    const addOns = await prisma.addOn.findMany({
      where: {
        slug: { in: addOnSlugs },
        isActive: true,
      },
    });

    // Calculate total server-side (never trust client)
    const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);
    const subtotal = state.basePrice + addOnsTotal;
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    // Validate and apply promo code if provided
    if (promoCode) {
      const promoCodeRecord = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (promoCodeRecord && promoCodeRecord.isActive) {
        // Check expiration
        const isExpired = promoCodeRecord.expiresAt && new Date() > promoCodeRecord.expiresAt;
        // Check usage limit
        const isOverLimit = promoCodeRecord.usageLimit !== null &&
          promoCodeRecord.usedCount >= promoCodeRecord.usageLimit;
        // Check minimum order amount
        const meetsMinium = promoCodeRecord.minOrderAmount === null ||
          subtotal >= promoCodeRecord.minOrderAmount;

        if (!isExpired && !isOverLimit && meetsMinium) {
          // Calculate discount
          if (promoCodeRecord.type === "percentage") {
            discountAmount = Math.round((subtotal * promoCodeRecord.value) / 100 * 100) / 100;
          } else {
            discountAmount = Math.min(promoCodeRecord.value, subtotal);
          }
          appliedPromoCode = promoCodeRecord.code;

          // Increment usage count
          await prisma.promoCode.update({
            where: { id: promoCodeRecord.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const total = subtotal - discountAmount;

    // Create order in database with initial status history
    const order = await prisma.order.create({
      data: {
        stateCode: state.code,
        customerInfo: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          country: customerInfo.country,
          businessName: customerInfo.businessName,
          notes: customerInfo.notes || "",
        },
        addOns: addOns.map((a) => a.slug),
        basePrice: state.basePrice,
        addOnTotal: addOnsTotal,
        discountAmount,
        promoCode: appliedPromoCode,
        total,
        status: "pending",
        // Create initial status history entry
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "pending",
            changedBy: "system",
            changedByEmail: null,
            note: "Order created",
          },
        },
      },
    });

    // Use first 10 chars of cuid as display order ID
    const displayOrderId = order.id.slice(0, 10).toUpperCase();

    return res.status(200).json({
      success: true,
      orderId: displayOrderId,
    });
  } catch (error) {
    console.error("Order API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create order. Please try again.",
    });
  }
}
