
-- Push-token registration moves behind the register-device edge function.
-- The anon key can no longer write the devices table at all.
drop policy if exists "device self register" on public.devices;
drop policy if exists "device self update" on public.devices;

create table if not exists public.register_events (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  token_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists register_events_ip_idx on public.register_events (ip_hash, created_at desc);
create index if not exists register_events_token_idx on public.register_events (token_hash, created_at desc);
alter table public.register_events enable row level security;
-- No policies: only the service role (edge functions) can read or write it.
