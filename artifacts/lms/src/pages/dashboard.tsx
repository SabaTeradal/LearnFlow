import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play, Trophy, AlertTriangle, TrendingUp, ChevronRight, BookOpen } from "lucide-react";
import { useGetDashboardSummary, useGetCourses } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();

  const isLoading = summaryLoading || coursesLoading;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <AppLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span className="text-primary">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-muted-foreground text-sm">Here's where you stand today.</p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Overall Progress</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {Math.round(summary?.overallProgressPercent ?? 0)}%
              </span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-2 w-full rounded-full" />
          ) : (
            <ProgressBar value={summary?.overallProgressPercent ?? 0} />
          )}
          <p className="text-xs text-muted-foreground">
            {courses?.reduce((sum, c) => sum + c.completedVideos, 0) ?? 0} of{" "}
            {courses?.reduce((sum, c) => sum + c.totalVideos, 0) ?? 0} videos completed across all levels
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resume Last Video */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Continue Learning</span>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-9 w-32" />
              </div>
            ) : summary?.lastWatched ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{summary.lastWatched.videoTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{summary.lastWatched.levelTitle}</p>
                </div>
                <ProgressBar value={summary.lastWatched.progressPercent} />
                <Button
                  size="sm"
                  onClick={() =>
                    setLocation(`/courses/${summary.lastWatched!.courseId}/video/${summary.lastWatched!.videoId}`)
                  }
                  className="gap-2"
                  data-testid="button-resume-video"
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">You haven't started any videos yet.</p>
                <Button size="sm" onClick={() => setLocation("/courses")} className="gap-2" data-testid="button-start-learning">
                  <BookOpen className="h-3.5 w-3.5" />
                  Start learning
                </Button>
              </div>
            )}
          </motion.div>

          {/* Recent Achievements */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recent Achievements</span>
              </div>
              <button
                onClick={() => setLocation("/achievements")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                data-testid="link-view-achievements"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : summary?.recentAchievements && summary.recentAchievements.length > 0 ? (
              <div className="space-y-2">
                {summary.recentAchievements.map((ach) => (
                  <div key={ach.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ach.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ach.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Complete quizzes to earn badges</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Course Overview Cards */}
        {!coursesLoading && courses && courses.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Your Courses</h2>
            <div className="grid grid-cols-1 gap-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setLocation("/courses")}
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{course.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {course.completedVideos} / {course.totalVideos} videos
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">{Math.round(course.progressPercent)}%</span>
                  </div>
                  <ProgressBar value={course.progressPercent} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Improvements Section */}
        {!isLoading && summary?.improvements && summary.improvements.length > 0 && (
          <motion.div variants={itemVariants} className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Areas to Improve</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You scored below 70% on these topics. Review them to strengthen your understanding.
            </p>
            <div className="space-y-2">
              {summary.improvements.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  data-testid={`improvement-item-${item.videoId}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.videoTitle}</p>
                    <p className="text-xs text-muted-foreground">{item.levelTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">
                      {item.score}/{item.totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((item.score / item.totalQuestions) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
