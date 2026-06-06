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

  for (const token of tokens) {
    addToVocab(token);
  }

  for (let i = CONTEXT_SIZE; i < sequence.length; i++) {
    const context = sequence.slice(i - CONTEXT_SIZE, i).join(" ");
    const nextWord = sequence[i]!;

    if (!memory.ngramCounts.has(context)) {
      memory.ngramCounts.set(context, new Map());
    }

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
    context = [
      ...context.slice(Math.max(0, context.length - CONTEXT_SIZE + contextTokens.length)),
      ...contextTokens.slice(-CONTEXT_SIZE),
    ].slice(-CONTEXT_SIZE);
  }

  for (let i = 0; i < maxTokens; i++) {
    const contextKey = context.join(" ");
    const nextWordCounts = memory.ngramCounts.get(contextKey);

    if (!nextWordCounts || nextWordCounts.size === 0) {
      const fallbackContext = context.slice(1).join(" ");
      const fallbackCounts = memory.ngramCounts.get(fallbackContext);
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

const TURKISH_RESPONSES_BY_TOPIC: Record<string, string[]> = {
  greeting: [
    "Merhaba! Size nasıl yardımcı olabilirim?",
    "Selam! Bugün ne öğrenmek istersiniz?",
    "Merhaba! QuantumAI olarak size yardımcı olmaya hazırım.",
  ],
  help: [
    "Elbette yardımcı olabilirim. Lütfen sorunuzu daha ayrıntılı açıklar mısınız?",
    "Size yardımcı olmak için buradayım. Ne bilmek istiyorsunuz?",
    "Tabii ki! Bu konuda size kapsamlı bilgi sunabilirim.",
  ],
  thanks: [
    "Ne demek, her zaman buradayım!",
    "Rica ederim, başka bir sorunuz olursa çekinmeyin.",
    "Yardımcı olabildiğime sevindim!",
  ],
  default: [
    "Bu ilginç bir konu. Daha fazla detay paylaşabilir misiniz?",
    "Anlıyorum. Bu konuda size yardımcı olmaya çalışacağım.",
    "Sorunuzu inceliyorum. Aklıma gelen birkaç önemli nokta var.",
    "Bu meseleye farklı açılardan bakmak gerekiyor.",
    "Kesinlikle düşündürücü bir soru. Şöyle bir perspektiften değerlendirelim.",
  ],
};

function detectTopicAndRespond(userMessage: string, conversationHistory: string[]): string {
  const lower = userMessage.toLowerCase();

  if (/merhaba|selam|günaydın|iyi akşam|iyi günler/.test(lower)) {
    const responses = TURKISH_RESPONSES_BY_TOPIC.greeting!;
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  if (/teşekkür|sağ ol|eyvallah/.test(lower)) {
    const responses = TURKISH_RESPONSES_BY_TOPIC.thanks!;
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  if (/yardım|nasıl|ne yapayım|öğrenmek/.test(lower)) {
    const responses = TURKISH_RESPONSES_BY_TOPIC.help!;
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  if (memory.totalSamples > 5) {
    const inputTokens = tokenize(userMessage);
    const generated = generateFromContext(inputTokens.slice(-CONTEXT_SIZE), 30);
    if (generated && generated.trim().length > 10) {
      const capitalized = generated.charAt(0).toUpperCase() + generated.slice(1);
      return capitalized + ".";
    }
  }

  const ctxResponses = TURKISH_RESPONSES_BY_TOPIC.default!;
  let response = ctxResponses[Math.floor(Math.random() * ctxResponses.length)]!;

  if (conversationHistory.length > 0) {
    const topicHints = [
      " Bu bağlamda şunu söyleyebilirim:",
      " Konuya daha geniş bir perspektiften bakalım:",
      " Şu noktayı özellikle vurgulamak isterim:",
    ];
    const hint = topicHints[Math.floor(Math.random() * topicHints.length)]!;
    response += hint + " " + generateContextualSentence(userMessage);
  }

  return response;
}

function generateContextualSentence(input: string): string {
  const words = tokenize(input);
  const sentences = [
    `"${words.slice(0, Math.min(3, words.length)).join(" ")}" hakkında daha fazla bilgi için araştırma yapmanızı öneririm.`,
    "Bu konuyu birkaç farklı boyutuyla ele almak mümkün.",
    "Konuya ilişkin farklı kaynaklardan bilgi edinmek faydalı olacaktır.",
    "Bu meseleyi çözmek için adım adım ilerleyelim.",
  ];
  return sentences[Math.floor(Math.random() * sentences.length)]!;
}

export function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const historyTexts = conversationHistory.map((m) => m.content);
  return detectTopicAndRespond(userMessage, historyTexts);
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
