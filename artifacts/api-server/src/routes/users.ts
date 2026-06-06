import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, chatsTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  const [chatCount] = await db
    .select({ count: count() })
    .from(chatsTable)
    .where(eq(chatsTable.userId, userId));

  const userChats = await db
    .select({ id: chatsTable.id })
    .from(chatsTable)
    .where(eq(chatsTable.userId, userId));

  let totalMessages = 0;
  for (const chat of userChats) {
    const [msgCount] = await db
      .select({ count: count() })
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chat.id));
    totalMessages += msgCount?.count ?? 0;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isPremium: user.isPremium,
    createdAt: user.createdAt.toISOString(),
    totalChats: chatCount?.count ?? 0,
    totalMessages,
  });
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;

  const updateData: Partial<{ username: string }> = {};
  if (parsed.data.username) updateData.username = parsed.data.username;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  const [chatCount] = await db
    .select({ count: count() })
    .from(chatsTable)
    .where(eq(chatsTable.userId, userId));

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isPremium: user.isPremium,
    createdAt: user.createdAt.toISOString(),
    totalChats: chatCount?.count ?? 0,
    totalMessages: 0,
  });
});

export default router;
