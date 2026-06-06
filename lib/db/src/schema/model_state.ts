import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const modelStateTable = pgTable("model_state", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("quantum-ai-0.1"),
  version: text("version").notNull().default("0.1"),
  vocabSize: integer("vocab_size").notNull().default(0),
  totalTrainingSamples: integer("total_training_samples").notNull().default(0),
  lastTrainedAt: timestamp("last_trained_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertModelStateSchema = createInsertSchema(modelStateTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertModelState = z.infer<typeof insertModelStateSchema>;
export type ModelState = typeof modelStateTable.$inferSelect;
