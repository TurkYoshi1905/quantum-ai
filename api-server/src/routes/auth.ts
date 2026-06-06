import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password } = parsed.data;

  const [existingByEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingByEmail) {
    res.status(409).json({ error: "Bu e-posta adresi zaten kullanımda" });
    return;
  }

  const [existingByUsername] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existingByUsername) {
    res.status(409).json({ error: "Bu kullanıcı adı zaten kullanımda" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({ username, email, passwordHash })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "E-posta veya şifre hatalı" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "E-posta veya şifre hatalı" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) {
    res.status(401).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isPremium: user.isPremium,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
