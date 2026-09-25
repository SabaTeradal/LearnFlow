import { Router } from "express";
import { db, coursesTable, levelsTable, videosTable, videoProgressTable, quizResultsTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;

  try {
    // Get all videos
    const allVideos = await db.select().from(videosTable);
    const videoIds = allVideos.map((v) => v.id);

    // Get user's video progress
    let progressRows: typeof videoProgressTable.$inferSelect[] = [];
    if (videoIds.length > 0) {
      progressRows = await db
        .select()
        .from(videoProgressTable)
        .where(and(eq(videoProgressTable.userId, userId), inArray(videoProgressTable.videoId, videoIds)));
    }

    const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));
    const totalVideos = allVideos.length;
    const completedVideos = allVideos.filter((v) => progressMap.get(v.id)?.completed).length;
    const overallProgressPercent = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

    // Get last watched video (most recently updated progress)
    const sortedProgress = progressRows
      .filter((p) => p.progressPercent > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    let lastWatched = null;
    if (sortedProgress.length > 0) {
      const lastProgress = sortedProgress[0];
      const video = allVideos.find((v) => v.id === lastProgress.videoId);
      if (video) {
        const allLevels = await db.select().from(levelsTable).where(eq(levelsTable.id, video.levelId)).limit(1);
        const level = allLevels[0];
        const allCourses = level
          ? await db.select().from(coursesTable).where(eq(coursesTable.id, level.courseId)).limit(1)
          : [];
        const course = allCourses[0];

        lastWatched = {
          videoId: video.id,
          videoTitle: video.title,
          levelTitle: level?.title ?? "Unknown",
          courseId: course?.id ?? 1,
          progressPercent: lastProgress.progressPercent,
        };
      }
    }

    // Get recent achievements
    const earnedRows = await db
      .select()
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId))
      .orderBy(desc(userAchievementsTable.earnedAt))
      .limit(3);

    const recentAchievements = [];
    for (const earned of earnedRows) {
      const [achievement] = await db.select().from(achievementsTable).where(eq(achievementsTable.id, earned.achievementId)).limit(1);
      if (achievement) {
        recentAchievements.push({
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          earnedAt: earned.earnedAt.toISOString(),
        });
      }
    }

    // Get improvements (quiz results with score < 70%)
    const quizResults = await db
      .select()
      .from(quizResultsTable)
      .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.passed, false)))
      .orderBy(desc(quizResultsTable.createdAt))
      .limit(5);

    const improvements = quizResults.map((r) => ({
      videoId: r.videoId,
      videoTitle: r.videoTitle,
      levelTitle: r.levelTitle,
      score: r.score,
      totalQuestions: r.totalQuestions,
    }));

    return res.status(200).json({
      overallProgressPercent,
      lastWatched,
      recentAchievements,
      improvements,
    });
  } catch (err) {
    logger.error({ err }, "getDashboardSummary error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
