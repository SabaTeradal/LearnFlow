import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trophy,
} from "lucide-react";
import {
  useGetCourse,
  useUpdateVideoProgress,
  useGenerateQuiz,
  useSubmitQuiz,
  getGetCourseQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
};

type Quiz = {
  videoId: number;
  questions: QuizQuestion[];
};

type QuizResult = {
  score: number;
  totalQuestions: number;
  passed: boolean;
  feedback: string;
  needsImprovement: boolean;
  answers: number[];
};

export default function VideoPlayerPage() {
  const params = useParams<{ courseId: string; videoId: string }>();
  const courseId = parseInt(params.courseId ?? "1");
  const videoId = parseInt(params.videoId ?? "1");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const { data: course, isLoading } = useGetCourse(courseId, {
    query: { queryKey: getGetCourseQueryKey(courseId) },
  });

  const video = course?.levels.flatMap((l) => l.videos).find((v) => v.id === videoId);
  const level = course?.levels.find((l) => l.videos.some((v) => v.id === videoId));

  const updateProgress = useUpdateVideoProgress();
  const generateQuizMutation = useGenerateQuiz();
  const submitQuizMutation = useSubmitQuiz();

  const handleMarkComplete = () => {
    if (!level) return;
    updateProgress.mutate(
      {
        courseId,
        levelId: level.id,
        videoId,
        data: { completed: true, progressPercent: 100 },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
          toast({ title: "Video marked complete" });
        },
      }
    );
  };

  const handleGenerateQuiz = () => {
    if (!video || !level) return;
    setQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});
    generateQuizMutation.mutate(
      { data: { videoId, videoTitle: video.title, levelTitle: level.title } },
      {
        onSuccess: (data) => {
          setQuiz(data as Quiz);
        },
        onError: () => {
          toast({ title: "Failed to generate quiz", variant: "destructive" });
        },
      }
    );
  };

  const handleSubmitQuiz = () => {
    if (!quiz || !video) return;
    const answers = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? -1,
    }));

    submitQuizMutation.mutate(
      { data: { videoId, videoTitle: video.title, answers } },
      {
        onSuccess: (data) => {
          setQuizResult({
            ...(data as any),
            answers: quiz.questions.map((q) => selectedAnswers[q.id] ?? -1),
          });
          queryClient.invalidateQueries({ queryKey: ["getDashboardSummary"] });
        },
        onError: () => {
          toast({ title: "Failed to submit quiz", variant: "destructive" });
        },
      }
    );
  };

  const allAnswered = quiz ? quiz.questions.every((q) => selectedAnswers[q.id] !== undefined) : false;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </AppLayout>
    );
  }

  if (!video || !level) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Video not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/courses")}>
            Back to Courses
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back nav */}
        <button
          onClick={() => setLocation("/courses")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back-courses"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </button>

        {/* Video Info */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">{level.title}</p>
          <h1 className="text-xl font-bold text-foreground">{video.title}</h1>
          {video.description && <p className="text-sm text-muted-foreground mt-1">{video.description}</p>}
        </div>

        {/* Video Player */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border">
          {video.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/10">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Play className="h-8 w-8 text-primary ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">Video player — {video.duration}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {video.completed ? (
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkComplete}
              disabled={updateProgress.isPending}
              data-testid="button-mark-complete"
            >
              {updateProgress.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
              Mark as complete
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleGenerateQuiz}
            disabled={generateQuizMutation.isPending}
            data-testid="button-generate-quiz"
          >
            {generateQuizMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Auto-Generate Quiz
          </Button>
        </div>

        {/* Quiz Section */}
        <AnimatePresence>
          {quiz && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-card border border-border rounded-xl p-6 space-y-6"
              data-testid="quiz-panel"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Knowledge Check</h2>
                <span className="text-xs text-muted-foreground">{quiz.questions.length} questions</span>
              </div>

              {!quizResult ? (
                <>
                  <div className="space-y-6">
                    {quiz.questions.map((q, qi) => (
                      <div key={q.id} className="space-y-3" data-testid={`quiz-question-${q.id}`}>
                        <p className="text-sm font-medium text-foreground">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
                                selectedAnswers[q.id] === oi
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              }`}
                              data-testid={`quiz-option-${q.id}-${oi}`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered || submitQuizMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-quiz"
                  >
                    {submitQuizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Answers
                  </Button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Score Summary */}
                  <div className={`rounded-xl p-5 flex items-center gap-4 ${quizResult.passed ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"}`}>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${quizResult.passed ? "bg-primary/20" : "bg-destructive/20"}`}>
                      {quizResult.passed ? (
                        <Trophy className="h-6 w-6 text-primary" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{quizResult.feedback}</p>
                      {quizResult.needsImprovement && (
                        <p className="text-xs text-destructive mt-1">
                          Added to your Improvements section on Dashboard.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Per-question feedback */}
                  <div className="space-y-3">
                    {quiz.questions.map((q, qi) => {
                      const chosen = quizResult.answers[qi];
                      const isCorrect = chosen === q.correctIndex;
                      return (
                        <div key={q.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            )}
                            <p className="text-sm text-foreground">{q.question}</p>
                          </div>
                          {!isCorrect && (
                            <div className="ml-6 text-xs text-muted-foreground space-y-1">
                              <p className="text-destructive">
                                Your answer: {q.options[chosen] ?? "Not answered"}
                              </p>
                              <p className="text-primary">
                                Correct: {q.options[q.correctIndex]}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuizResult(null);
                      setSelectedAnswers({});
                      setQuiz(null);
                    }}
                    data-testid="button-retake-quiz"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Try again
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
