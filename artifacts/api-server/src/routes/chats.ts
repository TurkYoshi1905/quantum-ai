import { Router, type IRouter } from "express";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { db, chatsTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  CreateChatBody,
  UpdateChatBody,
  GetChatParams,
  UpdateChatParams,
  DeleteChatParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const chats = await db
    .select({
      id: chatsTable.id,
      title: chatsTable.title,
      userId: chatsTable.userId,
      createdAt: chatsTable.createdAt,
      updatedAt: chatsTable.updatedAt,
    })
    .from(chatsTable)
    .where(eq(chatsTable.userId, userId))
    .orderBy(desc(chatsTable.updatedAt));

  const chatsWithStats = await Promise.all(
    chats.map(async (chat) => {
      const [msgCount] = await db
        .select({ count: count() })
        .from(messagesTable)
        .where(eq(messagesTable.chatId, chat.id));

      const [lastMsg] = await db
        .select({ content: messagesTable.content })
        .from(messagesTable)
        .where(eq(messagesTable.chatId, chat.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      return {
        id: chat.id,
        title: chat.title,
        userId: chat.userId,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: msgCount?.count ?? 0,
        lastMessage: lastMsg?.content ?? null,
      };
    })
  );

  res.json(chatsWithStats);
});

router.post("/chats", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [chat] = await db
    .insert(chatsTable)
    .values({ title: parsed.data.title, userId })
    .returning();

  if (!chat) {
    res.status(500).json({ error: "Sohbet oluşturulamadı" });
    return;
  }

  res.status(201).json({
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messageCount: 0,
    lastMessage: null,
  });
});

router.get("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetChatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [chat] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.id, params.data.id), eq(chatsTable.userId, userId)));

  if (!chat) {
    res.status(404).json({ error: "Sohbet bulunamadı" });
    return;
  }

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chat.id));

  const [lastMsg] = await db
    .select({ content: messagesTable.content })
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chat.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(1);

  res.json({
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messageCount: msgCount?.count ?? 0,
    lastMessage: lastMsg?.content ?? null,
  });
});

router.patch("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateChatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [chat] = await db
    .update(chatsTable)
    .set({ title: parsed.data.title })
    .where(and(eq(chatsTable.id, params.data.id), eq(chatsTable.userId, userId)))
    .returning();

  if (!chat) {
    res.status(404).json({ error: "Sohbet bulunamadı" });
    return;
  }

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chat.id));

  res.json({
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messageCount: msgCount?.count ?? 0,
    lastMessage: null,
  });
});

router.delete("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteChatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [deleted] = await db
    .delete(chatsTable)
    .where(and(eq(chatsTable.id, params.data.id), eq(chatsTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Sohbet bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

export default router;
