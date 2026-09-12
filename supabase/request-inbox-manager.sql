-- DB Plumbing Services · Request Inbox -> Manager CRM
-- The plaintext owner token is intentionally NOT stored in this repository.
-- This migration stores only its SHA-256 hash and exposes narrow SECURITY DEFINER RPCs.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.service_request_imports (
  request_id text primary key,
  imported_at timestamptz not null default now()
);

alter table public.service_request_imports enable row level security;
revoke all on table public.service_request_imports from anon, authenticated;

create or replace function public.manager_request_inbox(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  expected_hash constant text := 'd1497030dfde08f58db451ce314dbc621ce62ba72ee5804974f3c12af91b958a';
begin
  if p_token is null
     or encode(extensions.digest(p_token, 'sha256'), 'hex') <> expected_hash then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.created_at asc)
    from public.service_requests s
    where not exists (
      select 1
      from public.service_request_imports i
      where i.request_id = s.id::text
    )
  ), '[]'::jsonb);
end;
$$;

create or replace function public.manager_request_ack(p_token text, p_ids text[])
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  expected_hash constant text := 'd1497030dfde08f58db451ce314dbc621ce62ba72ee5804974f3c12af91b958a';
  affected integer := 0;
begin
  if p_token is null
     or encode(extensions.digest(p_token, 'sha256'), 'hex') <> expected_hash then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;

  insert into public.service_request_imports(request_id)
  select distinct x
  from unnest(p_ids) as x
  where coalesce(x, '') <> ''
  on conflict (request_id) do nothing;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.manager_request_inbox(text) from public;
revoke all on function public.manager_request_ack(text, text[]) from public;
grant execute on function public.manager_request_inbox(text) to anon, authenticated;
grant execute on function public.manager_request_ack(text, text[]) to anon, authenticated;

-- Direct table reads remain blocked; the Manager can read only through the token-gated RPC.
revoke select, update, delete on table public.service_requests from anon, authenticated;

-- Test records are kept temporarily for the end-to-end CRM import verification.
-- They will be removed only after that verification passes.

notify pgrst, 'reload schema';
