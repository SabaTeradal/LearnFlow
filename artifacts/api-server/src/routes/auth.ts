import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const SALT_ROUNDS = 10;

function makeToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString("base64url");
}

// In-memory token store (simple approach; swap for Redis/DB in prod)
export const tokenStore = new Map<string, number>(); // token -> userId

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, theme: "dark" }).returning();

    const token = makeToken(user.id);
    tokenStore.set(token, user.id);

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    logger.error({ err }, "register error");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { email, password } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = makeToken(user.id);
    tokenStore.set(token, user.id);

    return res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    logger.error({ err }, "login error");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    tokenStore.delete(auth.slice(7));
  }
  return res.status(200).json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const token = auth.slice(7);
  const userId = tokenStore.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.status(200).json({ id: user.id, name: user.name, email: user.email, theme: user.theme, createdAt: user.createdAt });
  } catch (err) {
    logger.error({ err }, "getMe error");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
