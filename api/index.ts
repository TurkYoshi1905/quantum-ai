// Vercel Serverless API — QuantumAI backend
// Tüm /api/* isteklerini karşılar
import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";

// Rota modüllerini doğrudan içe aktar (pino-http kullanmadan)
import router from "../api-server/src/routes/index.js";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /api prefix ile tüm rotaları bağla
app.use("/api", router);

// Hata yakalayıcı
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Sunucu hatası" });
});

export default app;
