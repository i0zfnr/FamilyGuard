create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  role text not null default 'device_owner' check (role = 'device_owner'),
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'name'), 100), ''), 'XennGuard user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  device_name text not null check (char_length(device_name) between 1 and 100),
  platform text not null check (platform in ('android', 'windows')),
  manufacturer text,
  model text,
  os_version text,
  agent_version text,
  public_key text not null,
  enrollment_status text not null default 'pending' check (enrollment_status in ('pending', 'active', 'revoked')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index devices_owner_status_idx on public.devices (owner_id, enrollment_status);
create index devices_last_seen_idx on public.devices (last_seen_at);

create table public.device_permissions (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission_type text not null,
  enabled boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  unique (device_id, user_id, permission_type)
);

create table public.enrollment_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enrollment_challenges_user_expiry_idx on public.enrollment_challenges (user_id, expires_at);

create table public.device_tokens (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index device_tokens_expiry_idx on public.device_tokens (expires_at);

create table public.device_telemetry (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  battery_percentage smallint check (battery_percentage between 0 and 100),
  charging boolean,
  storage_total bigint check (storage_total >= 0),
  storage_available bigint check (storage_available >= 0),
  network_type text check (network_type in ('wifi', 'cellular', 'ethernet', 'none', 'other')),
  recorded_at timestamptz not null default now(),
  check (storage_available is null or storage_total is null or storage_available <= storage_total)
);

create index device_telemetry_device_time_idx on public.device_telemetry (device_id, recorded_at desc, id desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references public.profiles (id) on delete set null,
  device_id uuid references public.devices (id) on delete set null,
  ip_address inet,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_time_idx on public.audit_logs (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.device_permissions enable row level security;
alter table public.enrollment_challenges enable row level security;
alter table public.device_tokens enable row level security;
alter table public.device_telemetry enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'device_owner');

create policy "Owners can read their devices"
  on public.devices for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can read device permissions"
  on public.device_permissions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners can read their device telemetry"
  on public.device_telemetry for select to authenticated
  using (exists (
    select 1 from public.devices
    where devices.id = device_telemetry.device_id
      and devices.owner_id = (select auth.uid())
  ));

create policy "Users can read their own audit events"
  on public.audit_logs for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.profiles, public.devices, public.device_permissions,
  public.enrollment_challenges, public.device_tokens, public.device_telemetry,
  public.audit_logs from anon, authenticated;

grant select on public.profiles, public.devices, public.device_permissions,
  public.device_telemetry, public.audit_logs to authenticated;
grant update (name) on public.profiles to authenticated;

create function public.claim_device_enrollment(
  challenge_id uuid,
  challenge_token_hash text,
  new_device_name text,
  new_platform text,
  new_public_key text,
  new_device_token_hash text
)
returns table (device_id uuid, owner_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_user_id uuid;
  created_device_id uuid;
begin
  update public.enrollment_challenges
     set used_at = now(), updated_at = now()
   where id = claim_device_enrollment.challenge_id
     and token_hash = claim_device_enrollment.challenge_token_hash
     and used_at is null
     and revoked_at is null
     and expires_at > now()
  returning user_id into claimed_user_id;

  if claimed_user_id is null then
    return;
  end if;

  insert into public.devices (owner_id, device_name, platform, public_key, enrollment_status)
  values (claimed_user_id, new_device_name, new_platform, new_public_key, 'active')
  returning id into created_device_id;

  insert into public.device_tokens (device_id, token_hash, expires_at)
  values (created_device_id, new_device_token_hash, now() + interval '30 days');

  return query select created_device_id, claimed_user_id;
end;
$$;

create function public.revoke_owned_device(target_device_id uuid, requesting_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked_device_id uuid;
begin
  update public.devices
     set enrollment_status = 'revoked', updated_at = now()
   where id = target_device_id and owner_id = requesting_user_id
  returning id into revoked_device_id;

  if revoked_device_id is null then
    return false;
  end if;

  update public.device_tokens
     set revoked_at = coalesce(revoked_at, now())
   where device_id = revoked_device_id and revoked_at is null;

  update public.device_permissions
     set enabled = false, revoked_at = coalesce(revoked_at, now())
   where device_id = revoked_device_id;

  return true;
end;
$$;

revoke all on function public.claim_device_enrollment(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.revoke_owned_device(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
grant execute on function public.claim_device_enrollment(uuid, text, text, text, text, text) to service_role;
grant execute on function public.revoke_owned_device(uuid, uuid) to service_role;
