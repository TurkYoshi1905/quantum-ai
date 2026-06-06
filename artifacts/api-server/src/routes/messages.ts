import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, chatsTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { generateResponse, trainOnText } from "../lib/quantum-model";
import { ListMessagesParams, SendMessageParams, SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chats/:chatId/messages", requireAuth, async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [chat] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.id, params.data.chatId), eq(chatsTable.userId, userId)));

  if (!chat) {
    res.status(404).json({ error: "Sohbet bulunamadı" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, params.data.chatId))
    .orderBy(asc(messagesTable.createdAt));

  res.json(
    messages.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/chats/:chatId/messages", requireAuth, async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;

  const [chat] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.id, params.data.chatId), eq(chatsTable.userId, userId)));

  if (!chat) {
    res.status(404).json({ error: "Sohbet bulunamadı" });
    return;
  }

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, params.data.chatId))
    .orderBy(asc(messagesTable.createdAt));

  const conversationHistory = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      chatId: params.data.chatId,
      role: "user",
      content: parsed.data.content,
    })
    .returning();

  if (!userMessage) {
    res.status(500).json({ error: "Mesaj kaydedilemedi" });
    return;
  }

  trainOnText([parsed.data.content]);

  const aiResponse = generateResponse(parsed.data.content, conversationHistory);

  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({
      chatId: params.data.chatId,
      role: "assistant",
      content: aiResponse,
    })
    .returning();

  if (!assistantMessage) {
    res.status(500).json({ error: "AI yanıtı kaydedilemedi" });
    return;
  }

  await db
    .update(chatsTable)
    .set({ updatedAt: new Date() })
    .where(eq(chatsTable.id, params.data.chatId));

  if (chat.title === "Yeni Sohbet" && history.length === 0) {
    const titleWords = parsed.data.content.split(" ").slice(0, 5).join(" ");
    await db
      .update(chatsTable)
      .set({ title: titleWords.length > 3 ? titleWords : chat.title })
      .where(eq(chatsTable.id, params.data.chatId));
  }

  res.status(201).json({
    userMessage: {
      id: userMessage.id,
      chatId: userMessage.chatId,
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    },
    assistantMessage: {
      id: assistantMessage.id,
      chatId: assistantMessage.chatId,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt.toISOString(),
    },
  });
});

export default router;
