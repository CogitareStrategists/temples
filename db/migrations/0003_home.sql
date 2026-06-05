-- =====================================================================
-- 0003 — Home page: significance list, temple significance, and
-- Super-Admin-curated featured temples for the three home sections.
-- =====================================================================

-- Which home section a featured temple belongs to.
create type home_section as enum ('deity', 'location', 'significance');

-- Controlled list of temple significances (e.g. Jyotirlinga, Shakti Peetha).
-- Optional on a temple. Grown the same way as deities/categories.
create table significances (
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
create trigger significances_set_updated_at before update on significances
  for each row execute function set_updated_at();

-- A temple may optionally carry one significance.
alter table temples
  add column significance_id uuid references significances(id) on delete set null;
create index temples_significance_idx on temples(significance_id);

-- Super-Admin-curated cards/slides shown under each home section.
create table home_featured (
  id          uuid primary key default gen_random_uuid(),
  section     home_section not null,
  temple_id   uuid not null references temples(id) on delete cascade,
  sort_order  int not null default 0,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (section, temple_id)
);
create index home_featured_section_idx on home_featured(section, sort_order);

-- Seed a starter set of significances (Telangana / AP). Bilingual.
insert into significances (slug, label_en, label_te, sort_order) values
  ('jyotirlinga',          'Jyotirlinga',            'జ్యోతిర్లింగం',        1),
  ('shakti-peetha',        'Shakti Peetha',          'శక్తి పీఠం',           2),
  ('ashtadasha-shakti',    'Ashtadasha Shakti Peetha','అష్టాదశ శక్తి పీఠం',  3),
  ('pancharama',           'Pancharama Kshetra',     'పంచారామ క్షేత్రం',     4),
  ('divya-desam',          'Divya Desam',            'దివ్య దేశం',           5),
  ('swayambhu',            'Swayambhu (self-manifested)', 'స్వయంభూ',         6)
on conflict (slug) do nothing;
