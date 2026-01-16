import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    // Create new user
    try {
      const { email, name, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          password: hashedPassword,
          role: "admin",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  if (req.method === "PUT") {
    // Update user
    try {
      const { id, name, newPassword } = req.body;

      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const updateData: { name?: string; password?: string } = {};

      if (name !== undefined) {
        updateData.name = name || null;
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        updateData.password = await hash(newPassword, 12);
      }

      await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }

  if (req.method === "DELETE") {
    // Delete user
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Prevent deleting yourself
      const userToDelete = await prisma.user.findUnique({
        where: { id },
        select: { email: true },
      });

      if (userToDelete?.email === session.user?.email) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      // Check if this is the last admin
      const adminCount = await prisma.user.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin user" });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
