-- ============================================================
-- KSO Database Schema for Supabase
-- Run this ENTIRE script in Supabase SQL Editor (one go)
-- ============================================================

-- 1. OPPORTUNITIES TABLE (public read)
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  category text not null check (category in ('scholarship','internship','course','competition','fellowship','training','exchange','volunteer','job','other')),
  description text,
  short_description text,
  deadline date,
  start_date date,
  location text,
  location_type text default 'onsite' check (location_type in ('onsite','remote','hybrid')),
  eligibility text[] default '{}',
  education_level text[] default '{}',
  field_of_study text[] default '{}',
  stipend text,
  is_remote boolean default false,
  application_url text,
  source_url text,
  how_to_apply text,
  requirements text[] default '{}',
  tags text[] default '{}',
  image_url text,
  is_featured boolean default false,
  is_demo_data boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. PROFILES TABLE (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  education_level text,
  university text,
  field_of_study text,
  interests text[] default '{}',
  gpa numeric,
  resume_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. SAVED_OPPORTUNITIES TABLE (user bookmarks)
create table saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  saved_at timestamp with time zone default now(),
  unique(user_id, opportunity_id)
);

-- 4. CHAT_SESSIONS TABLE (AI chat — for guest + authenticated)
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_token text unique,
  skills text,
  gpa numeric,
  resume_text text,
  created_at timestamp with time zone default now()
);

-- 5. CHAT_MESSAGES TABLE
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- 6. NOTIFICATIONS TABLE
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  type text not null check (type in ('new_opportunity','deadline_reminder','deadline_warning','personalized')),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table opportunities enable row level security;
alter table profiles enable row level security;
alter table saved_opportunities enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;

-- OPPORTUNITIES: public read for everyone (including anonymous/guests)
create policy "opportunities_public_read" on opportunities
  for select using (true);

-- PROFILES: users can read/update only their own profile
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- SAVED_OPPORTUNITIES: users can CRUD only their own bookmarks
create policy "saved_select_own" on saved_opportunities
  for select using (auth.uid() = user_id);

create policy "saved_insert_own" on saved_opportunities
  for insert with check (auth.uid() = user_id);

create policy "saved_delete_own" on saved_opportunities
  for delete using (auth.uid() = user_id);

-- CHAT_SESSIONS: authenticated users see their own; token-based for guests
create policy "chat_sessions_select_own" on chat_sessions
  for select using (auth.uid() = user_id);

create policy "chat_sessions_insert" on chat_sessions
  for insert with check (auth.uid() = user_id or session_token is not null);

-- CHAT_MESSAGES: accessible via session ownership
create policy "chat_messages_select" on chat_messages
  for select using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and (chat_sessions.user_id = auth.uid() or chat_sessions.session_token is not null)
    )
  );

create policy "chat_messages_insert" on chat_messages
  for insert with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = session_id
      and (chat_sessions.user_id = auth.uid() or chat_sessions.session_token is not null)
    )
  );

-- NOTIFICATIONS: users can read/update only their own
create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================

create index idx_opportunities_category on opportunities(category);
create index idx_opportunities_is_featured on opportunities(is_featured);
create index idx_opportunities_deadline on opportunities(deadline);
create index idx_saved_user_id on saved_opportunities(user_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_chat_messages_session_id on chat_messages(session_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_opportunities_updated_at
  before update on opportunities
  for each row execute procedure update_updated_at_column();

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET for Resume PDFs (Phase 6)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false);

-- RLS: users can only upload/read their own resumes
alter table storage.objects enable row level security;

create policy "resumes_select_own" on storage.objects
  for select using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "resumes_delete_own" on storage.objects
  for delete using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
