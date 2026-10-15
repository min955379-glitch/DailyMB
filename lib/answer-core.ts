
// DailyMB shared answer logic. Canonical copy lives here.
// scripts/sync-shared.mjs copies this file to supabase/functions/_shared/answer-core.ts
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
  // Group by the QUESTION, not the number: sources sometimes publish different
  // (stale) question sets, and matching by number alone would glue one set's
  // questions to another set's answers. A question is verified when >=2
  // independent sources give the same answer to the same question.
  //
  // EVERY answer cluster inside a text group becomes a slot candidate, not
  // just the strongest one. Live failure 2026-10-15: the day's real set used
  // the stem "Which sentence is correct?" for Q1, Q4 AND Q5, so text grouping
  // merged three different questions into one group and only the Q1 answer
  // cluster survived; slots 4/5 were then won by stale single-source
  // questions from lagging sources. With per-cluster candidates, the real
  // Q4/Q5 clusters (backed by agreeing sources) claim their own slots and
  // outrank any single-source stale question for the same number.
  type Entry = { source: string; q: ParsedQuestion };
  const groups = new Map<string, Entry[]>();
  for (const r of results) for (const q of r.questions) {
    const key = normalizeText(q.questionText);
    if (!key) continue;
    const arr = groups.get(key) ?? []; arr.push({ source: r.sourceName, q }); groups.set(key, arr);
  }
  type Candidate = { no: number; score: number; order: number; v: VerifiedQuestion };
  const candidates: Candidate[] = [];
  let order = 0;
  for (const entries of groups.values()) {
    order += 1;
    const clusters = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = normalizeText(e.q.correctText);
      const arr = clusters.get(k) ?? []; arr.push(e); clusters.set(k, arr);
    }
    const totalSources = new Set(entries.map((e) => e.source)).size;
    const allAnswers = [...clusters.values()].map((arr) => (arr[0] as Entry).q.correctText);
    let clusterOrder = 0;
    for (const arr of clusters.values()) {
      clusterOrder += 1;
      const agreeing = new Set(arr.map((e) => e.source)).size;
      const numCount = new Map<number, number>();
      for (const e of arr) numCount.set(e.q.questionNo, (numCount.get(e.q.questionNo) ?? 0) + 1);
      const no = [...numCount.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
      if (no < 1 || no > 5) continue;
      const rep = arr[0] as Entry;
      const confidence: Confidence = agreeing >= 2 ? 'verified' : totalSources >= 2 ? 'uncertain' : 'single_source';
      candidates.push({ no, score: agreeing, order: order * 100 + clusterOrder, v: {
        questionNo: no,
        questionText: rep.q.questionText,
        options: rep.q.options,
        correctText: rep.q.correctText,
        correctLetter: letterForOption(rep.q.options, rep.q.correctText),
        confidence,
        candidates: allAnswers,
        sources: [...new Set(arr.map((e) => e.source))],
        agreeingSources: agreeing,
      }});
    }
  }
  // One winner per number: the question with the most agreeing sources.
  const byNo = new Map<number, Candidate>();
  for (const c of [...candidates].sort((a, b) => b.score - a.score || a.order - b.order)) {
    if (!byNo.has(c.no)) byNo.set(c.no, c);
  }
  return [...byNo.values()].map((c) => c.v).sort((a, b) => a.questionNo - b.questionNo);
}

export interface StoredQuizRow { questionNo: number; questionText: string; confidence: Confidence; }
export interface WritePlan { toUpsert: VerifiedQuestion[]; toDelete: number[]; }

const CONFIDENCE_RANK: Record<Confidence, number> = { verified: 3, uncertain: 2, single_source: 1 };

