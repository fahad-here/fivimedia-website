import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(5000),
});

interface ContactResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Validate request body
    const parseResult = contactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid input",
      });
    }

    const { name, email, message } = parseResult.data;

    // Save to database
    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
      },
    });

    // Send email notification
    // Configure transporter based on environment
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Only send email if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || "support@fivimedia.com",
        subject: `New Contact Form Submission from ${name}`,
        text: `
Name: ${name}
Email: ${email}

Message:
${message}
        `,
        html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
}
