-- =====================================================================
-- 0008 — Flexible per-temple contacts. Each temple can list any number of
-- labeled contacts (Dharmakarta, Chief Priest, Temple Office, EO, ...),
-- each with an optional person name and a phone number. Shown publicly on
-- the temple page. Managed by the temple admin / managers.
-- =====================================================================

create table temple_contacts (
  id           uuid primary key default gen_random_uuid(),
  temple_id    uuid not null references temples(id) on delete cascade,
  label_en     text not null,          -- role/label, e.g. 'Dharmakarta'
  label_te     text,
  person_name  text,
  phone        text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index temple_contacts_temple_idx on temple_contacts(temple_id);
create trigger temple_contacts_set_updated_at before update on temple_contacts
  for each row execute function set_updated_at();
