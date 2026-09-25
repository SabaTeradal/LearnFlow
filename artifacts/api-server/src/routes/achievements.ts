import { Router } from "express";
import { db, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/achievements", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;

  try {
    const allAchievements = await db.select().from(achievementsTable);
    const earnedRows = await db
      .select()
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId));

    const earnedMap = new Map(earnedRows.map((e) => [e.achievementId, e.earnedAt]));

    const result = allAchievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      condition: a.condition,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.has(a.id) ? earnedMap.get(a.id)!.toISOString() : null,
    }));

    return res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, "getAchievements error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
