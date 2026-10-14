
// Registers an anonymous push token. No accounts, no personal data.
// Rate limits: 20 requests / 10 min per IP, 30 requests / hour per token.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const token = String(body?.expo_push_token ?? '');
  if (!/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token)) return json({ error: 'invalid token' }, 400);
  const platform = ['android', 'ios', 'web'].includes(body?.platform) ? body.platform : null;
  const notifyTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(body?.notify_time ?? '')) ? String(body.notify_time) : '06:00';
  const evening = body?.evening_reminder !== false;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const [ipHash, tokenHash] = await Promise.all([sha256(ip), sha256(token)]);
  const since10m = new Date(Date.now() - 10 * 60000).toISOString();
  const since1h = new Date(Date.now() - 3600000).toISOString();
  const [{ count: ipCount }, { count: tokenCount }] = await Promise.all([
    supabase.from('register_events').select('*', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since10m),
    supabase.from('register_events').select('*', { count: 'exact', head: true }).eq('token_hash', tokenHash).gte('created_at', since1h),
  ]);
  if ((ipCount ?? 0) >= 20 || (tokenCount ?? 0) >= 30) return json({ error: 'rate limited' }, 429);
  await supabase.from('register_events').insert({ ip_hash: ipHash, token_hash: tokenHash });
  const { error } = await supabase.from('devices').upsert(
    { expo_push_token: token, platform, notify_time: notifyTime, evening_reminder: evening, last_seen_at: new Date().toISOString(), disabled: false },
    { onConflict: 'expo_push_token' });
  if (error) return json({ error: 'store failed' }, 500);
  return json({ ok: true });
});
