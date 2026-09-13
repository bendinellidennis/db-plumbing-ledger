-- DB Plumbing Services · Interactive Quote v84
-- Public client links use high-entropy bearer tokens. Only SHA-256 token hashes are stored.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.interactive_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_key text not null,
  public_token_hash text not null unique,
  owner_token_hash text not null unique,
  payload jsonb not null,
  version integer not null default 1 check (version > 0),
  decision text null check (decision in ('accepted','change_requested','rejected')),
  response_message text null,
  published_at timestamptz not null default now(),
  responded_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists interactive_quotes_updated_idx
  on public.interactive_quotes(updated_at desc);

alter table public.interactive_quotes enable row level security;
revoke all on table public.interactive_quotes from anon, authenticated;

create or replace function public.interactive_quote_publish(
  p_public_token text,
  p_owner_token text,
  p_quote_key text,
  p_payload jsonb,
  p_reset_response boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  public_hash text;
  owner_hash text;
  r public.interactive_quotes%rowtype;
begin
  if p_public_token is null or length(p_public_token) < 32 or length(p_public_token) > 200 then
    raise exception 'invalid public token' using errcode = '22023';
  end if;
  if p_owner_token is null or length(p_owner_token) < 32 or length(p_owner_token) > 200 then
    raise exception 'invalid owner token' using errcode = '22023';
  end if;
  if p_quote_key is null or length(trim(p_quote_key)) < 1 or length(p_quote_key) > 200 then
    raise exception 'invalid quote key' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 100000 then
    raise exception 'invalid quote payload' using errcode = '22023';
  end if;

  public_hash := encode(extensions.digest(p_public_token, 'sha256'), 'hex');
  owner_hash := encode(extensions.digest(p_owner_token, 'sha256'), 'hex');

  select * into r
  from public.interactive_quotes
  where owner_token_hash = owner_hash
  for update;

  if not found then
    insert into public.interactive_quotes(
      quote_key, public_token_hash, owner_token_hash, payload
    ) values (
      p_quote_key, public_hash, owner_hash, p_payload
    )
    returning * into r;
  else
    if r.public_token_hash <> public_hash or r.quote_key <> p_quote_key then
      raise exception 'token does not match quote' using errcode = '42501';
    end if;

    update public.interactive_quotes
    set payload = p_payload,
        version = version + 1,
        decision = case when p_reset_response then null else decision end,
        response_message = case when p_reset_response then null else response_message end,
        responded_at = case when p_reset_response then null else responded_at end,
        published_at = case when p_reset_response then now() else published_at end,
        updated_at = now()
    where id = r.id
    returning * into r;
  end if;

  return jsonb_build_object(
    'ok', true,
    'version', r.version,
    'decision', r.decision,
    'message', r.response_message,
    'respondedAt', r.responded_at,
    'publishedAt', r.published_at
  );
end;
$$;

create or replace function public.interactive_quote_public_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_hash text;
  r public.interactive_quotes%rowtype;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  token_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  select * into r from public.interactive_quotes where public_token_hash = token_hash;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'quote', r.payload,
    'version', r.version,
    'decision', r.decision,
    'respondedAt', r.responded_at
  );
end;
$$;

create or replace function public.interactive_quote_respond(
  p_token text,
  p_decision text,
  p_message text default null,
  p_version integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_hash text;
  r public.interactive_quotes%rowtype;
  clean_message text;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;
  if p_decision not in ('accepted','change_requested','rejected') then
    return jsonb_build_object('ok', false, 'error', 'invalid_decision');
  end if;

  clean_message := nullif(trim(coalesce(p_message, '')), '');
  if clean_message is not null and length(clean_message) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'message_too_long');
  end if;
  if p_decision = 'change_requested' and clean_message is null then
    return jsonb_build_object('ok', false, 'error', 'message_required');
  end if;

  token_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  select * into r
  from public.interactive_quotes
  where public_token_hash = token_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if p_version is not null and p_version <> r.version then
    return jsonb_build_object('ok', false, 'error', 'stale_version', 'version', r.version);
  end if;
  if r.decision is not null then
    return jsonb_build_object(
      'ok', false,
      'error', 'already_responded',
      'decision', r.decision,
      'message', r.response_message,
      'respondedAt', r.responded_at
    );
  end if;

  update public.interactive_quotes
  set decision = p_decision,
      response_message = clean_message,
      responded_at = now(),
      updated_at = now()
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'ok', true,
    'decision', r.decision,
    'message', r.response_message,
    'respondedAt', r.responded_at,
    'version', r.version
  );
end;
$$;

create or replace function public.interactive_quote_owner_get(p_owner_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  owner_hash text;
  r public.interactive_quotes%rowtype;
begin
  if p_owner_token is null or length(p_owner_token) < 32 or length(p_owner_token) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  owner_hash := encode(extensions.digest(p_owner_token, 'sha256'), 'hex');
  select * into r from public.interactive_quotes where owner_token_hash = owner_hash;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'quoteKey', r.quote_key,
    'version', r.version,
    'decision', r.decision,
    'message', r.response_message,
    'respondedAt', r.responded_at,
    'publishedAt', r.published_at,
    'updatedAt', r.updated_at
  );
end;
$$;

revoke all on function public.interactive_quote_publish(text,text,text,jsonb,boolean) from public;
revoke all on function public.interactive_quote_public_get(text) from public;
revoke all on function public.interactive_quote_respond(text,text,text,integer) from public;
revoke all on function public.interactive_quote_owner_get(text) from public;

grant execute on function public.interactive_quote_publish(text,text,text,jsonb,boolean) to anon, authenticated;
grant execute on function public.interactive_quote_public_get(text) to anon, authenticated;
grant execute on function public.interactive_quote_respond(text,text,text,integer) to anon, authenticated;
grant execute on function public.interactive_quote_owner_get(text) to anon, authenticated;

notify pgrst, 'reload schema';
