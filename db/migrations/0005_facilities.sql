-- =====================================================================
-- 0005 — Facilities: a multi-select controlled list per temple, plus a
-- fourth curated home section ("Temples by Facilities").
--   * facilities managed by Super Admin; selected by managers/admins
--   * no suggestion flow (Super-Admin-managed only, per spec)
-- =====================================================================

-- Allow a 4th curated home section.
alter type home_section add value if not exists 'facility';

create table facilities (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label_en    text not null,
  label_te    text,
  sort_order  int not null default 0,
  status      listing_status not null default 'active',
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger facilities_set_updated_at before update on facilities
  for each row execute function set_updated_at();

create table temple_facilities (
  temple_id    uuid not null references temples(id) on delete cascade,
  facility_id  uuid not null references facilities(id) on delete restrict,
  primary key (temple_id, facility_id)
);
create index temple_facilities_facility_idx on temple_facilities(facility_id);

insert into facilities (slug, label_en, label_te, sort_order) values
  ('parking',            'Parking',            'పార్కింగ్',                 1),
  ('drinking-water',     'Drinking Water',     'తాగునీరు',                  2),
  ('restaurants-nearby', 'Restaurants Nearby', 'సమీపంలో రెస్టారెంట్లు',     3),
  ('gosaala',            'Gosaala',            'గోశాల',                     4),
  ('accommodation',      'Accommodation',      'వసతి',                      5)
on conflict (slug) do nothing;
