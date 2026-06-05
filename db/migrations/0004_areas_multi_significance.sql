-- =====================================================================
-- 0004 — Multi-significance per temple; two-level location (district → area).
--   * significance becomes many-to-many (temple_significances)
--   * areas are a controlled list under a district, managed by Super Admin
--     and suggestable by managers/admins (new 'area' suggestion target)
-- =====================================================================

-- Allow 'area' as a suggestion target (safe in a tx on PG12+; not used here).
alter type suggestion_target add value if not exists 'area';

-- Many-to-many: a temple can carry several significances.
create table temple_significances (
  temple_id       uuid not null references temples(id) on delete cascade,
  significance_id uuid not null references significances(id) on delete restrict,
  primary key (temple_id, significance_id)
);
create index temple_significances_sig_idx on temple_significances(significance_id);

-- Carry over any single significance set under 0003, then drop the column.
insert into temple_significances (temple_id, significance_id)
  select id, significance_id from temples where significance_id is not null
  on conflict do nothing;
alter table temples drop column significance_id;

-- Areas: second level of location, nested under a district (district = text).
create table areas (
  id          uuid primary key default gen_random_uuid(),
  district    text not null,
  name_en     text not null,
  name_te     text,
  status      listing_status not null default 'active',
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index areas_district_name_uniq on areas(district, lower(name_en));
create index areas_district_idx on areas(district);
create trigger areas_set_updated_at before update on areas
  for each row execute function set_updated_at();

-- A temple optionally sits in one area (within its district).
alter table temples add column area_id uuid references areas(id) on delete set null;
create index temples_area_idx on temples(area_id);
