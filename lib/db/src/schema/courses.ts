import { pgTable, serial, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const levelsTable = pgTable("levels", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  levelId: integer("level_id").notNull().references(() => levelsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration").notNull().default("10:00"),
  order: integer("order").notNull(),
  youtubeId: text("youtube_id"),
});

export const videoProgressTable = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  videoId: integer("video_id").notNull().references(() => videosTable.id),
  completed: boolean("completed").notNull().default(false),
  progressPercent: real("progress_percent").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  videoId: integer("video_id").notNull().references(() => videosTable.id),
  videoTitle: text("video_title").notNull(),
  levelTitle: text("level_title").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  condition: text("condition").notNull(),
});

export const userAchievementsTable = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  achievementId: integer("achievement_id").notNull().references(() => achievementsTable.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export type Course = typeof coursesTable.$inferSelect;
export type Level = typeof levelsTable.$inferSelect;
export type Video = typeof videosTable.$inferSelect;
export type VideoProgress = typeof videoProgressTable.$inferSelect;
export type QuizResult = typeof quizResultsTable.$inferSelect;
export type Achievement = typeof achievementsTable.$inferSelect;
export type UserAchievement = typeof userAchievementsTable.$inferSelect;
