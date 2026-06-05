-- =====================================================================
-- 0009 — Multiple admins per temple + manager-proposed admins.
--   * temple_admins: many-to-many link between temples and admin users
--   * temple_admin_requests: a manager proposes an admin (name/email/phone);
--     the Super Admin approves (creating/linking the user) or rejects,
--     mirroring how temple details are approved.
-- =====================================================================

create table temple_admins (
  temple_id   uuid not null references temples(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (temple_id, user_id)
);
create index temple_admins_user_idx on temple_admins(user_id);

-- carry over any existing single-admin assignments, then drop the old column
insert into temple_admins (temple_id, user_id)
  select id, temple_admin_id from temples where temple_admin_id is not null
  on conflict do nothing;
alter table temples drop column temple_admin_id;

create table temple_admin_requests (
  id            uuid primary key default gen_random_uuid(),
  temple_id     uuid not null references temples(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  phone         text,
  status        suggestion_status not null default 'pending',
  requested_by  uuid references users(id) on delete set null,
  reviewed_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index temple_admin_requests_status_idx on temple_admin_requests(status);
create trigger temple_admin_requests_set_updated_at before update on temple_admin_requests
  for each row execute function set_updated_at();
