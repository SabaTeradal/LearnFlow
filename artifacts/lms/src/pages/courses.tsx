import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Circle,
  BookOpen,
  Loader2,
} from "lucide-react";
import { SiReact, SiNodedotjs, SiPostgresql, SiJavascript, SiSpring } from "react-icons/si";
import { useGetCourse } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
}

const LEVEL_ICONS: Record<number, React.ReactNode> = {
  1: <SiReact className="h-5 w-5 text-[#61DAFB]" />,
  2: <SiSpring className="h-5 w-5 text-[#6DB33F]" />,
  3: <SiPostgresql className="h-5 w-5 text-[#336791]" />,
};

const LEVEL_COLORS: Record<number, string> = {
  1: "text-[#61DAFB] bg-[#61DAFB]/10",
  2: "text-[#6DB33F] bg-[#6DB33F]/10",
  3: "text-[#336791] bg-[#336791]/10",
};

export default function CoursesPage() {
  const [, setLocation] = useLocation();
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));

  const { data: course, isLoading } = useGetCourse(1, {
    query: { queryKey: ["getCourse", 1] as const },
  });

  const toggleLevel = (levelId: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground text-sm">
            Your structured path from frontend to databases.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="space-y-2 mt-4">
                  {[1, 2, 3].map((j) => <Skeleton key={j} className="h-12 w-full rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {course?.levels
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((level, idx) => {
                const isExpanded = expandedLevels.has(level.id);
                const levelNum = idx + 1;
                const colorCls = LEVEL_COLORS[levelNum] ?? "text-primary bg-primary/10";

                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                    data-testid={`level-card-${level.id}`}
                  >
                    {/* Level Header */}
                    <button
                      className="w-full p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => toggleLevel(level.id)}
                      data-testid={`button-toggle-level-${level.id}`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                        {LEVEL_ICONS[levelNum] ?? <BookOpen className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm">{level.title}</p>
                          <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">
                            {Math.round(level.progressPercent)}%
                          </span>
                        </div>
                        <ProgressBar value={level.progressPercent} />
                        <p className="text-xs text-muted-foreground">
                          {level.videos.filter((v) => v.completed).length} / {level.videos.length} videos
                        </p>
                      </div>

                      <div className="ml-2 flex-shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>

                    {/* Video List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="p-3 space-y-1">
                            {level.videos
                              .slice()
                              .sort((a, b) => a.order - b.order)
                              .map((video) => (
                                <div
                                  key={video.id}
                                  className="group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => setLocation(`/courses/1/video/${video.id}`)}
                                  data-testid={`video-item-${video.id}`}
                                >
                                  <div className="flex-shrink-0">
                                    {video.completed ? (
                                      <CheckCircle2 className="h-5 w-5 text-primary" />
                                    ) : video.progressPercent > 0 ? (
                                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${video.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                      {video.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-muted-foreground">{video.duration}</span>
                                      {video.progressPercent > 0 && !video.completed && (
                                        <div className="flex-1 max-w-24">
                                          <ProgressBar value={video.progressPercent} />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant={video.completed ? "outline" : "default"}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 text-xs h-7 px-2.5"
                                    data-testid={`button-play-video-${video.id}`}
                                  >
                                    <Play className="h-3 w-3" />
                                    {video.completed ? "Rewatch" : video.progressPercent > 0 ? "Resume" : "Start"}
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
