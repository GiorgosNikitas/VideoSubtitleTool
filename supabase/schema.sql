create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  display_name text not null default '',
  credit_balance integer not null default 0 check (credit_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('transcription', 'export')),
  status text not null check (status in ('completed', 'failed')),
  credits integer not null default 0 check (credits >= 0),
  duration_seconds numeric,
  model text,
  language text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.usage_jobs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "credit_ledger_select_own" on public.credit_ledger;
create policy "credit_ledger_select_own"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "usage_jobs_select_own" on public.usage_jobs;
create policy "usage_jobs_select_own"
  on public.usage_jobs for select
  using (auth.uid() = user_id);

drop function if exists public.ensure_profile(uuid, text, integer);
drop function if exists public.ensure_profile(uuid, text, text, text, integer);

create or replace function public.ensure_profile(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_welcome_credits integer
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  initial_credits integer := greatest(coalesce(p_welcome_credits, 0), 0);
  normalized_first_name text := coalesce(trim(p_first_name), '');
  normalized_last_name text := coalesce(trim(p_last_name), '');
begin
  insert into public.profiles (id, email, first_name, last_name, display_name, credit_balance)
  values (
    p_user_id,
    coalesce(p_email, ''),
    normalized_first_name,
    normalized_last_name,
    trim(normalized_first_name || ' ' || normalized_last_name),
    initial_credits
  )
  on conflict (id) do nothing
  returning * into profile_row;

  if found then
    if initial_credits > 0 then
      insert into public.credit_ledger (user_id, amount, balance_after, reason, metadata)
      values (
        p_user_id,
        initial_credits,
        initial_credits,
        'welcome_grant',
        jsonb_build_object('source', 'WELCOME_CREDITS')
      );
    end if;

    return profile_row;
  end if;

  update public.profiles
  set email = coalesce(p_email, email),
      first_name = case when normalized_first_name <> '' then normalized_first_name else first_name end,
      last_name = case when normalized_last_name <> '' then normalized_last_name else last_name end,
      display_name = case
        when normalized_first_name <> '' or normalized_last_name <> ''
          then trim(
            (case when normalized_first_name <> '' then normalized_first_name else first_name end)
            || ' ' ||
            (case when normalized_last_name <> '' then normalized_last_name else last_name end)
          )
        else display_name
      end,
      updated_at = now()
  where id = p_user_id
  returning * into profile_row;

  return profile_row;
end;
$$;

create or replace function public.debit_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  if amount <= 0 then
    raise exception 'invalid_credit_amount';
  end if;

  update public.profiles
  set credit_balance = credit_balance - amount,
      updated_at = now()
  where id = p_user_id
    and credit_balance >= amount
  returning * into profile_row;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_ledger (user_id, amount, balance_after, reason, metadata)
  values (p_user_id, -amount, profile_row.credit_balance, p_reason, coalesce(p_metadata, '{}'::jsonb));

  return profile_row;
end;
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  amount integer := greatest(coalesce(p_amount, 0), 0);
begin
  if amount <= 0 then
    raise exception 'invalid_credit_amount';
  end if;

  update public.profiles
  set credit_balance = credit_balance + amount,
      updated_at = now()
  where id = p_user_id
  returning * into profile_row;

  if not found then
    raise exception 'profile_not_found';
  end if;

  insert into public.credit_ledger (user_id, amount, balance_after, reason, metadata)
  values (p_user_id, amount, profile_row.credit_balance, p_reason, coalesce(p_metadata, '{}'::jsonb));

  return profile_row;
end;
$$;

revoke execute on function public.ensure_profile(uuid, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.debit_credits(uuid, integer, text, jsonb) from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, integer, text, jsonb) from public, anon, authenticated;

grant execute on function public.ensure_profile(uuid, text, text, text, integer) to service_role;
grant execute on function public.debit_credits(uuid, integer, text, jsonb) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, jsonb) to service_role;
