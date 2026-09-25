import { Router } from "express";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are an expert coding tutor specializing in full-stack web development. You help students learn:
- Frontend: HTML, CSS, JavaScript, React
- Backend: Java, OOP principles, Spring Boot, Node.js, Express.js
- Databases: SQL, PostgreSQL, schema design, relational database management

Provide clear, accurate, and educational answers. When explaining code, use markdown code blocks with appropriate language tags (e.g. \`\`\`javascript). Be encouraging and supportive. Break down complex concepts into simple steps. Focus on practical examples and best practices.`;

router.post("/chat/message", requireAuth, async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { message, history } = parsed.data;

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages,
      max_completion_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
    return res.status(200).json({ reply });
  } catch (err) {
    logger.error({ err }, "chat error");
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
