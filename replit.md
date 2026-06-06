# QuantumAI

Yerel LLM modeli (quantum-ai-0.1) ile güçlendirilmiş, Türkçe dil destekli yapay zeka sohbet uygulaması.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API sunucusunu çalıştır (port 8080)
- `pnpm --filter @workspace/quantum-ai run dev` — Frontend'i çalıştır (port 19773)
- `pnpm run typecheck` — Tüm paketlerde typecheck
- `pnpm run build` — Typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI spec'ten hooks ve Zod şemalarını yeniden üret
- `pnpm --filter @workspace/db run push` — DB şema değişikliklerini uygula (yalnızca dev)
- Required env: `DATABASE_URL` — Postgres bağlantı dizesi, `SESSION_SECRET` — JWT imzalama anahtarı

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19.2, Vite, Tailwind CSS v4, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken)
- AI Model: quantum-ai-0.1 (n-gram tabanlı yerel LLM, sohbet geçmişinden öğrenen)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (OpenAPI'dan)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API kontratının tek kaynağı
- `lib/db/src/schema/` — Drizzle tablo şemaları (users, chats, messages, model_state)
- `artifacts/api-server/src/routes/` — Express route handler'ları (auth, chats, messages, model, users, plans)
- `artifacts/api-server/src/lib/quantum-model.ts` — quantum-ai-0.1 n-gram dil modeli
- `artifacts/api-server/src/lib/auth.ts` — JWT yardımcıları
- `artifacts/quantum-ai/src/` — React frontend (pages, components)

## Architecture decisions

- JWT tabanlı kimlik doğrulama — token localStorage'da saklanır, her istekte Bearer header olarak gönderilir
- quantum-ai-0.1: TensorFlow.js yerine hafif n-gram tabanlı Markov zinciri — sunucuda daha hızlı başlatma ve öğrenme
- Sohbet geçmişi n-gram modelini gerçek zamanlı eğitir — her mesaj sonrası trainOnText() çağrılır
- Tüm UI metinleri Türkçe — kayıt, giriş, premium, sohbet, ayarlar
- Karanlık mod varsayılan — quantum/uzay teması mavi/mor/cyan neon aksan renkleriyle

## Product

- Hesap oluşturma ve giriş (JWT auth)
- Sohbet paneli: sidebar (sohbet listesi, arama, yeni sohbet), mesaj balonları, AI yanıtları
- quantum-ai-0.1 modeli: sohbet geçmişinden n-gram öğrenmesi, bağlamı hatırlama
- Premium sayfası: Ücretsiz / Pro / Kurumsal planlar
- Ayarlar: kullanıcı profili, model durumu, manuel model eğitimi

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Lib şema değişikliklerinden sonra `pnpm run typecheck:libs` çalıştır, aksi halde leaf typecheck'ler stale declarations görür
- quantum-ai-0.1 model durumu sunucu yeniden başlatıldığında sıfırlanır (in-memory) — model_state tablosu kalıcı istatistikler için ayrılmıştır
- JWT_SECRET env değişkeni SESSION_SECRET'tan okunur

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
