
// GET /functions/v1/health - simple status for uptime checks / the Settings screen link.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { karachiToday } from '../_shared/answer-core.ts';
Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const date = karachiToday();
  const [{ data: lastRun }, { count: todayCount }, { count: sourcesEnabled }, { count: failures24h }] = await Promise.all([
    supabase.from('quiz_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('daily_quiz').select('*', { count: 'exact', head: true }).eq('date', date).eq('confidence', 'verified'),
    supabase.from('sources').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('fetch_logs').select('*', { count: 'exact', head: true }).eq('ok', false).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
  ]);
  const healthy = !!lastRun && lastRun.status !== 'failed' && (todayCount ?? 0) > 0;
  return new Response(JSON.stringify({ healthy, date, verifiedToday: todayCount ?? 0, sourcesEnabled: sourcesEnabled ?? 0, failuresLast24h: failures24h ?? 0, lastRun }), { status: healthy ? 200 : 503, headers: { 'Content-Type': 'application/json' } });
});
