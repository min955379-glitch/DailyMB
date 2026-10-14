# DailyMB deployment record

Deployed 2026-10-14. This file records which project holds what. It contains
no secrets: the anon key is a public client key (read-only access via RLS)
and also lives in the app's local `.env`, which is never committed.

## Supabase projects (account: min955379-glitch)

| Project | Ref | Holds | Status |
| --- | --- | --- | --- |
| dailymb | ceukjmqshaboodrxbscz | DailyMB backend: sources, daily_quiz, quiz_runs, fetch_logs, devices, register rate limit | ACTIVE_HEALTHY (ap-south-1, org "Muhammad") |
| blue-peak-store | fulhqtlofohrsytqcbbt | Blue Peak store backend (products, orders, admin auth) | ACTIVE_HEALTHY — do not touch |
| town-fitness-point | kajolpuntjurjrozovnq | Client gym website backend (members, attendance, plans, trainers, forms, auth) | PAUSED 2026-10-14 by owner decision to free the slot for DailyMB |
| ReviewNudge | nnnsbkgtdmvmdmusxjqa | Owner's review tool (testing phase) | INACTIVE (paused earlier) |
| arhms-ai-tool | wceqlafrkuhlacmaajbq | Older experiment | INACTIVE |

## town-fitness-point backup (taken before pausing, 2026-10-14)

`~/workspace/backups/town-fitness-point-2026-10-14/` (outside this repo):
full export of all 23 public tables as JSON, schema inventory (tables,
columns, RLS policies, extensions, db functions), auth users export, storage
buckets + object list + all 5 stored files downloaded, edge function list
(none deployed), project metadata and API keys (config folder, private).

## While town-fitness-point is paused

The gym website itself (pages on Vercel) still loads, but everything backed
by its database stops: membership plans/pricing and site settings content,
trainers section and trainer photos, contact form, free-trial requests,
membership inquiries, newsletter signup, member/admin logins, and the
member/attendance admin area. No data is deleted by pausing.

## How to un-pause town-fitness-point

Option A (dashboard): supabase.com -> project town-fitness-point -> Restore
project. Takes a few minutes; data and settings return as they were.
Option B (when a free slot is needed it is not): restoring makes 3 active
free projects only if another project is paused first or the plan is
upgraded - the free plan allows 2 active projects. Pause `dailymb` the same
way if the gym site must come back first, or upgrade either organisation
to Pro to run all three.

## DailyMB backend specifics

- URL: https://ceukjmqshaboodrxbscz.supabase.co
- Edge Functions: fetch-answers, register-device, health (all ACTIVE)
- pg_cron: dailymb-fetch-0005-karachi (00:05 Asia/Karachi), 
  dailymb-fetch-0530-karachi (05:30 Asia/Karachi), dailymb-purge (30 days)
- FUNCTION_SECRET is set as an Edge Function secret and in Vault for cron;
  its value is not recorded here.
- Verification rule (fixed after a live incident on day one): answers are
  matched per QUESTION across sources, never per question number alone,
  because some sources publish stale question sets.
