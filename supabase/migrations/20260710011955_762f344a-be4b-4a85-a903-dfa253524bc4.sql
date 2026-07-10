
-- =========================
-- Enums
-- =========================
create type public.wedding_role as enum ('owner', 'planner', 'viewer');
create type public.event_kind as enum ('ceremony','reception','welcome','rehearsal','brunch','cultural','other');
create type public.event_visibility as enum ('public','private');
create type public.rsvp_status as enum ('pending','accepted','declined','tentative');
create type public.travel_kind as enum ('hotel','airport','parking','transport','attraction','restaurant');

-- =========================
-- profiles
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- =========================
-- weddings (the tenant)
-- =========================
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  couple_name_one text not null,
  couple_name_two text not null,
  wedding_date date,
  location text,
  hero_image_url text,
  story text,
  hashtag text,
  theme text not null default 'editorial-monochrome',
  is_published boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.weddings to anon;
grant select, insert, update, delete on public.weddings to authenticated;
grant all on public.weddings to service_role;
alter table public.weddings enable row level security;

-- =========================
-- wedding_members
-- =========================
create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.wedding_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique(wedding_id, user_id)
);
grant select, insert, update, delete on public.wedding_members to authenticated;
grant all on public.wedding_members to service_role;
alter table public.wedding_members enable row level security;

-- Security-definer helper to avoid recursive policies
create or replace function public.is_wedding_member(_wedding_id uuid, _user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.wedding_members
    where wedding_id = _wedding_id and user_id = _user_id
  );
$$;

-- weddings policies
create policy "anyone can view published weddings" on public.weddings for select using (is_published = true or public.is_wedding_member(id, auth.uid()));
create policy "authenticated create wedding" on public.weddings for insert to authenticated with check (auth.uid() = created_by);
create policy "members update wedding" on public.weddings for update to authenticated using (public.is_wedding_member(id, auth.uid())) with check (public.is_wedding_member(id, auth.uid()));
create policy "members delete wedding" on public.weddings for delete to authenticated using (public.is_wedding_member(id, auth.uid()));

-- wedding_members policies
create policy "members view membership" on public.wedding_members for select to authenticated using (user_id = auth.uid() or public.is_wedding_member(wedding_id, auth.uid()));
create policy "creator adds first member" on public.wedding_members for insert to authenticated with check (user_id = auth.uid());
create policy "members manage members" on public.wedding_members for update to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));
create policy "members remove members" on public.wedding_members for delete to authenticated using (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- events
-- =========================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  kind public.event_kind not null default 'ceremony',
  starts_at timestamptz,
  venue_name text,
  venue_address text,
  dress_code text,
  notes text,
  visibility public.event_visibility not null default 'public',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public events visible" on public.events for select using (visibility = 'public' or public.is_wedding_member(wedding_id, auth.uid()));
create policy "members manage events" on public.events for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- guests
-- =========================
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  group_label text,
  tag text,
  plus_one_allowed boolean not null default false,
  address text,
  notes text,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);
grant select on public.guests to anon;
grant select, insert, update, delete on public.guests to authenticated;
grant all on public.guests to service_role;
alter table public.guests enable row level security;
-- Anon can look up a guest ONLY by invite_code (used by RSVP page)
create policy "guest lookup by invite code" on public.guests for select using (true);
create policy "members manage guests" on public.guests for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- rsvps
-- =========================
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  status public.rsvp_status not null default 'pending',
  meal_choice text,
  dietary_restrictions text,
  song_request text,
  plus_one_name text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.rsvps to anon;
grant select, insert, update, delete on public.rsvps to authenticated;
grant all on public.rsvps to service_role;
alter table public.rsvps enable row level security;
create policy "anyone submit rsvp" on public.rsvps for insert with check (true);
create policy "anyone update own rsvp by guest" on public.rsvps for update using (true) with check (true);
create policy "members view rsvps" on public.rsvps for select using (public.is_wedding_member(wedding_id, auth.uid()));
create policy "members delete rsvps" on public.rsvps for delete to authenticated using (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- gallery_items
-- =========================
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  image_url text not null,
  caption text,
  uploader_name text,
  is_featured boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert on public.gallery_items to anon;
grant select, insert, update, delete on public.gallery_items to authenticated;
grant all on public.gallery_items to service_role;
alter table public.gallery_items enable row level security;
create policy "approved gallery visible" on public.gallery_items for select using (is_approved = true or public.is_wedding_member(wedding_id, auth.uid()));
create policy "anyone upload" on public.gallery_items for insert with check (true);
create policy "members manage gallery" on public.gallery_items for update to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));
create policy "members delete gallery" on public.gallery_items for delete to authenticated using (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- guestbook_entries
-- =========================
create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  author_name text not null,
  message text not null,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert on public.guestbook_entries to anon;
grant select, insert, update, delete on public.guestbook_entries to authenticated;
grant all on public.guestbook_entries to service_role;
alter table public.guestbook_entries enable row level security;
create policy "approved guestbook visible" on public.guestbook_entries for select using (is_approved = true or public.is_wedding_member(wedding_id, auth.uid()));
create policy "anyone leave message" on public.guestbook_entries for insert with check (true);
create policy "members moderate guestbook" on public.guestbook_entries for update to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));
create policy "members delete guestbook" on public.guestbook_entries for delete to authenticated using (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- registry_items
-- =========================
create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  description text,
  url text,
  image_url text,
  price_cents int,
  is_cash_fund boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.registry_items to anon;
grant select, insert, update, delete on public.registry_items to authenticated;
grant all on public.registry_items to service_role;
alter table public.registry_items enable row level security;
create policy "registry public" on public.registry_items for select using (true);
create policy "members manage registry" on public.registry_items for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- travel_items
-- =========================
create table public.travel_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  kind public.travel_kind not null default 'hotel',
  title text not null,
  description text,
  url text,
  address text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.travel_items to anon;
grant select, insert, update, delete on public.travel_items to authenticated;
grant all on public.travel_items to service_role;
alter table public.travel_items enable row level security;
create policy "travel public" on public.travel_items for select using (true);
create policy "members manage travel" on public.travel_items for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- checklist_tasks
-- =========================
create table public.checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  category text,
  due_date date,
  is_done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.checklist_tasks to authenticated;
grant all on public.checklist_tasks to service_role;
alter table public.checklist_tasks enable row level security;
create policy "members manage checklist" on public.checklist_tasks for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- budget_items
-- =========================
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category text not null,
  label text not null,
  estimated_cents int not null default 0,
  actual_cents int not null default 0,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.budget_items to authenticated;
grant all on public.budget_items to service_role;
alter table public.budget_items enable row level security;
create policy "members manage budget" on public.budget_items for all to authenticated using (public.is_wedding_member(wedding_id, auth.uid())) with check (public.is_wedding_member(wedding_id, auth.uid()));

-- =========================
-- Auto-create profile + wedding_membership triggers
-- =========================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- When a wedding is created, auto-add creator as owner member
create or replace function public.handle_new_wedding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;
create trigger on_wedding_created after insert on public.weddings for each row execute function public.handle_new_wedding();

-- updated_at trigger helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_weddings before update on public.weddings for each row execute function public.touch_updated_at();
create trigger touch_rsvps before update on public.rsvps for each row execute function public.touch_updated_at();
