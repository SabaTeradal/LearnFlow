import { Router } from "express";
import { db, coursesTable, levelsTable, videosTable, videoProgressTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { UpdateVideoProgressBody, UpdateVideoProgressParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/courses", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;

  try {
    const courses = await db.select().from(coursesTable);
    const allLevels = await db.select().from(levelsTable);
    const allVideos = await db.select().from(videosTable);
    const levelIds = allLevels.map((l) => l.id);
    const videoIds = allVideos.map((v) => v.id);

    let progressRows: typeof videoProgressTable.$inferSelect[] = [];
    if (videoIds.length > 0) {
      progressRows = await db
        .select()
        .from(videoProgressTable)
        .where(and(eq(videoProgressTable.userId, userId), inArray(videoProgressTable.videoId, videoIds)));
    }

    const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));

    const result = courses.map((course) => {
      const courseLevels = allLevels.filter((l) => l.courseId === course.id);
      const courseVideoIds = allVideos.filter((v) => courseLevels.some((l) => l.id === v.levelId)).map((v) => v.id);
      const totalVideos = courseVideoIds.length;
      const completedVideos = courseVideoIds.filter((id) => progressMap.get(id)?.completed).length;
      const progressPercent = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        totalVideos,
        completedVideos,
        progressPercent,
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, "getCourses error");
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/courses/:courseId", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const courseId = Number.parseInt(String(req.params.courseId), 10);

  if (isNaN(courseId)) return res.status(400).json({ error: "Invalid courseId" });

  try {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const levels = await db.select().from(levelsTable).where(eq(levelsTable.courseId, courseId));
    const levelIds = levels.map((l) => l.id);
    const videos = levelIds.length > 0
      ? await db.select().from(videosTable).where(inArray(videosTable.levelId, levelIds))
      : [];

    const videoIds = videos.map((v) => v.id);
    let progressRows: typeof videoProgressTable.$inferSelect[] = [];
    if (videoIds.length > 0) {
      progressRows = await db
        .select()
        .from(videoProgressTable)
        .where(and(eq(videoProgressTable.userId, userId), inArray(videoProgressTable.videoId, videoIds)));
    }
    const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));

    const levelsWithVideos = levels
      .sort((a, b) => a.order - b.order)
      .map((level) => {
        const levelVideos = videos
          .filter((v) => v.levelId === level.id)
          .sort((a, b) => a.order - b.order)
          .map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description ?? null,
            duration: v.duration,
            order: v.order,
            completed: progressMap.get(v.id)?.completed ?? false,
            progressPercent: progressMap.get(v.id)?.progressPercent ?? 0,
            youtubeId: v.youtubeId ?? null,
          }));

        const totalVideos = levelVideos.length;
        const completedVideos = levelVideos.filter((v) => v.completed).length;
        const progressPercent = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

        return {
          id: level.id,
          title: level.title,
          order: level.order,
          progressPercent,
          videos: levelVideos,
        };
      });

    const totalVideos = videos.length;
    const completedVideos = videos.filter((v) => progressMap.get(v.id)?.completed).length;
    const progressPercent = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

    return res.status(200).json({
      id: course.id,
      title: course.title,
      description: course.description,
      progressPercent,
      levels: levelsWithVideos,
    });
  } catch (err) {
    logger.error({ err }, "getCourse error");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/courses/:courseId/levels/:levelId/videos/:videoId/progress", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const videoId = Number.parseInt(String(req.params.videoId), 10);

  if (isNaN(videoId)) return res.status(400).json({ error: "Invalid videoId" });

  const parsed = UpdateVideoProgressBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { completed, progressPercent } = parsed.data;

  try {
    const existing = await db
      .select()
      .from(videoProgressTable)
      .where(and(eq(videoProgressTable.userId, userId), eq(videoProgressTable.videoId, videoId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(videoProgressTable)
        .set({ completed, progressPercent, updatedAt: new Date() })
        .where(and(eq(videoProgressTable.userId, userId), eq(videoProgressTable.videoId, videoId)))
        .returning();
      return res.status(200).json({ videoId, completed: updated.completed, progressPercent: updated.progressPercent });
    } else {
      const [created] = await db
        .insert(videoProgressTable)
        .values({ userId, videoId, completed, progressPercent })
        .returning();
      return res.status(200).json({ videoId, completed: created.completed, progressPercent: created.progressPercent });
    }
  } catch (err) {
    logger.error({ err }, "updateVideoProgress error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
