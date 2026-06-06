import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PLANS = [
  {
    id: "free",
    name: "Ücretsiz",
    price: 0,
    currency: "TRY",
    period: "ay",
    features: [
      "Günlük 10 mesaj",
      "Temel AI yanıtları",
      "3 aktif sohbet",
      "Sohbet geçmişi (7 gün)",
    ],
    isPopular: false,
    description: "Başlamak için mükemmel",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    currency: "TRY",
    period: "ay",
    features: [
      "Sınırsız mesaj",
      "Gelişmiş AI yanıtları",
      "Sınırsız aktif sohbet",
      "Sohbet geçmişi (90 gün)",
      "Model eğitimi önceliği",
      "Bağlam hafızası iyileştirme",
      "Öncelikli destek",
    ],
    isPopular: true,
    description: "Güçlü AI deneyimi için",
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    price: 499,
    currency: "TRY",
    period: "ay",
    features: [
      "Her şey Pro'da olanlar",
      "Özel model eğitimi",
      "API erişimi",
      "Sınırsız sohbet geçmişi",
      "Ekip yönetimi",
      "Gelişmiş analitik",
      "7/24 öncelikli destek",
      "Özel entegrasyonlar",
    ],
    isPopular: false,
    description: "Kurumlar ve ekipler için",
  },
];

router.get("/plans", (_req, res): void => {
  res.json(PLANS);
});

export default router;
