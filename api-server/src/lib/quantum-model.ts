import { logger } from "./logger";

interface Vocabulary {
  wordToIndex: Map<string, number>;
  indexToWord: Map<number, string>;
  size: number;
}

interface ModelMemory {
  ngramCounts: Map<string, Map<string, number>>;
  vocab: Vocabulary;
  totalSamples: number;
  lastTrainedAt: Date | null;
}

const CONTEXT_SIZE = 3;
const UNK_TOKEN = "<UNK>";
const START_TOKEN = "<START>";
const END_TOKEN = "<END>";

const memory: ModelMemory = {
  ngramCounts: new Map(),
  vocab: { wordToIndex: new Map(), indexToWord: new Map(), size: 0 },
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

function addToVocab(word: string): void {
  if (!memory.vocab.wordToIndex.has(word)) {
    const idx = memory.vocab.size;
    memory.vocab.wordToIndex.set(word, idx);
    memory.vocab.indexToWord.set(idx, word);
    memory.vocab.size++;
  }
}

function updateNgramCounts(tokens: string[]): void {
  const sequence = [START_TOKEN, START_TOKEN, START_TOKEN, ...tokens, END_TOKEN];
  addToVocab(START_TOKEN);
  addToVocab(END_TOKEN);
  for (const token of tokens) addToVocab(token);

  for (let i = CONTEXT_SIZE; i < sequence.length; i++) {
    const context = sequence.slice(i - CONTEXT_SIZE, i).join(" ");
    const nextWord = sequence[i]!;
    if (!memory.ngramCounts.has(context)) memory.ngramCounts.set(context, new Map());
    const contextMap = memory.ngramCounts.get(context)!;
    contextMap.set(nextWord, (contextMap.get(nextWord) ?? 0) + 1);
  }
}

export function trainOnText(texts: string[]): number {
  let samplesProcessed = 0;
  for (const text of texts) {
    if (!text || text.trim().length === 0) continue;
    const tokens = tokenize(text);
    if (tokens.length < 2) continue;
    updateNgramCounts(tokens);
    samplesProcessed++;
  }
  memory.totalSamples += samplesProcessed;
  memory.lastTrainedAt = new Date();
  logger.info({ samplesProcessed, totalSamples: memory.totalSamples }, "Model trained");
  return samplesProcessed;
}

function sampleFromDistribution(counts: Map<string, number>): string {
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (const [word, count] of counts.entries()) {
    random -= count;
    if (random <= 0) return word;
  }
  return Array.from(counts.keys())[0] ?? UNK_TOKEN;
}

function generateFromContext(contextTokens: string[], maxTokens: number): string {
  const generated: string[] = [];
  let context = [START_TOKEN, START_TOKEN, START_TOKEN];
  if (contextTokens.length > 0) {
    context = [...context.slice(Math.max(0, context.length - CONTEXT_SIZE + contextTokens.length)), ...contextTokens.slice(-CONTEXT_SIZE)].slice(-CONTEXT_SIZE);
  }
  for (let i = 0; i < maxTokens; i++) {
    const contextKey = context.join(" ");
    const nextWordCounts = memory.ngramCounts.get(contextKey);
    if (!nextWordCounts || nextWordCounts.size === 0) {
      const fallbackCounts = memory.ngramCounts.get(context.slice(1).join(" "));
      if (!fallbackCounts || fallbackCounts.size === 0) break;
      const next = sampleFromDistribution(fallbackCounts);
      if (next === END_TOKEN) break;
      generated.push(next);
      context = [...context.slice(1), next];
    } else {
      const next = sampleFromDistribution(nextWordCounts);
      if (next === END_TOKEN) break;
      generated.push(next);
      context = [...context.slice(1), next];
    }
  }
  return generated.join(" ");
}

// ─── Zengin Türkçe yanıt havuzu ──────────────────────────────────────────────

const RESPONSES: Record<string, string[]> = {
  greeting: [
    "Merhaba! Ben QuantumAI. Size nasıl yardımcı olabilirim?",
    "Selam! Bugün ne öğrenmek ya da keşfetmek istersiniz?",
    "Merhaba! Sorularınızı duymaktan memnuniyet duyarım.",
    "Günaydın! QuantumAI olarak her türlü sorunuzda yanınızdayım.",
  ],
  farewell: [
    "Görüşmek üzere! İyi günler dilerim.",
    "Hoşça kalın! Başka sorularınız olursa buradayım.",
    "Güle güle! Her zaman yardımcı olmaktan memnuniyet duyarım.",
  ],
  thanks: [
    "Ne demek, her zaman buradayım!",
    "Rica ederim! Başka sorularınız olursa çekinmeyin.",
    "Yardımcı olabildiğime sevindim! Başka bir şey var mı?",
    "Teşekkür ederim, güzel sözleriniz için. Yardımcı olabilmek benim için büyük bir zevk!",
  ],
  who: [
    "Ben QuantumAI — Türkçe dil destekli bir yapay zeka asistanıyım. Sohbet geçmişinizden öğrenerek yanıtlarımı geliştiriyorum.",
    "QuantumAI olarak hizmetinizdeyim. Quantum n-gram modeli ile güçlendirilmiş, Türkçe konuşan bir AI asistanıyım.",
    "Adım QuantumAI. Sorularınıza yardımcı olmak, bilgi paylaşmak ve sohbet etmek için buradayım.",
  ],
  technology: [
    "Teknoloji, modern dünyamızı şekillendiren en güçlü araçlardan biri. Yapay zeka, bulut bilişim ve nesnelerin interneti gibi alanlar hız kesmeden gelişiyor. Bu konuda özellikle merak ettiğiniz bir alan var mı?",
    "Günümüz teknolojisi inanılmaz bir hızla ilerliyor. Yazılım geliştirmeden kuantum bilgisayarlara kadar pek çok alanda devrimler yaşanıyor. Hangi teknolojiyle ilgileniyorsunuz?",
    "Teknoloji dünyası çok geniş bir alan. Yapay zeka, siber güvenlik, mobil uygulama geliştirme, blockchain — bunların hangisi hakkında konuşmak istersiniz?",
  ],
  ai: [
    "Yapay zeka, makine öğrenimi ve derin öğrenme yöntemleriyle büyük veri setlerinden örüntüler öğrenir. GPT gibi dil modelleri, milyarlarca metin örneği üzerinde eğitilerek insan benzeri metin üretebilir hale gelmiştir.",
    "Yapay zekanın üç temel dalı var: dar yapay zeka (belirli görevlerde uzman), genel yapay zeka (insan düzeyinde) ve süper yapay zeka (insanı aşan). Bugün elimizdeki sistemler büyük ölçüde dar yapay zeka kategorisinde.",
    "Makine öğrenmesi, bilgisayarlara açıkça programlanmadan öğrenme yeteneği kazandırır. Gözetimli öğrenme, gözetimsiz öğrenme ve pekiştirmeli öğrenme olmak üzere üç temel yöntemi vardır.",
  ],
  science: [
    "Bilim, gözlem ve deneye dayalı bilgi üretme sürecidir. Fizikten biyolojiye, kimyadan astronomiye kadar geniş bir yelpazede insanlığın anlayışını genişletir. Hangi bilim dalı sizi daha çok ilgilendiriyor?",
    "Bilimsel yöntem; hipotez kurma, deney tasarlama, veri toplama ve sonuç çıkarma adımlarını içerir. Bu döngü, sayısız keşfin temelini oluşturmaktadır.",
    "Modern bilim, disiplinler arası çalışmaları giderek daha fazla benimsiyor. Biyoinformatik, nöromühendislik gibi alanlar farklı bilimlerin kesişim noktalarında doğuyor.",
  ],
  math: [
    "Matematik, evrenin dili olarak kabul edilir. Cebir, geometri, hesap, istatistik ve daha pek çok dalıyla hem teorik hem de uygulamalı bilimde vazgeçilmez bir rol oynar.",
    "Matematikte problem çözmenin püf noktası: önce problemi iyice anlamak, sonra onu daha küçük parçalara bölmek, ardından her parçayı ayrı ayrı çözmek ve son olarak çözümleri birleştirmek.",
    "Sayı teorisinden topolojiye, olasılıktan diferansiyel denklemlere kadar matematiğin her dalı kendi içinde derin ve büyüleyici bir evren barındırır.",
  ],
  history: [
    "Tarih, geçmişteki insan deneyimlerini inceler ve bize bugünü anlamak için bağlam sağlar. Antik uygarlıklardan modern dönemlere uzanan bu yolculuk, insanlığın nasıl şekillendiğini gösterir.",
    "Tarih yazımı (historiografi) sürekli gelişiyor. Aynı olaylar bile farklı kaynaklardan ve farklı perspektiflerden incelendiğinde çok boyutlu bir tablo ortaya çıkabiliyor.",
    "Tarihin tekrarlandığı söylenir. Geçmiş dönemlerdeki siyasi, ekonomik ve sosyal krizleri incelemek, günümüzdeki benzer süreçleri anlamlandırmada büyük yardım sağlar.",
  ],
  health: [
    "Sağlıklı bir yaşam için dengeli beslenme, düzenli egzersiz, yeterli uyku ve stres yönetimi büyük önem taşır. Bu dört temel üzerine inşa edilen bir yaşam tarzı, pek çok hastalığın önlenmesine yardımcı olur.",
    "Ruh sağlığı, fiziksel sağlık kadar önemlidir. Düzenli meditasyon, sosyal bağlantılar ve hobiler genel iyilik halinizi önemli ölçüde artırabilir.",
    "Sağlık konularında bir doktora danışmak her zaman en doğru yoldur. Ancak genel sağlık bilgisi edinmek ve bilinçli alışkanlıklar geliştirmek için yardımcı olabilirim.",
  ],
  food: [
    "Türk mutfağı, Orta Asya'dan Akdeniz'e uzanan zengin bir kültürel mirasın ürünüdür. Kebaplar, mezeler, börekler ve tatlılarla dünyanın en çeşitli mutfaklarından birini oluşturur.",
    "Beslenme bilimi sürekli gelişiyor. Bugün bildiğimiz şu: tam tahıllar, sebzeler, meyveler, sağlıklı yağlar ve yeterli protein içeren dengeli bir diyet genel sağlığı destekler.",
    "Yemek pişirmek hem bir sanat hem de bir bilimdir. Doğru malzemeleri doğru teknikle bir araya getirmek, lezzetli ve besleyici yemekler ortaya çıkarır.",
  ],
  sports: [
    "Düzenli spor yapmak hem fiziksel hem de zihinsel sağlığa büyük katkı sağlar. Haftada en az 150 dakika orta yoğunlukta aerobik egzersiz önerilir.",
    "Türkiye'de futbol tartışmasız en popüler spor. Ancak basketbol, voleybol, güreş ve atletizm de önemli başarılar elde edilen branşlar arasında yer alıyor.",
    "Spor sadece fiziksel bir aktivite değil; disiplin, takım ruhu ve azim gibi değerleri de öğretir. Hangi sporla ilgileniyorsunuz?",
  ],
  music: [
    "Müzik, evrensel bir dil olarak tüm kültürlerde insanları bir araya getirir. Türk müziği ise makamsal yapısı ve zengin ritim anlayışıyla dünya müziğinde ayrı bir yere sahiptir.",
    "Müziğin insan psikolojisi üzerindeki etkileri bilimsel olarak kanıtlanmıştır. Doğru müzikle çalışmak, konsantrasyonu artırabilir ve stresi azaltabilir.",
    "Klasikten caza, rock'tan elektronik müziğe kadar her türün kendine özgü tarihi ve kültürel bağlamı vardır. Hangi müzik türünü tercih ediyorsunuz?",
  ],
  nature: [
    "Doğa, milyarlarca yıllık evrim sürecinin mükemmel bir ürünüdür. Ekosistemlerin karmaşık yapısı, her canlının birbiriyle nasıl bağlantılı olduğunu ortaya koyar.",
    "İklim değişikliği, günümüzün en büyük çevre sorunlarından biri. Yenilenebilir enerji, sürdürülebilir tarım ve karbon azaltımı bu soruna çözüm üretmede kritik öneme sahip.",
    "Türkiye'nin biyoçeşitlilik açısından inanılmaz zengin bir coğrafyası var. Dağlardan ovalara, kıyılardan orman alanlarına kadar pek çok farklı ekosistemi barındırıyor.",
  ],
  education: [
    "Eğitim, bireyin ve toplumun gelişiminde en temel araçlardan biridir. Aktif öğrenme, eleştirel düşünme ve yaratıcılığı teşvik eden eğitim yaklaşımları en etkili sonuçları veriyor.",
    "Günümüzde online eğitim platformları sayesinde dünyanın herhangi bir yerinden kaliteli içeriklere erişmek mümkün. Sürekli öğrenme (lifelong learning) modern çağın zorunluluğu haline geldi.",
    "Bir konuyu öğrenmenin en iyi yolu onu başkasına öğretmektir. Feynman tekniği olarak bilinen bu yöntemde, öğrendiğiniz şeyi basit bir dille açıklamaya çalışırsınız.",
  ],
  programming: [
    "Programlama öğrenmek için önce temel kavramları (değişkenler, döngüler, koşullar, fonksiyonlar) sağlam öğrenmek gerekir. Python, başlangıç için ideal bir dil: sade sözdizimi ve geniş kütüphane ekosistemi ile.",
    "Yazılım geliştirmede en önemli beceri problem çözme yeteneğidir. Bir problemi küçük parçalara bölmek, her parçayı ayrıca çözmek ve sonra birleştirmek temel yaklaşımdır.",
    "Modern web geliştirme için HTML/CSS, JavaScript ve bir framework (React, Vue, Angular) öğrenmek iyi bir başlangıç noktası. Backend için Node.js, Python veya Go popüler tercihler arasında.",
  ],
  economy: [
    "Ekonomi, kıt kaynakların nasıl dağıtıldığını inceler. Mikro ekonomi bireysel kararları, makro ekonomi ise ülke ölçeğindeki büyüme, enflasyon ve işsizlik gibi olguları ele alır.",
    "Enflasyon, para biriminin satın alma gücünün düşmesidir. Merkez bankaları faiz oranlarını ayarlayarak enflasyonu kontrol altında tutmaya çalışır.",
    "Türkiye ekonomisi; sanayi, hizmetler ve tarım sektörlerinden oluşan karma bir yapıya sahiptir. İhracat çeşitlendirmesi ve üretim kapasitesi artışı uzun vadeli büyüme için kritik öneme sahiptir.",
  ],
  philosophy: [
    "Felsefe, varlık, bilgi, ahlak ve güzellik gibi temel soruları araştırır. Sokrates'ten Kant'a, Nietzsche'den Wittgenstein'a uzanan düşünce tarihi insanlığın en derin sorularına cevap arar.",
    "Epistemoloji, bilginin doğasını ve sınırlarını sorgular: 'Neyi bilebiliriz?' sorusunu merkezine alır. Etik ise 'Nasıl yaşamalıyız?' sorusunu araştırır.",
    "Felsefe okumak, düşünme biçimimizi geliştirmek için harika bir araçtır. Marcus Aurelius'un Düşünceler'i veya Plato'nun diyalogları başlamak için güzel seçenekler.",
  ],
  help: [
    "Elbette yardımcı olabilirim! Lütfen sorunuzu biraz daha ayrıntılı açıklar mısınız?",
    "Sizi dinliyorum. Ne konuda yardıma ihtiyacınız var?",
    "Tabii ki! Bu konuda elimden gelen her türlü bilgiyi paylaşmaya hazırım.",
  ],
  default: [
    "Bu gerçekten düşündürücü bir konu. Daha fazla detay paylaşırsanız daha kapsamlı bir yanıt verebilirim.",
    "İlginç bir soru. Birden fazla perspektiften değerlendirmek gerekiyor — hangi boyutunu konuşmak istersiniz?",
    "Anlıyorum. Bu konuda size en doğru bilgiyi sunmak için biraz daha bağlam alabilir miyim?",
    "Bu meseleyi farklı açılardan ele almak mümkün. Öncelikle hangi yönünü merak ettiğinizi öğrenebilir miyim?",
    "Sorunuzu inceliyorum. Konuyu daha iyi anlayabilmek için ek bilgi paylaşabilirseniz çok daha faydalı olabilirim.",
  ],
};

type TopicKey = keyof typeof RESPONSES;

interface TopicPattern {
  topic: TopicKey;
  patterns: RegExp[];
}

const TOPIC_PATTERNS: TopicPattern[] = [
  { topic: "greeting",    patterns: [/merhaba|selam|günaydın|iyi akşam|iyi günler|hey|hi\b/] },
  { topic: "farewell",    patterns: [/görüşürüz|hoşça kal|güle güle|bye|baybay|vedalaş/] },
  { topic: "thanks",      patterns: [/teşekkür|sağ ol|eyvallah|çok iyi|harika|süper|mükemmel/] },
  { topic: "who",         patterns: [/kimsin|ne ?sin|adın ne|kendin|sen kimsin|hakkında|tanıt/] },
  { topic: "ai",          patterns: [/yapay zeka|makine öğren|derin öğren|llm|gpt|neural|sinir ağı|algoritma|model/] },
  { topic: "technology",  patterns: [/teknoloji|yazılım|donanım|bilgisayar|uygulama|app|internet|dijital|robot|otomasyon/] },
  { topic: "programming", patterns: [/programlama|kod|python|javascript|react|node|sql|veri tabanı|backend|frontend|web|api/] },
  { topic: "science",     patterns: [/bilim|fizik|kimya|biyoloji|astronomi|uzay|evren|deney|hipotez|keşif/] },
  { topic: "math",        patterns: [/matematik|sayı|hesap|cebir|geometri|istatistik|olasılık|formül|denklem/] },
  { topic: "history",     patterns: [/tarih|osmanlı|cumhuriyet|savaş|imparatorluk|atatürk|antik|orta çağ|devrim/] },
  { topic: "health",      patterns: [/sağlık|hastalık|doktor|ilaç|beslenme|diyet|uyku|egzersiz|spor|wellness|ruh sağlığı/] },
  { topic: "food",        patterns: [/yemek|yiyecek|tarif|mutfak|pişir|malzeme|lezzet|restoran|kahvaltı|akşam yemeği/] },
  { topic: "sports",      patterns: [/spor|futbol|basketbol|voleybol|tenis|atletizm|olimpiyat|maç|takım|şampiyon/] },
  { topic: "music",       patterns: [/müzik|şarkı|melodi|enstrüman|konser|albüm|sanatçı|ritim|nota|rock|jazz/] },
  { topic: "nature",      patterns: [/doğa|çevre|iklim|orman|deniz|dağ|hayvan|bitki|ekosistem|sürdürülebilir/] },
  { topic: "education",   patterns: [/eğitim|okul|üniversite|ders|öğren|kurs|sınav|öğretmen|bilgi|akademik/] },
  { topic: "economy",     patterns: [/ekonomi|para|enflasyon|faiz|borsa|yatırım|bütçe|ticaret|piyasa|döviz/] },
  { topic: "philosophy",  patterns: [/felsefe|anlam|varoluş|ahlak|etik|özgür irade|bilinç|gerçek|hakikat|mutluluk/] },
  { topic: "help",        patterns: [/yardım|nasıl|ne yapayım|öğrenmek|anla|açıkla|söyle/] },
];

function detectTopic(message: string): TopicKey {
  const lower = message.toLowerCase();
  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some((p) => p.test(lower))) return topic;
  }
  return "default";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function buildContextualSuffix(userMessage: string, history: Array<{ role: string; content: string }>): string {
  const words = tokenize(userMessage).filter((w) => w.length > 3);
  const keyTerms = words.slice(0, 3);

  const contextSuffixes = [
    keyTerms.length > 0 ? ` Özellikle "${keyTerms.join(", ")}" konusunu ele alırsak daha verimli bir sohbet yürütebiliriz.` : "",
    history.length > 2 ? " Önceki konuşmamıza bakıldığında bu konunun önemli olduğu anlaşılıyor." : "",
    " Daha fazla bilgi almak ister misiniz?",
  ];

  return contextSuffixes[Math.floor(Math.random() * contextSuffixes.length)] ?? "";
}

export function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const topic = detectTopic(userMessage);
  const responses = RESPONSES[topic] ?? RESPONSES["default"]!;
  let base = pickRandom(responses);

  // n-gram katkısı: model yeterlince eğitilmişse ek cümle üret
  if (memory.totalSamples > 10 && topic === "default") {
    const inputTokens = tokenize(userMessage);
    const generated = generateFromContext(inputTokens.slice(-CONTEXT_SIZE), 25);
    if (generated && generated.trim().length > 15) {
      const capitalized = generated.charAt(0).toUpperCase() + generated.slice(1);
      base += " " + capitalized + ".";
    }
  }

  // Uzun konuşmalarda bağlamsal ek
  if (conversationHistory.length > 1 && Math.random() > 0.5) {
    base += buildContextualSuffix(userMessage, conversationHistory);
  }

  return base;
}

export function getModelStatus() {
  return {
    name: "quantum-ai-0.1",
    version: "0.1",
    isReady: true,
    vocabSize: memory.vocab.size,
    totalTrainingSamples: memory.totalSamples,
    lastTrainedAt: memory.lastTrainedAt ? memory.lastTrainedAt.toISOString() : null,
  };
}

export function getMemory(): ModelMemory {
  return memory;
}
