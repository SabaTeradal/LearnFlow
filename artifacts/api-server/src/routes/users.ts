import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.patch("/users/profile", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const updates: Partial<{ name: string; email: string; theme: string }> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;
    if (parsed.data.theme !== undefined) updates.theme = parsed.data.theme;

    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    return res.status(200).json({ id: user.id, name: user.name, email: user.email, theme: user.theme, createdAt: user.createdAt });
  } catch (err) {
    logger.error({ err }, "updateProfile error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
