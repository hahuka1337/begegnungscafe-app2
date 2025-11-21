# Begegnungscafé Nürnberg App

Eine mobile-first Community Web-App für das Begegnungscafé Nürnberg. Features beinhalten Event-Management, Raumbuchungen, Gruppenchats, Co-Working Buchungen und mehr.

## Installation & Start

1. Repository klonen:
   ```bash
   git clone <dein-repo-url>
   cd begegnungscafe-app
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. App starten (lokal):
   ```bash
   npm start
   ```

## Datenbank Setup (Supabase)

Führe diese Befehle im SQL Editor deines Supabase Projekts aus.

### Teil 1: Tabellen & Logik

```sql
-- 1. Tabelle für Profile (verknüpft mit auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  role text default 'user', -- 'user', 'organizer', 'admin'
  avatar_url text,
  bio text,
  job text,
  hobbies text[],
  is_verified boolean default false,
  is_chat_restricted boolean default false,
  account_status text default 'active',
  can_manage_cafe boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Updates für fehlende Spalten
alter table public.profiles add column if not exists loyalty_points int default 0;
alter table public.profiles add column if not exists friends uuid[] default '{}';
alter table public.profiles add column if not exists friend_requests uuid[] default '{}';
alter table public.profiles add column if not exists allowed_categories text[] default '{}';
alter table public.profiles add column if not exists allowed_room_ids text[] default '{}';
alter table public.profiles add column if not exists privacy_settings jsonb default '{"details": "public", "groups": "friends", "friends": "friends"}'::jsonb;

-- Trigger für neue User
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Events
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text,
  date_time_start timestamp with time zone,
  date_time_end timestamp with time zone,
  location text,
  created_by uuid references public.profiles(id),
  max_participants int,
  participants uuid[] default '{}',
  pending_participants uuid[] default '{}',
  waitlist uuid[] default '{}',
  image_url text,
  registration_mode text default 'instant',
  is_registration_open boolean default true,
  gender_restriction text default 'none',
  min_age int,
  max_age int,
  average_rating numeric default 0,
  average_rating_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Update für Wiederkehrende Events
alter table public.events add column if not exists series_id uuid;
alter table public.events add column if not exists recurrence_rule text; -- 'daily', 'weekly', 'monthly'

-- 3. Gruppen & Nachrichten
create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type text default 'public',
  members uuid[] default '{}',
  moderators uuid[] default '{}',
  join_requests uuid[] default '{}',
  is_convert_group boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade,
  author_id uuid references public.profiles(id),
  author_name text,
  text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Raumbuchungen
create table if not exists public.room_bookings (
  id uuid default uuid_generate_v4() primary key,
  room_id text not null,
  requested_by uuid references public.profiles(id),
  title text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text default 'requested',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Config Persistence
create table if not exists public.app_settings (
  key text primary key, 
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Weitere Tabellen (Polls, Resources, etc.)
create table if not exists public.resources (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  title text,
  type text,
  url text,
  description text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.mentoring_matches (
  id uuid default uuid_generate_v4() primary key,
  mentee_id uuid references public.profiles(id),
  mentor_id uuid references public.profiles(id),
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.polls (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  options text[] not null,
  scope text default 'global',
  target_group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade,
  user_id uuid references public.profiles(id),
  option_index int,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(poll_id, user_id)
);

create table if not exists public.suggestions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  type text,
  title text,
  description text,
  status text default 'new',
  admin_response text,
  contact_phone text,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.event_feedback (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id),
  rating int,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.coworking_desks (
  id uuid default uuid_generate_v4() primary key,
  name text,
  capacity int default 1,
  features text[] default '{}'
);
insert into public.coworking_desks (name, capacity, features) select 'Flex Desk 1', 1, ARRAY['Strom', 'WLAN'] where not exists (select 1 from public.coworking_desks);

create table if not exists public.coworking_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  desk_id uuid references public.coworking_desks(id) on delete cascade,
  date date not null,
  slot text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.check_ins (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id),
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text,
  text text,
  date timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id),
  target_id uuid,
  target_type text,
  reason text,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  capacity int default 10,
  description text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.resources enable row level security;
create policy "Public Access Resources" on public.resources for select using (true);
create policy "Auth Insert Resources" on public.resources for insert with check (auth.role() = 'authenticated');
create policy "Auth Delete Resources" on public.resources for delete using (auth.role() = 'authenticated');

alter table public.rooms enable row level security;
create policy "Public Access Rooms" on public.rooms for select using (true);
create policy "Auth Manage Rooms" on public.rooms for all using (auth.role() = 'authenticated');

alter table public.app_settings enable row level security;
create policy "Public Access Settings" on public.app_settings for select using (true);
create policy "Auth Manage Settings" on public.app_settings for all using (auth.role() = 'authenticated');

-- Realtime Publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, profiles, groups, rooms, app_settings, room_bookings;
commit;
