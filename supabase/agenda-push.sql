-- DB Plumbing Services · Agenda Web Push backend
-- Uses the same private Request Inbox owner token already present on the owner's iPhone.
-- The plaintext token is NOT stored here; only the existing SHA-256 hash is reused by the Edge Function.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.agenda_push_config (
  id smallint primary key default 1 check (id = 1),
  vapid_public_key text not null,
  vapid_private_key text not null,
  cron_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agenda_push_devices (
  installation_id text primary key,
  endpoint text not null,
  subscription jsonb not null,
  active boolean not null default true,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agenda_push_reminders (
  installation_id text not null references public.agenda_push_devices(installation_id) on delete cascade,
  reminder_key text not null,
  fire_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (installation_id, reminder_key)
);

create index if not exists agenda_push_devices_endpoint_idx on public.agenda_push_devices(endpoint);
create index if not exists agenda_push_reminders_due_idx on public.agenda_push_reminders(fire_at) where sent_at is null;

alter table public.agenda_push_config enable row level security;
alter table public.agenda_push_devices enable row level security;
alter table public.agenda_push_reminders enable row level security;

revoke all on table public.agenda_push_config from anon, authenticated;
revoke all on table public.agenda_push_devices from anon, authenticated;
revoke all on table public.agenda_push_reminders from anon, authenticated;

-- Remove an older copy of the dispatcher job before recreating it.
do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname = 'dbp-agenda-push-dispatch' limit 1;
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
end $$;

select cron.schedule(
  'dbp-agenda-push-dispatch',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://gscrhubeifhlbxxrdlwo.supabase.co/functions/v1/agenda-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select cron_secret from public.agenda_push_config where id = 1), '')
      ),
      body := '{"action":"dispatch"}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $cron$
);

notify pgrst, 'reload schema';
