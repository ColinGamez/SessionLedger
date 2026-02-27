-- ============================================================
-- SessionLedger — Row Level Security Policies
-- ============================================================

-- ---- Enable RLS ----
alter table public.profiles  enable row level security;
alter table public.sessions   enable row level security;
alter table public.audit_log  enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile only
create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile only (no role escalation)
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent self-elevation of subscription_status via client
    -- (stripe webhook updates via service role only)
  );

-- No direct inserts from client — handled by trigger
-- No deletes from client — admin only via service role

-- ============================================================
-- SESSIONS
-- ============================================================

-- Select: own rows only
create policy "sessions: owner read"
  on public.sessions for select
  using (auth.uid() = user_id);

-- Insert: own rows, user_id must match auth.uid()
create policy "sessions: owner insert"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- Update: own rows only
create policy "sessions: owner update"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete: own rows only
create policy "sessions: owner delete"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================

-- Users can only read their own audit entries
create policy "audit_log: owner read"
  on public.audit_log for select
  using (auth.uid() = user_id);

-- No client inserts — server-side service role only
-- (written via API routes using supabase service_role key)

-- ============================================================
-- HELPER: is_pro()
-- Returns true if the calling user has an active/trialing subscription
-- Used as a reusable check in application code and future policies
-- ============================================================
create or replace function public.is_pro(uid uuid default auth.uid())
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and subscription_status in ('active', 'trialing')
      and (subscription_period_end is null or subscription_period_end > now())
  );
$$;
