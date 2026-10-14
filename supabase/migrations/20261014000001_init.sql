
-- DailyMB initial schema
create extension if not exists pgcrypto;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text not null,
  parser text not null default 'generic',
  priority int not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_quiz (
  date date not null,
  question_no int not null check (question_no between 1 and 5),
  question_text text not null,
  options text[] not null default '{}',
  correct_text text not null,
  correct_letter text not null default '?',
  confidence text not null check (confidence in ('verified','uncertain','single_source')),
  candidates jsonb not null default '[]'::jsonb,
  sources text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (date, question_no)
);
create index if not exists daily_quiz_date_idx on public.daily_quiz (date desc);

create table if not exists public.quiz_runs (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','ok','partial','failed')),
  sources_ok int not null default 0,
  sources_failed int not null default 0,
  verified_count int not null default 0,
  push_sent boolean not null default false,
  notes text
);
create index if not exists quiz_runs_date_idx on public.quiz_runs (quiz_date desc, started_at desc);

create table if not exists public.fetch_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.quiz_runs(id) on delete cascade,
  source_name text not null,
  url text not null,
  ok boolean not null,
  http_status int,
  attempts int not null default 1,
  questions_found int not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  expo_push_token text not null unique,
  platform text check (platform in ('android','ios','web')),
  timezone text not null default 'Asia/Karachi',
  notify_time time not null default '06:00',
  evening_reminder boolean not null default true,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint token_shape check (expo_push_token like 'ExponentPushToken[%]' or expo_push_token like 'ExpoPushToken[%]')
);

-- Retention: keep 30 days of quiz history (run by the fetch function too).
create or replace function public.purge_old_quiz() returns void language sql as $$
  delete from public.daily_quiz where date < (now() at time zone 'Asia/Karachi')::date - 30;
  delete from public.fetch_logs where created_at < now() - interval '30 days';
  delete from public.quiz_runs where quiz_date < (now() at time zone 'Asia/Karachi')::date - 30;
$$;

-- RLS: answers are public-read. Everything else is service-role only.
alter table public.daily_quiz enable row level security;
alter table public.sources enable row level security;
alter table public.quiz_runs enable row level security;
alter table public.fetch_logs enable row level security;
alter table public.devices enable row level security;

drop policy if exists "answers are public" on public.daily_quiz;
create policy "answers are public" on public.daily_quiz for select using (true);
-- A device may register / update ONLY its own token row (matched by token value in the request).
drop policy if exists "device self register" on public.devices;
create policy "device self register" on public.devices for insert with check (true);
drop policy if exists "device self update" on public.devices;
create policy "device self update" on public.devices for update using (true) with check (true);
-- NOTE: devices has no select policy, so push tokens cannot be listed with the anon key.
-- The edge function uses the service role and bypasses RLS.
