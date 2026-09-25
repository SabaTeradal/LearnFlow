import { motion } from "framer-motion";
import {
  Trophy,
  Monitor,
  Server,
  Cpu,
  Database,
  Zap,
  GraduationCap,
  Code,
  Lock,
} from "lucide-react";
import { useGetAchievements } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_MAP: Record<string, React.ReactNode> = {
  Code: <Code className="h-6 w-6" />,
  Monitor: <Monitor className="h-6 w-6" />,
  Server: <Server className="h-6 w-6" />,
  Cpu: <Cpu className="h-6 w-6" />,
  Database: <Database className="h-6 w-6" />,
  DatabaseZap: <Zap className="h-6 w-6" />,
  Trophy: <Trophy className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
};

const BADGE_COLORS = [
  { earned: "from-[#61DAFB]/20 to-[#61DAFB]/5 border-[#61DAFB]/30 text-[#61DAFB]", glow: "shadow-[0_0_20px_rgba(97,218,251,0.25)]" },
  { earned: "from-primary/20 to-primary/5 border-primary/30 text-primary", glow: "shadow-[0_0_20px_rgba(0,200,220,0.25)]" },
  { earned: "from-[#6DB33F]/20 to-[#6DB33F]/5 border-[#6DB33F]/30 text-[#6DB33F]", glow: "shadow-[0_0_20px_rgba(109,179,63,0.25)]" },
  { earned: "from-[#FF8C00]/20 to-[#FF8C00]/5 border-[#FF8C00]/30 text-[#FF8C00]", glow: "shadow-[0_0_20px_rgba(255,140,0,0.25)]" },
  { earned: "from-[#336791]/20 to-[#336791]/5 border-[#336791]/30 text-[#336791]", glow: "shadow-[0_0_20px_rgba(51,103,145,0.25)]" },
  { earned: "from-[#9B59B6]/20 to-[#9B59B6]/5 border-[#9B59B6]/30 text-[#9B59B6]", glow: "shadow-[0_0_20px_rgba(155,89,182,0.25)]" },
  { earned: "from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/30 text-[#FFD700]", glow: "shadow-[0_0_20px_rgba(255,215,0,0.25)]" },
  { earned: "from-[#E74C3C]/20 to-[#E74C3C]/5 border-[#E74C3C]/30 text-[#E74C3C]", glow: "shadow-[0_0_20px_rgba(231,76,60,0.25)]" },
];

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useGetAchievements();

  const earnedCount = achievements?.filter((a) => a.earned).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Loading..." : `${earnedCount} of ${totalCount} badges earned — keep learning to unlock more.`}
          </p>
        </div>

        {/* Stats bar */}
        {!isLoading && (
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        )}

        {/* Badge Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements?.map((achievement, i) => {
              const colors = BADGE_COLORS[i % BADGE_COLORS.length];
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                  className={`relative rounded-xl border p-5 flex flex-col items-center text-center gap-3 transition-all duration-300 ${
                    achievement.earned
                      ? `bg-gradient-to-b ${colors.earned} ${colors.glow}`
                      : "bg-card border-border opacity-50 grayscale"
                  }`}
                  data-testid={`achievement-badge-${achievement.id}`}
                >
                  {!achievement.earned && (
                    <div className="absolute top-3 right-3">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}

                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                    achievement.earned ? colors.earned : "bg-muted text-muted-foreground"
                  }`}>
                    {ICON_MAP[achievement.icon] ?? <Trophy className="h-6 w-6" />}
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{achievement.description}</p>
                  </div>

                  {achievement.earned && achievement.earnedAt && (
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(achievement.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
