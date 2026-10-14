
// Backend access with NO auth and NO Supabase client library in the app.
// Reads use the public REST endpoint with the anon key; the daily_quiz table
// has a read-only RLS policy for everyone. Push-token registration goes
// through the rate-limited register-device edge function. No accounts,
// no emails, no names, no passwords - a device is only its push token.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const backendConfigured = url.startsWith('https://') && anon.length > 10;
export const backendUrl = url;

export async function restGetDailyQuiz(query: string): Promise<unknown[]> {
  const res = await fetch(`${url}/rest/v1/daily_quiz?${query}`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`REST ${res.status}`);
  return (await res.json()) as unknown[];
}

export async function registerDevice(payload: { expo_push_token: string; platform: string; notify_time: string; evening_reminder: boolean }): Promise<boolean> {
  if (!backendConfigured) return false;
  try {
    const res = await fetch(`${url}/functions/v1/register-device`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch { return false; }
}
