import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

interface ValidateResponse {
  valid: boolean;
  error?: string;
  discount?: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    discountAmount: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidateResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: "Promo code is required" });
    }

    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({ valid: false, error: "Invalid order total" });
    }

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return res.status(200).json({ valid: false, error: "Invalid promo code" });
    }

    // Check if active
    if (!promoCode.isActive) {
      return res.status(200).json({ valid: false, error: "This promo code is no longer active" });
    }

    // Check expiration
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return res.status(200).json({ valid: false, error: "This promo code has expired" });
    }

    // Check usage limit
    if (promoCode.usageLimit !== null && promoCode.usedCount >= promoCode.usageLimit) {
      return res.status(200).json({ valid: false, error: "This promo code has reached its usage limit" });
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount !== null && orderTotal < promoCode.minOrderAmount) {
      return res.status(200).json({
        valid: false,
        error: `Minimum order amount of $${promoCode.minOrderAmount} required`,
      });
    }

    // Calculate discount
    let discountAmount: number;
    if (promoCode.type === "percentage") {
      discountAmount = Math.round((orderTotal * promoCode.value) / 100 * 100) / 100;
    } else {
      discountAmount = Math.min(promoCode.value, orderTotal);
    }

    return res.status(200).json({
      valid: true,
      discount: {
        code: promoCode.code,
        type: promoCode.type as "percentage" | "fixed",
        value: promoCode.value,
        discountAmount,
      },
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return res.status(500).json({ valid: false, error: "Failed to validate promo code" });
  }
}
