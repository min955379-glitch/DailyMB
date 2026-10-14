// SYNCED COPY of lib/answer-core.ts - edit the lib copy, then run: npm run sync-shared
// Keep it dependency-free so it runs in Deno, Node (tests) and React Native.

export interface ParsedQuestion {
  questionNo: number;
  questionText: string;
  options: string[];
  correctText: string;
}
export interface SourceResult { sourceName: string; questions: ParsedQuestion[]; }
export type Confidence = 'verified' | 'uncertain' | 'single_source';
export interface VerifiedQuestion {
  questionNo: number;
  questionText: string;
  options: string[];
  correctText: string;
  correctLetter: string; // A-E, following the FIRST source's option order
  confidence: Confidence;
  candidates: string[]; // disagreeing correct texts, only for uncertain
  sources: string[];
  agreeingSources: number;
}

export function normalizeText(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function textsEqual(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b);
}
export function letterForOption(options: string[], correctText: string): string {
  const idx = options.findIndex((o) => textsEqual(o, correctText));
  return idx >= 0 ? String.fromCharCode(65 + idx) : '?';
}

export function crossVerify(results: SourceResult[]): VerifiedQuestion[] {
  const byNo = new Map<number, { votes: Map<string, { text: string; sources: string[] }>; base: ParsedQuestion; allSources: string[] }>();
  for (const result of results) {
    for (const q of result.questions) {
      if (q.questionNo < 1 || q.questionNo > 5) continue;
      const entry = byNo.get(q.questionNo) ?? { votes: new Map<string, { text: string; sources: string[] }>(), base: q, allSources: [] as string[] };
      // Longest question text / option list wins as the display base (most complete source).
      if (q.questionText.length > entry.base.questionText.length) entry.base = q;
      const key = normalizeText(q.correctText);
      const vote = entry.votes.get(key) ?? { text: q.correctText, sources: [] as string[] };
      if (!vote.sources.includes(result.sourceName)) vote.sources.push(result.sourceName);
      entry.votes.set(key, vote);
      if (!entry.allSources.includes(result.sourceName)) entry.allSources.push(result.sourceName);
      byNo.set(q.questionNo, entry);
    }
  }
  const out: VerifiedQuestion[] = [];
  for (const [questionNo, entry] of [...byNo.entries()].sort((a, b) => a[0] - b[0])) {
    const ranked = [...entry.votes.values()].sort((a, b) => b.sources.length - a.sources.length);
    const top = ranked[0]!;
    const second = ranked[1];
    const confidence: Confidence =
      top.sources.length >= 2 ? 'verified' : entry.allSources.length >= 2 && second ? 'uncertain' : 'single_source';
    // If two+ sources agree on the top answer it is verified even if a third disagrees.
    const candidates = confidence === 'uncertain' ? ranked.map((r) => r.text) : [];
    out.push({
      questionNo,
      questionText: entry.base.questionText,
      options: entry.base.options,
      correctText: top.text,
      correctLetter: letterForOption(entry.base.options, top.text),
      confidence: top.sources.length >= 2 ? 'verified' : confidence,
      candidates,
      sources: entry.allSources,
      agreeingSources: top.sources.length,
    });
  }
  return out;
}

export function validateParsed(q: ParsedQuestion): boolean {
  return (
    q.questionNo >= 1 && q.questionNo <= 5 &&
    q.questionText.trim().length >= 3 &&
    q.options.length >= 2 && q.options.length <= 6 &&
    q.options.some((o) => textsEqual(o, q.correctText))
  );
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'").replace(/\r/g, '');
}

function cleanLine(s: string): string { return s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); }

// Generic tolerant parser: works on rendered text extracted from HTML.
// Recognises the patterns used by the current answer sites (checked 2026-10-14):
//  A) "Question 1: <text>" ... options ... "Answer is option <text>" / "Answer <text>"
//  B) "<text>" ... options ... "Correct Answer: <text>"
//  C) numbered block with an option suffixed by a check mark character
// It never throws: malformed input returns [].
export function parseGeneric(html: string): ParsedQuestion[] {
  try {
    const text = stripHtml(html);
    const blocks = text.split(/(?=(?:Question|Q\.?)\s*(?:No\.?\s*)?[1-5]\b)/i);
    const found: ParsedQuestion[] = [];
    for (const block of blocks) {
      const head = block.match(/(?:Question|Q\.?)\s*(?:No\.?\s*)?([1-5])\s*[:.)-]?\s*([^\n]{3,300})/i);
      if (!head) continue;
      const questionNo = Number(head[1]);
      const questionText = cleanLine(head[2] ?? '');
      const ansMatch =
        block.match(/Answer\s+is\s+option\s*\**\s*([^\n]{1,200})/i) ||
        block.match(/Correct\s+Answer\s*[:\-]?\s*\**\s*([^\n]{1,200})/i) ||
        block.match(/\n\s*Answer\s*\n\s*\**\s*([^\n]{1,200})/i) ||
        block.match(/==\s*Answer\s*[:\-]?\s*([^\n=]{1,200})/i);
      if (!ansMatch) continue;
      const correctText = cleanLine(ansMatch[1] ?? '').replace(/\(Option\s*[A-E]\)/i, '').trim();
      if (!correctText) continue;
      // Options: lines between the question line and the answer line.
      const beforeAnswer = block.slice(0, ansMatch.index ?? block.length);
      const rawLines = beforeAnswer.split('\n').map(cleanLine).filter(Boolean).slice(1);
      const options: string[] = [];
      for (const line of rawLines) {
        const stripped = line.replace(/^[-A-E][.)]\s*/, '').replace(/[✓✔]\s*$/, '').trim();
        if (stripped && stripped.length <= 200 && !/^(question|q)\b/i.test(stripped)) options.push(stripped);
      }
      const unique = [...new Map(options.map((o) => [normalizeText(o), o])).values()];
      const candidate = { questionNo, questionText, options: unique, correctText };
      if (validateParsed(candidate) && !found.some((f) => f.questionNo === questionNo)) found.push(candidate);
    }
    return found.sort((a, b) => a.questionNo - b.questionNo);
  } catch { return []; }
}

export const PARSERS: Record<string, (html: string) => ParsedQuestion[]> = {
  generic: parseGeneric,
  'apna4g': parseGeneric,
  'correct-answer-label': parseGeneric,
  'answer-is-option': parseGeneric,
  'question-answer-block': parseGeneric,
};

export function karachiToday(now = new Date()): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
