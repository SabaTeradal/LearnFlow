import { Router } from "express";
import { db, quizResultsTable, videosTable, levelsTable, userAchievementsTable, achievementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GenerateQuizBody, SubmitQuizBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// Static quiz bank organized by topic keywords
const quizBankByTopic: Record<string, Array<{ question: string; options: string[]; correctIndex: number }>> = {
  html: [
    { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "HyperTransfer Markup Language", "None of the above"], correctIndex: 0 },
    { question: "Which tag is used to create a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], correctIndex: 1 },
    { question: "What is the correct HTML for a paragraph?", options: ["<p>", "<para>", "<pg>", "<div>"], correctIndex: 0 },
    { question: "Which HTML element defines the document's title?", options: ["<title>", "<head>", "<meta>", "<header>"], correctIndex: 0 },
    { question: "Which attribute specifies an alternate text for an image?", options: ["title", "src", "alt", "longdesc"], correctIndex: 2 },
  ],
  css: [
    { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Colorful Style Sheets", "Computer Style Sheets", "Creative Style Sheets"], correctIndex: 0 },
    { question: "Which CSS property controls text size?", options: ["font-style", "text-size", "font-size", "text-weight"], correctIndex: 2 },
    { question: "How do you select an element with id 'demo'?", options: [".demo", "#demo", "*demo", "demo"], correctIndex: 1 },
    { question: "Which property is used to change the background color?", options: ["color", "bgcolor", "background-color", "background"], correctIndex: 2 },
    { question: "What is the CSS box model?", options: ["content, padding, border, margin", "width, height, color", "block, inline, flex", "position, float, clear"], correctIndex: 0 },
  ],
  javascript: [
    { question: "Which keyword declares a variable in modern JS?", options: ["var", "let", "const", "Both let and const"], correctIndex: 3 },
    { question: "What does '===' check?", options: ["Value only", "Type only", "Value and type", "Neither"], correctIndex: 2 },
    { question: "Which method adds an element to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], correctIndex: 0 },
    { question: "What is a closure in JavaScript?", options: ["A loop construct", "A function that retains its outer scope", "An error handler", "A class method"], correctIndex: 1 },
    { question: "What does 'async/await' do?", options: ["Handles synchronous code", "Simplifies promise-based async code", "Prevents errors", "Creates threads"], correctIndex: 1 },
  ],
  react: [
    { question: "What is JSX?", options: ["A JavaScript library", "JavaScript XML syntax", "A CSS framework", "A database query language"], correctIndex: 1 },
    { question: "Which hook manages component state?", options: ["useEffect", "useRef", "useState", "useContext"], correctIndex: 2 },
    { question: "What does useEffect do?", options: ["Creates state", "Handles side effects", "Styles components", "Fetches data only"], correctIndex: 1 },
    { question: "What are React props?", options: ["State variables", "Read-only inputs passed to components", "CSS classes", "Event handlers"], correctIndex: 1 },
    { question: "How do you prevent re-renders in functional components?", options: ["useReducer", "useMemo / React.memo", "useRef", "useCallback only"], correctIndex: 1 },
  ],
  java: [
    { question: "What is Java?", options: ["A scripting language", "A compiled, object-oriented language", "A markup language", "A database"], correctIndex: 1 },
    { question: "What does OOP stand for?", options: ["Object-Oriented Programming", "Open-Output Processing", "Ordered Object Patterns", "None"], correctIndex: 0 },
    { question: "What is inheritance in Java?", options: ["A loop mechanism", "A class acquiring properties of another", "A data type", "A design pattern"], correctIndex: 1 },
    { question: "What is an interface in Java?", options: ["A concrete class", "A contract with abstract methods", "A primitive type", "A database connection"], correctIndex: 1 },
    { question: "What is the JVM?", options: ["Java Visual Manager", "Java Virtual Machine that runs bytecode", "Java Version Manager", "None"], correctIndex: 1 },
  ],
  spring: [
    { question: "What is Spring Boot?", options: ["A testing framework", "An opinionated Spring framework starter", "A database ORM", "A front-end library"], correctIndex: 1 },
    { question: "What annotation marks a Spring REST controller?", options: ["@Service", "@Component", "@RestController", "@Repository"], correctIndex: 2 },
    { question: "What is dependency injection?", options: ["Manual object creation", "Framework-managed object wiring", "A caching strategy", "A security pattern"], correctIndex: 1 },
    { question: "What is JPA?", options: ["Java Persistence API", "Java Pattern Architecture", "JSON Processing API", "None"], correctIndex: 0 },
    { question: "What does @Autowired do?", options: ["Creates a bean", "Injects a dependency automatically", "Defines a route", "None"], correctIndex: 1 },
  ],
  sql: [
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Sequential Query Logic", "Standard Query List", "None"], correctIndex: 0 },
    { question: "Which SQL command retrieves data?", options: ["INSERT", "SELECT", "UPDATE", "DELETE"], correctIndex: 1 },
    { question: "What is a primary key?", options: ["A key for encryption", "A unique identifier for a row", "A foreign reference", "An index"], correctIndex: 1 },
    { question: "What does JOIN do?", options: ["Merges databases", "Combines rows from multiple tables", "Deletes rows", "Creates tables"], correctIndex: 1 },
    { question: "What is normalization?", options: ["Encrypting data", "Organizing data to reduce redundancy", "Indexing tables", "Backing up data"], correctIndex: 1 },
  ],
  database: [
    { question: "What is a relational database?", options: ["A spreadsheet", "A database that organizes data in tables with relationships", "A NoSQL store", "A file system"], correctIndex: 1 },
    { question: "What is a foreign key?", options: ["A key from a different server", "A column referencing another table's primary key", "A duplicate key", "None"], correctIndex: 1 },
    { question: "What is an index in a database?", options: ["A sorted list of values for fast lookup", "A table name", "A query plan", "A stored procedure"], correctIndex: 0 },
    { question: "What is ACID in databases?", options: ["Atomicity, Consistency, Isolation, Durability", "A chemical process", "Advanced Cache I/O Design", "None"], correctIndex: 0 },
    { question: "What is a schema in database design?", options: ["A table row", "The structure defining tables, columns, and relationships", "A stored query", "None"], correctIndex: 1 },
  ],
  node: [
    { question: "What is Node.js?", options: ["A browser runtime", "A server-side JavaScript runtime", "A CSS processor", "A database"], correctIndex: 1 },
    { question: "What is npm?", options: ["Node Package Manager", "Network Protocol Manager", "None", "Node Program Maker"], correctIndex: 0 },
    { question: "What is Express.js?", options: ["A database ORM", "A minimal Node.js web framework", "A testing tool", "A bundler"], correctIndex: 1 },
    { question: "What is middleware in Express?", options: ["A database connection", "Functions that run between request and response", "A routing module", "None"], correctIndex: 1 },
    { question: "What does 'async/await' replace in Node.js?", options: ["Callbacks and promise chains", "Variables", "Imports", "Class syntax"], correctIndex: 0 },
  ],
};

function getQuestionsForVideo(videoTitle: string, levelTitle: string): Array<{ question: string; options: string[]; correctIndex: number }> {
  const combined = (videoTitle + " " + levelTitle).toLowerCase();
  
  const topicMatches: string[] = [];
  for (const topic of Object.keys(quizBankByTopic)) {
    if (combined.includes(topic)) topicMatches.push(topic);
  }

  if (topicMatches.length === 0) {
    // Default: pick questions from related topics based on level
    if (combined.includes("frontend") || combined.includes("level 1")) {
      topicMatches.push("html", "css", "javascript");
    } else if (combined.includes("backend") || combined.includes("level 2")) {
      topicMatches.push("java", "spring", "node");
    } else {
      topicMatches.push("sql", "database");
    }
  }

  const pool: Array<{ question: string; options: string[]; correctIndex: number }> = [];
  for (const topic of topicMatches) {
    pool.push(...(quizBankByTopic[topic] ?? []));
  }

  // Shuffle and take 4 questions
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

router.post("/quizzes/generate", requireAuth, async (req, res) => {
  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { videoId, videoTitle, levelTitle } = parsed.data;

  try {
    const rawQuestions = getQuestionsForVideo(videoTitle, levelTitle);
    const questions = rawQuestions.map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
    }));

    return res.status(200).json({ videoId, questions });
  } catch (err) {
    logger.error({ err }, "generateQuiz error");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/quizzes/submit", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { videoId, videoTitle, answers } = parsed.data;

  try {
    // Get the quiz questions for this video to check answers
    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);
    const [level] = video
      ? await db.select().from(levelsTable).where(eq(levelsTable.id, video.levelId)).limit(1)
      : [null];
    
    const levelTitle = level?.title ?? "Unknown";
    const rawQuestions = getQuestionsForVideo(videoTitle, levelTitle);

    // Score: answers are indexed by questionId (1-based)
    let correct = 0;
    for (const answer of answers) {
      const question = rawQuestions[answer.questionId - 1];
      if (question && answer.selectedIndex === question.correctIndex) {
        correct++;
      }
    }

    const totalQuestions = answers.length;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = score >= 70;

    // Save quiz result
    await db.insert(quizResultsTable).values({
      userId,
      videoId,
      videoTitle,
      levelTitle,
      score: correct,
      totalQuestions,
      passed,
    });

    // Check and grant achievements
    await checkAndGrantAchievements(userId);

    const feedback = passed
      ? `Great job! You scored ${score}% (${correct}/${totalQuestions} correct).`
      : `You scored ${score}% (${correct}/${totalQuestions} correct). Review the material and try again!`;

    return res.status(200).json({
      score: correct,
      totalQuestions,
      passed,
      feedback,
      needsImprovement: !passed,
    });
  } catch (err) {
    logger.error({ err }, "submitQuiz error");
    return res.status(500).json({ error: "Server error" });
  }
});

async function checkAndGrantAchievements(userId: number) {
  try {
    const allAchievements = await db.select().from(achievementsTable);
    const earned = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      let shouldGrant = false;
      const condition = achievement.condition;

      if (condition === "quiz_perfect") {
        const perfect = await db
          .select()
          .from(quizResultsTable)
          .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.passed, true)))
          .limit(1);
        shouldGrant = perfect.length > 0;
      } else if (condition.startsWith("level_")) {
        // e.g., level_frontend, level_backend, level_database
        const levelKey = condition.replace("level_", "");
        const results = await db.select().from(quizResultsTable).where(eq(quizResultsTable.userId, userId));
        const relatedResults = results.filter((r) => r.levelTitle.toLowerCase().includes(levelKey));
        shouldGrant = relatedResults.length >= 2;
      }

      if (shouldGrant) {
        await db.insert(userAchievementsTable).values({ userId, achievementId: achievement.id });
      }
    }
  } catch (err) {
    logger.error({ err }, "checkAchievements error");
  }
}

export default router;
