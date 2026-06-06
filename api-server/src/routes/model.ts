import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { trainOnText, getModelStatus } from "../lib/quantum-model";

const router: IRouter = Router();

router.get("/model/status", requireAuth, async (_req, res): Promise<void> => {
  const status = getModelStatus();
  res.json(status);
});

router.post("/model/train", requireAuth, async (_req, res): Promise<void> => {
  const messages = await db
    .select({ content: messagesTable.content, role: messagesTable.role })
    .from(messagesTable)
    .orderBy(asc(messagesTable.createdAt));

  const texts = messages.map((m) => m.content);
  const samplesUsed = trainOnText(texts);

  res.json({
    success: true,
    samplesUsed,
    message: `Model ${samplesUsed} örnek ile başarıyla eğitildi`,
  });
});

export default router;
