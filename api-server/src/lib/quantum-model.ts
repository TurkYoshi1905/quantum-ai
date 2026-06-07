import { logger } from "./logger";

interface ModelMemory {
  ngramCounts: Map<string, Map<string, number>>;
  vocab: Map<string, number>;
  totalSamples: number;
  lastTrainedAt: Date | null;
}

const CONTEXT_SIZE = 3;
const END_TOKEN = "<END>";
const START_TOKEN = "<START>";

const memory: ModelMemory = {
  ngramCounts: new Map(),
  vocab: new Map(),
  totalSamples: 0,
  lastTrainedAt: null,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function updateNgramCounts(tokens: string[]): void {
  const seq = [START_TOKEN, START_TOKEN, START_TOKEN, ...tokens, END_TOKEN];
  for (const t of tokens) memory.vocab.set(t, (memory.vocab.get(t) ?? 0) + 1);
  for (let i = CONTEXT_SIZE; i < seq.length; i++) {
    const ctx = seq.slice(i - CONTEXT_SIZE, i).join(" ");
    const nxt = seq[i]!;
    if (!memory.ngramCounts.has(ctx)) memory.ngramCounts.set(ctx, new Map());
    const m = memory.ngramCounts.get(ctx)!;
    m.set(nxt, (m.get(nxt) ?? 0) + 1);
  }
}

export function trainOnText(texts: string[]): number {
  let n = 0;
  for (const text of texts) {
    if (!text?.trim()) continue;
    const tokens = tokenize(text);
    if (tokens.length < 2) continue;
    updateNgramCounts(tokens);
    n++;
  }
  memory.totalSamples += n;
  memory.lastTrainedAt = new Date();
  logger.info({ samplesProcessed: n, totalSamples: memory.totalSamples }, "Model trained");
  return n;
}

// ─── Yanıt Havuzu ─────────────────────────────────────────────────────────────

const R: Record<string, string[]> = {
  greeting: [
    "Merhaba! Ben QuantumAI. Bugün size nasıl yardımcı olabilirim?",
    "Selam! Herhangi bir konuda soru sorabilir ya da sohbet edebilirsiniz.",
    "Hoş geldiniz! Ne öğrenmek veya keşfetmek istersiniz?",
    "Merhaba! Merak ettiğiniz her şeyi benimle paylaşabilirsiniz.",
  ],
  farewell: [
    "Görüşmek üzere! Başka sorularınız olursa buradayım.",
    "Hoşça kalın! Yardımcı olabildiğime sevindim.",
    "Güle güle! Her zaman yardıma hazırım.",
  ],
  thanks: [
    "Ne demek! Başka sorularınız olursa çekinmeyin.",
    "Rica ederim, yardımcı olabildiğime sevindim!",
    "Teşekkür ederim. Sohbet etmekten memnuniyet duydum!",
    "Her zaman! Aklınıza takılan başka bir şey var mı?",
  ],
  affirmative: [
    "Harika! Devam edelim o zaman.",
    "Mükemmel! Başka eklemek istediğiniz bir şey var mı?",
    "Anlıyorum, devam edin lütfen.",
  ],
  negative: [
    "Anladım, peki başka nasıl yardımcı olabilirim?",
    "Tamam, farklı bir konudan bahsetmek ister misiniz?",
    "Sorun değil, başka bir konuda yardımcı olmamı ister misiniz?",
  ],
  who: [
    "Ben **QuantumAI** — Türkçe dil destekli bir yapay zeka asistanıyım. Sohbet geçmişinizden öğrenerek yanıtlarımı sürekli geliştiriyorum.",
    "QuantumAI olarak hizmetinizdeyim. n-gram tabanlı bir dil modeli kullanarak konuşmalardan öğreniyor ve yanıt üretiyorum.",
    "Adım QuantumAI. Türkçe soruları anlayıp yanıtlamak, bilgi paylaşmak ve sohbet etmek için buradayım.",
  ],
  what_can_you_do: [
    "Pek çok konuda yardımcı olabilirim:\n• Bilgi soruları (bilim, tarih, teknoloji...)\n• Programlama ve teknik sorular\n• Türkçe yazma ve ifade\n• Sohbet ve fikir alışverişi\n\nHangi konuyla başlamak istersiniz?",
    "Yapabileceğim şeyler arasında şunlar var:\n• Sorularınızı yanıtlamak\n• Konuları açıklamak\n• Fikir üretmek ve tartışmak\n• Metin yazmak veya düzeltmek\n\nNe yapmamı istersiniz?",
  ],
  ai: [
    "Yapay zeka (YZ), bilgisayarların insan benzeri görevleri yerine getirmesini sağlayan teknolojiler bütünüdür. Makine öğrenimi, derin öğrenme ve doğal dil işleme gibi alt dalları vardır.\n\nGünümüzde GPT-4, Gemini ve Claude gibi büyük dil modelleri (LLM) metin anlama ve üretmede insan düzeyine yaklaşmıştır.",
    "Makine öğrenmesinin temel türleri:\n• **Gözetimli öğrenme** — etiketli verilerle eğitim\n• **Gözetimsiz öğrenme** — verideki gizli örüntüleri keşfetme\n• **Pekiştirmeli öğrenme** — ödül/ceza sistemiyle deneyimden öğrenme\n\nHangi konuyu daha ayrıntılı ele alalım?",
    "Transformer mimarisi, modern YZ'nin temelini oluşturuyor. 2017'de Google'ın 'Attention Is All You Need' makalesiyle tanıtılan bu mimari; BERT, GPT ve benzeri modellerin altyapısını oluşturur.",
  ],
  technology: [
    "Teknoloji dünyası son yıllarda inanılmaz bir hız kazandı:\n• **Yapay Zeka** — sağlık, eğitim, finans...\n• **Kuantum bilgisayarlar** — kriptografi ve simülasyon\n• **Artırılmış gerçeklik** — iş ve eğlence\n• **Biyoteknoloji** — gen düzenleme, kişiselleştirilmiş tıp\n\nHangisi sizi en çok ilgilendiriyor?",
    "Günümüzde en çok konuşulan teknolojiler arasında yapay zeka, blockchain, nesnelerin interneti (IoT) ve 5G yer alıyor. Bu teknolojiler birbirleriyle entegre olarak hayatımızı köklü biçimde değiştiriyor.",
  ],
  programming: [
    "Programlamaya başlamak için önerilerim:\n1. **Python** — sade sözdizimi, geniş ekosistem\n2. **JavaScript** — web geliştirme için ideal\n3. **Rust** — sistem programlama, güvenlik\n\nTemel kavramları (değişken, döngü, fonksiyon, nesne) öğrendikten sonra küçük projeler yapmak en etkili yöntem.",
    "Web geliştirme yol haritası:\n• **Frontend:** HTML → CSS → JavaScript → React/Vue\n• **Backend:** Node.js/Python → REST API → Veritabanı\n• **DevOps:** Git → Docker → CI/CD\n\nHangi alanda uzmanlaşmak istiyorsunuz?",
    "Algoritma ve veri yapıları, güçlü bir programcının olmazsa olmazı. Dizi, bağlı liste, ağaç, graf ve hash tablosu gibi temel yapıları öğrenmek problem çözme yeteneğinizi katlar.",
  ],
  science: [
    "Bilim, sistematik gözlem ve deneye dayalı bilgi üretme sürecidir. Evrenin işleyişini anlamak için fizik, kimya, biyoloji ve astronominin birlikte çalışması gerekir.\n\nBelirli bir bilim dalını merak ediyor musunuz?",
    "Kuantum mekaniği, atom altı dünyayı açıklayan devrimsel bir teori. Süperpozisyon, dolanıklık ve tünel etkisi gibi olgular klasik fiziğin ötesinde bir gerçeklik sunar. Schrödinger'in kedisi bu kavramları anlatmak için kullanılan ünlü düşünce deneyidir.",
    "Evrenin yaşı yaklaşık **13,8 milyar yıl**. Büyük Patlama'dan sonra oluşan madde, zamanla galaksileri, yıldızları ve gezegenleri oluşturdu. Güneş Sistemi'nde yaklaşık 4,6 milyar yıl önce oluştu.",
  ],
  math: [
    "Matematiğin temel dalları:\n• **Cebir** — denklemler ve değişkenler\n• **Geometri** — şekil ve uzay\n• **Analiz** — türev ve integral\n• **İstatistik** — veri analizi\n\nHangi konuda yardıma ihtiyacınız var?",
    "Olasılık teorisi günlük hayatta çok önemli. Bir olayın gerçekleşme olasılığı 0 ile 1 arasında değer alır. Bağımsız olayların birlikte gerçekleşme olasılığı, ayrı ayrı olasılıklarının çarpımına eşittir.",
    "Asal sayılar, matematiğin en büyülü konularından biri. Sonsuz sayıda asal sayı olduğu M.Ö. 300'de Öklid tarafından kanıtlandı. Günümüzde bulunan en büyük asal sayı **milyonlarca basamaktan** oluşuyor!",
  ],
  history: [
    "Tarih, geçmişteki insan deneyimlerini anlayarak geleceğe ışık tutar. Osmanlı İmparatorluğu'nun yıkılışından Türkiye Cumhuriyeti'nin kuruluşuna uzanan süreç, modern Türk kimliğini şekillendiren kritik bir dönemdir.",
    "Birinci Dünya Savaşı (1914-1918), Avrupa'nın siyasi haritasını kökten değiştirdi. Osmanlı, Habsburg ve Rus imparatorluklarının çöküşüne zemin hazırladı. Bu savaş, milliyetçilik akımının zirveye ulaştığı bir dönemi simgeler.",
    "Tarihin büyük dönüm noktaları arasında matbaanın icadı (1440), Sanayi Devrimi (1760) ve dijital devrim (1990'lar) sayılabilir. Her biri insanlığın bilgi üretme ve paylaşma biçimini köklü olarak değiştirdi.",
  ],
  health: [
    "Sağlıklı yaşamın 4 temel direği:\n1. **Dengeli beslenme** — tam tahıl, sebze, meyve, protein\n2. **Düzenli egzersiz** — haftada 150 dk orta yoğunluk\n3. **Yeterli uyku** — 7-9 saat kaliteli uyku\n4. **Stres yönetimi** — meditasyon, sosyal bağlar\n\nHangi konuyu daha ayrıntılı konuşalım?",
    "Ruh sağlığı, fiziksel sağlık kadar önemli. Kaygı ve depresyon gibi durumlar yaygın olup etkili tedavileri mevcut. Destek almaktan çekinmemek büyük cesaret ister. Bir uzmana başvurmak her zaman en doğru adım.",
  ],
  food: [
    "Türk mutfağı dünyanın en zengin mutfaklarından biri:\n• **Kebaplar** — Adana, Urfa, İskender\n• **Mezeler** — hummus, haydari, cacık\n• **Tatlılar** — baklava, kadayıf, lokum\n• **İçecekler** — çay, ayran, şalgam\n\nHangi yemek hakkında bilgi almak istersiniz?",
    "Akdeniz diyeti dünyada en çok önerilen beslenme tarzlarından biri. Zeytinyağı, balık, sebze ve tam tahıl ağırlıklı bu diyet, kalp hastalığı riskini azalttığı kanıtlanmış.",
  ],
  sports: [
    "Türkiye'de en popüler sporlar: futbol, basketbol, voleybol, güreş ve atletizm. Özellikle güreşte Türkiye, dünya ve olimpiyat şampiyonları yetiştirmiş tarihi bir güç.",
    "Düzenli egzersizin faydaları:\n• Kardiyovasküler sağlık\n• Kemik yoğunluğu artışı\n• Zihinsel sağlık ve stres azaltma\n• Enerji seviyesi yükselmesi\n• Uyku kalitesi artışı\n\nHaftada en az 3 gün aktif olmayı hedefleyin!",
  ],
  music: [
    "Müzik, insanlığın en evrensel dili. Türk müziği ise makam sistemi, saz ailesi ve ozanlık geleneğiyle özgün bir kültürel miras taşır. Halk müziğinden Türk sanat müziğine, arabeskten pop'a geniş bir yelpazesi var.",
    "Müziğin bilimsel faydaları kanıtlanmış:\n• Konsantrasyon artışı (klasik müzik)\n• Stres azaltma (yavaş tempo)\n• Motivasyon yükseltme (hızlı ritim)\n• Yaratıcılık geliştirme\n\nSiz hangi müzik türünü tercih ediyorsunuz?",
  ],
  nature: [
    "Türkiye, biyoçeşitlilik açısından inanılmaz zengin bir ülke. Toros dağlarından Karadeniz ormanlarına, Ege kıyılarından İç Anadolu stepine kadar birbirinden farklı ekosistemler barındırıyor.",
    "İklim değişikliği acil eylem gerektiren küresel bir kriz. Karbondioksit emisyonları azaltmak, yenilenebilir enerjiye geçiş ve sürdürülebilir tarım bu krizle mücadelede kilit rol oynuyor.",
  ],
  education: [
    "Etkili öğrenme stratejileri:\n• **Spaced repetition** — aralıklı tekrar\n• **Active recall** — pasif okuma yerine aktif hatırlama\n• **Feynman tekniği** — öğrendiklerini başkasına anlatma\n• **Pomodoro** — 25 dk çalışma, 5 dk mola\n\nHangi konuyu öğrenmek istiyorsunuz?",
    "Lifelong learning (sürekli öğrenme) modern çağın en kritik becerisi. Teknoloji hızla değişirken mevcut bilginizi güncellemek ve yeni beceriler kazanmak kariyer açısından hayati önem taşıyor.",
  ],
  economy: [
    "Temel ekonomik kavramlar:\n• **Enflasyon** — fiyat düzeyindeki genel artış\n• **Faiz** — paranın kullanım bedeli\n• **GSYİH** — ülkenin toplam üretim değeri\n• **İşsizlik oranı** — istihdam sağlanamayan nüfus oranı\n\nHangi konuyu daha ayrıntılı ele alalım?",
    "Kişisel finans yönetiminin altın kuralları:\n1. Harcamaları gelirin altında tut\n2. Acil fon oluştur (3-6 aylık gider)\n3. Borçları en yüksek faizliden başlayarak öde\n4. Uzun vadeli yatırım yap ve sabırlı ol",
  ],
  philosophy: [
    "Felsefenin temel soruları:\n• **Ontoloji** — Var olmak ne demektir?\n• **Epistemoloji** — Bilgi nedir, sınırları var mı?\n• **Etik** — Nasıl yaşamalıyız?\n• **Estetik** — Güzellik nedir?\n\nSizi en çok hangi soru meşgul ediyor?",
    "Stoacılık, günümüzde de çok geçerli bir yaşam felsefesi. Temel ilkesi: kontrol edebildiklerine odaklan, edemediklerini kabul et. Marcus Aurelius, Epiktetos ve Seneca bu geleneğin önemli temsilcileri.",
  ],
  help: [
    "Elbette yardımcı olabilirim! Sorunuzu biraz daha açar mısınız?",
    "Dinliyorum! Hangi konuda yardıma ihtiyacınız var?",
    "Tabii ki! Bu konuyu birlikte çözelim. Ne yapmanız gerekiyor?",
  ],
  question_about_world: [
    "Dünya hakkında merak ettiğiniz her şeyi sorabilirsiniz. Coğrafya, kültür, politika, bilim — hangi konuya odaklanayım?",
    "Bu harika bir soru! Birden fazla perspektiften değerlendirelim.",
  ],
  default: [
    "İlginç bir konu! Daha fazla detay paylaşırsanız daha kapsamlı bir yanıt verebilirim.",
    "Anlıyorum. Bu konuyu daha iyi ele alabilmek için biraz daha bağlam alabilir miyim?",
    "Bu meseleyi farklı açılardan ele almak mümkün. Öncelikle hangi boyutunu merak ettiğinizi öğrenebilir miyim?",
    "Güzel bir soru. Konuya ilişkin şunları söyleyebilirim: her sorunun birden fazla doğru yanıtı olabilir; önemli olan doğru soruları sormak!",
    "Bunu düşünmek için birkaç saniye ayırıyorum... Bu konu gerçekten çok boyutlu. Hangi yönüne odaklanmamı istersiniz?",
  ],
};

interface TopicPattern { topic: string; re: RegExp }

const PATTERNS: TopicPattern[] = [
  { topic: "greeting",    re: /^(merhaba|selam|günaydın|iyi sabahlar|iyi akşamlar|iyi günler|hey|hi)\b/ },
  { topic: "farewell",    re: /görüşürüz|hoşça kal|güle güle|bye|baybay|iyi geceler|iyi akşamlar.*git/ },
  { topic: "thanks",      re: /teşekkür|sağ ol|eyvallah|çok iyi|harika|süper|mükemmel|bravo|aferin/ },
  { topic: "affirmative", re: /^(evet|tamam|tabii|olur|peki|kesinlikle|doğru|elbette|tabi)\b/ },
  { topic: "negative",    re: /^(hayır|yok|olmaz|istemiyorum|gerek yok)\b/ },
  { topic: "who",         re: /kimsin|ne ?sin|adın ne|kendin|sen kimsin|hakkında|tanıt|kim ol/ },
  { topic: "what_can_you_do", re: /ne yapabilir|ne bilir|neler yapabilir|yeteneklerin|özellikler|nasıl yardım/ },
  { topic: "ai",          re: /yapay zeka|makine öğren|derin öğren|llm|gpt|transformer|neural|sinir ağı|chatgpt|gemini|claude/ },
  { topic: "technology",  re: /teknoloji|yazılım|donanım|bilgisayar|uygulama|internet|dijital|robot|otomasyon|siber/ },
  { topic: "programming", re: /programlama|kod|python|javascript|typescript|react|node|sql|veri\s*tabanı|backend|frontend|web\s*geliştir|api|github|git\b/ },
  { topic: "science",     re: /bilim|fizik|kimya|biyoloji|astronomi|uzay|evren|deney|hipotez|kuantum|atom/ },
  { topic: "math",        re: /matematik|sayı|hesap|cebir|geometri|istatistik|olasılık|formül|denklem|integral|türev/ },
  { topic: "history",     re: /tarih|osmanlı|cumhuriyet|savaş|imparatorluk|atatürk|antik|orta çağ|devrim|sanayi/ },
  { topic: "health",      re: /sağlık|hastalık|doktor|ilaç|beslenme|diyet|uyku|egzersiz|spor yapmak|kalori|vitamin/ },
  { topic: "food",        re: /yemek|yiyecek|tarif|mutfak|pişir|lezzet|restoran|kahvaltı|akşam yemeği|aperitif/ },
  { topic: "sports",      re: /spor|futbol|basketbol|voleybol|tenis|atletizm|olimpiyat|maç|şampiyon|liga/ },
  { topic: "music",       re: /müzik|şarkı|melodi|enstrüman|konser|albüm|sanatçı|ritim|nota|rock|jazz|pop\b/ },
  { topic: "nature",      re: /doğa|çevre|iklim|orman|deniz|dağ|hayvan|bitki|ekosistem|sürdürülebilir|karbon/ },
  { topic: "education",   re: /eğitim|okul|üniversite|ders|öğren|kurs|sınav|öğretmen|akademik|burs/ },
  { topic: "economy",     re: /ekonomi|para|enflasyon|faiz|borsa|yatırım|bütçe|ticaret|piyasa|döviz|tasarruf/ },
  { topic: "philosophy",  re: /felsefe|anlam|varoluş|ahlak|etik|özgür irade|bilinç|gerçek|hakikat|mutluluk|yaşamın/ },
  { topic: "question_about_world", re: /neden|nasıl|nerede|ne zaman|niçin|kaç|hangi|kim\b.*(dünya|türkiye|tarih)/ },
  { topic: "help",        re: /yardım|nasıl yapabilirim|ne yapayım|öğrenmek istiyorum|açıkla|anlat|söyle/ },
];

function detectTopic(msg: string): string {
  const low = msg.toLowerCase().trim();
  for (const { topic, re } of PATTERNS) {
    if (re.test(low)) return topic;
  }
  return "default";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function extractKeyTerms(msg: string): string[] {
  const stopwords = new Set(["bir", "ve", "bu", "da", "de", "mi", "mı", "ne", "için", "ile", "çok", "daha", "var", "yok", "ben", "sen", "biz", "siz", "ama", "çünkü", "gibi", "kadar", "olan", "ki"]);
  return tokenize(msg)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 4);
}

function buildContextSuffix(msg: string, history: Array<{ role: string; content: string }>): string {
  const terms = extractKeyTerms(msg);
  const suffixes: string[] = [];

  if (terms.length > 0 && Math.random() > 0.6) {
    suffixes.push(`\n\n**"${terms[0]}"** konusunda daha fazla bilgi ister misiniz?`);
  }
  if (history.length >= 3 && Math.random() > 0.5) {
    const followups = [
      "\n\nBu konuyu biraz daha derinlemesine ele almamı ister misiniz?",
      "\n\nBaşka sorusu olan bir konu var mı?",
      "\n\nBu konunun pratik yönleri hakkında da konuşabilir miyiz?",
    ];
    suffixes.push(pick(followups));
  }
  return suffixes.length > 0 ? suffixes[0]! : "";
}

export function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const topic = detectTopic(userMessage);
  const pool = (R[topic] ?? R["default"]!);
  let response = pick(pool);

  // Bağlamsal ek — uzun konuşmalarda
  if (conversationHistory.length > 0) {
    response += buildContextSuffix(userMessage, conversationHistory);
  }

  return response;
}

export function getModelStatus() {
  return {
    name: "quantum-ai-0.1",
    version: "0.2",
    isReady: true,
    vocabSize: memory.vocab.size,
    totalTrainingSamples: memory.totalSamples,
    lastTrainedAt: memory.lastTrainedAt ? memory.lastTrainedAt.toISOString() : null,
  };
}

export function getMemory() {
  return memory;
}
