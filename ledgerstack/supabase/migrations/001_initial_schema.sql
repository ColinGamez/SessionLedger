-- ============================================================
-- LedgerStack — Supabase Initial Schema
-- ============================================================

-- ---- Extensions ----
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for future full-text tag search

-- ============================================================
-- PROFILES
-- Mirrors auth.users; stores subscription state
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,

  -- Stripe
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  subscription_status     text default 'free'
    check (subscription_status in ('free', 'active', 'past_due', 'canceled', 'trialing')),
  subscription_period_end timestamptz,

  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- SESSIONS
-- ============================================================
create table public.sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,

  title       text not null,
  started_at  timestamptz not null,
  in_amount   numeric(12, 2) not null default 0 check (in_amount >= 0),
  out_amount  numeric(12, 2) not null default 0 check (out_amount >= 0),
  notes       text,
  tags        text[] default '{}',

  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute procedure public.set_updated_at();

-- Indexes
create index sessions_user_id_idx         on public.sessions(user_id);
create index sessions_started_at_idx      on public.sessions(user_id, started_at desc);
create index sessions_tags_gin_idx        on public.sessions using gin(tags);
create index sessions_title_trgm_idx      on public.sessions using gin(title gin_trgm_ops);

-- ============================================================
-- AUDIT LOG (append-only)
-- ============================================================
create table public.audit_log (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  resource    text not null,
  resource_id uuid,
  meta        jsonb,
  created_at  timestamptz default now() not null
);

create index audit_log_user_id_idx on public.audit_log(user_id, created_at desc);