// Decide how one fetch run may change the rows already stored for today.
// Live failure 2026-10-15: stale Q4/Q5 sat in today's set as single_source
// rows all day (written because crossVerify dropped the fresh Q4/Q5 - see
// the repeated-stem note there) and no later run ever removed them, so the
// app showed 2 wrong answers for hours. Rules:
//  1. Never downgrade: a stored row is replaced only by evidence of equal
//     or higher confidence (a lagging source must not overwrite a verified
//     answer with a stale single-source one).
//  2. Orphan cleanup: if a run verifies >=3 questions but does not report a
//     number at all, a stored single_source row for that number is a
//     leftover from an earlier partial/stale run — delete it. The app then
//     shows an honest partial set instead of wrong answers, and a later
//     run can refill the number.
export function planDailyQuizWrites(existing: StoredQuizRow[], incoming: VerifiedQuestion[]): WritePlan {
  const existingByNo = new Map(existing.map((r) => [r.questionNo, r]));
  const incomingNos = new Set(incoming.map((q) => q.questionNo));
  const toUpsert: VerifiedQuestion[] = [];
  const toDelete: number[] = [];
  for (const q of incoming) {
    const cur = existingByNo.get(q.questionNo);
    if (!cur || CONFIDENCE_RANK[q.confidence] >= CONFIDENCE_RANK[cur.confidence]) toUpsert.push(q);
  }
  const verifiedIncoming = incoming.filter((q) => q.confidence === 'verified').length;
  if (verifiedIncoming >= 3) {
    for (const row of existing) {
      if (!incomingNos.has(row.questionNo) && row.confidence === 'single_source') toDelete.push(row.questionNo);
    }
  }
  return { toUpsert, toDelete };
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
    // Decode numeric entities (&#8217; etc.) BEFORE &amp; so a question like
    // "I&#8217;m looking forward..." normalizes to the same text as the
    // "I'm ..." spelling on other sites and groups with it in crossVerify.
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&rsquo;|&lsquo;|&apos;/gi, "'").replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/\r/g, '');
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
    const blocks = text.split(/(?=(?:Question|Q\.?)\s*(?:No\.?\s*:?\s*)?0?[1-5]\b)/i);
    const found: ParsedQuestion[] = [];
    for (const block of blocks) {
      const head = block.match(/(?:Question|Q\.?)\s*(?:No\.?\s*:?\s*)?0?([1-5])\s*[:.)-]?\s*([^\n]{3,300})/i);
      if (!head) continue;
      const questionNo = Number(head[1]);
      const questionText = cleanLine(head[2] ?? '');
      // Take the EARLIEST answer match in the block across all patterns.
      // The last block runs to the end of the page, and a later boilerplate
      // section can contain its own "Correct Answer" text; pattern priority
      // alone let such a footer match win over the question's real answer
      // (live failure 2026-10-15: Q5's answer was captured as "s." from a
      // footer and the question was dropped as invalid).
      const ansPatterns = [
        /Answer\s+is\s+option\s*\**\s*([^\n]{1,200})/i,
        /Correct\s+Answer\s*[:\-]?\s*\**\s*([^\n]{1,200})/i,
        /\n\s*Answer\s*\n\s*\**\s*([^\n]{1,200})/i,
        /==\s*Answer\s*[:\-]?\s*([^\n=]{1,200})/i,
      ];
      let ansMatch: RegExpMatchArray | null = null;
      for (const p of ansPatterns) {
        const m = block.match(p);
        if (m && (ansMatch === null || (m.index ?? Infinity) < (ansMatch.index ?? Infinity))) ansMatch = m;
      }
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
    // Merge the answer-anchored parse: fill numbers the block parser missed,
    // and replace a block entry whose "question text" is clearly page prose
    // (long intro / explanation lines some layouts put next to the badge
    // number) with the anchored entry's shorter, real question text.
    for (const f of parseAnswerAnchored(html)) {
      const cur = found.find((x) => x.questionNo === f.questionNo);
      if (!cur) found.push(f);
      else if (cur.questionText.length > 140 && f.questionText.length <= 140) found[found.indexOf(cur)] = f;
    }
    return found.sort((a, b) => a.questionNo - b.questionNo);
  } catch { return []; }
}


// Fallback: anchor on the answer lines and read the segment before each one.
// Handles layouts where the question number is a separate badge ("01") and
// the question/options are plain lines ending with "Correct Answer: X".
export function parseAnswerAnchored(html: string): ParsedQuestion[] {
  try {
    const lines = stripHtml(html).split('\n').map(cleanLine).filter(Boolean);
    const answerAt: { idx: number; text: string }[] = [];
    lines.forEach((line, idx) => {
      const m = line.match(/^(?:Correct\s+Answer|Answer(?:\s+is\s+option)?)\s*[:\-]?\s*(.{1,200})$/i);
      if (m && !/question/i.test(line)) answerAt.push({ idx, text: cleanLine(m[1] ?? '').replace(/\(Option\s*[A-E]\)/i, '').trim() });
      // Layout variant: a bare "Answer" line with the answer on the next line.
      // idx points at the answer TEXT line so segment boundaries stay aligned.
      else if (/^answer\s*:?$/i.test(line) && lines[idx + 1]) answerAt.push({ idx: idx + 1, text: cleanLine(lines[idx + 1] ?? '').replace(/\(Option\s*[A-E]\)/i, '').trim() });
    });
    const out: ParsedQuestion[] = [];
    answerAt.slice(0, 5).forEach((ans, order) => {
      const start = order === 0 ? 0 : (answerAt[order - 1]?.idx ?? 0) + 1;
      let segment = lines.slice(Math.max(start, ans.idx - 8), ans.idx);
      segment = segment.filter((l) => !/^0?[1-5]$/.test(l) && !/answers today|updated:|questions ·|verified from|verified answers|fresh quiz/i.test(l) && !/^why\b/i.test(l));
      if (segment.length < 3) return;
      let questionText = segment[0] ?? '';
      questionText = questionText.replace(/^(?:Question|Q\.?)\s*(?:No\.?\s*:?\s*)?0?[1-5]\s*[:.)-]?\s*/i, '').trim();
      const options = [...new Map(segment.slice(1).map((o) => o.replace(/^[-A-E][.)]\s*/, '').trim()).filter(Boolean).map((o) => [normalizeText(o), o] as const)).values()];
      const candidate = { questionNo: order + 1, questionText, options, correctText: ans.text };
      if (validateParsed(candidate)) out.push(candidate);
    });
    return out;
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
