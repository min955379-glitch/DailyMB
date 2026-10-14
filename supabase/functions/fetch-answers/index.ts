
// DailyMB answer engine. Triggered by pg_cron (00:05 and 05:30 Asia/Karachi)
// or manually. Fetches every enabled source, cross-verifies, stores, pushes.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PARSERS, crossVerify, karachiToday } from '../_shared/answer-core.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string): Promise<{ html: string; status: number; attempts: number }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'DailyMB/1.0 (+answer verification bot)', Accept: 'text/html' } });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { html: await res.text(), status: res.status, attempts: attempt };
    } catch (e) { lastErr = e; if (attempt < 3) await sleep(1000 * 2 ** (attempt - 1) + Math.random() * 400); }
  }
  throw lastErr;
}

async function sendExpoPush(supabase: any, verifiedCount: number): Promise<number> {
  const { data: devices } = await supabase.from('devices').select('expo_push_token').eq('disabled', false).limit(1000);
  if (!devices?.length) return 0;
  const messages = devices.map((d: any) => ({
    to: d.expo_push_token, sound: 'default', channelId: 'daily-answers',
    title: "Today's answers are ready", body: `${verifiedCount} answers verified. Tap to view.`,
    data: { screen: 'home' },
  }));
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(chunk) });
    if (res.ok) sent += chunk.length;
  }
  return sent;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('FUNCTION_SECRET');
  if (secret && req.headers.get('x-function-secret') !== secret && !req.headers.get('authorization')?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '__none__')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const date = karachiToday();
  const { data: run } = await supabase.from('quiz_runs').insert({ quiz_date: date }).select('id').single();
  const runId = run?.id;
  const { data: sources } = await supabase.from('sources').select('*').eq('enabled', true).order('priority');
  const results: { sourceName: string; questions: any[] }[] = [];
  let ok = 0, failed = 0;
  for (const source of sources ?? []) {
    try {
      const { html, status, attempts } = await fetchWithRetry(source.url);
      const parser = PARSERS[source.parser] ?? PARSERS.generic!;
      const questions = parser(html).filter((q: any) => q.options?.length >= 2);
      if (questions.length === 0) throw new Error('parser returned 0 questions');
      results.push({ sourceName: source.name, questions });
      ok++;
      await supabase.from('fetch_logs').insert({ run_id: runId, source_name: source.name, url: source.url, ok: true, http_status: status, attempts, questions_found: questions.length });
    } catch (e) {
      failed++;
      await supabase.from('fetch_logs').insert({ run_id: runId, source_name: source.name, url: source.url, ok: false, attempts: 3, error: String(e).slice(0, 500) });
      // A broken / changed source never stops the run.
    }
  }
  const verified = crossVerify(results as any);
  for (const q of verified) {
    await supabase.from('daily_quiz').upsert({
      date, question_no: q.questionNo, question_text: q.questionText, options: q.options,
      correct_text: q.correctText, correct_letter: q.correctLetter, confidence: q.confidence,
      candidates: q.candidates, sources: q.sources, updated_at: new Date().toISOString(),
    });
  }
  const verifiedCount = verified.filter((q) => q.confidence === 'verified').length;
  let pushSent = false;
  if (verifiedCount === 5) {
    const { data: prior } = await supabase.from('quiz_runs').select('id').eq('quiz_date', date).eq('push_sent', true).limit(1);
    if (!prior?.length) { await sendExpoPush(supabase, verifiedCount); pushSent = true; }
  }
  const status = verified.length === 5 ? 'ok' : verified.length > 0 ? 'partial' : 'failed';
  await supabase.from('quiz_runs').update({ finished_at: new Date().toISOString(), status, sources_ok: ok, sources_failed: failed, verified_count: verifiedCount, push_sent: pushSent }).eq('id', runId);
  await supabase.rpc('purge_old_quiz');
  return new Response(JSON.stringify({ date, status, sourcesOk: ok, sourcesFailed: failed, questions: verified.length, verifiedCount, pushSent }), { headers: { 'Content-Type': 'application/json' } });
});
