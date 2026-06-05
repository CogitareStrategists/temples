-- =====================================================================
-- Temple Information Portal — initial schema
-- Target: PostgreSQL 15/16 (Neon). No ORM; plain SQL migrations.
--
-- Conventions
--   * UUID primary keys via gen_random_uuid() (no enumerable IDs leaked).
--   * timestamptz everywhere; updated_at maintained by a trigger.
--   * Bilingual free-text fields are paired columns: *_en (required) and
--     *_te (optional, English shown as fallback when NULL).
--   * Language-neutral data (coords, phone, UPI, times, photos) is single-column.
--   * Controlled lists (deities, categories) are real rows so the Manager
--     "suggest a new field" flow can grow them via approval.
-- =====================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;     -- trigram search across EN + Telugu scripts

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Enumerated types (fixed sets — the *extensible* lists are tables below)
-- ---------------------------------------------------------------------
create type user_role              as enum ('super_admin', 'temple_manager', 'temple_admin');
create type user_status            as enum ('pending_approval', 'active', 'suspended');
create type temple_status          as enum ('pending_approval', 'published', 'suspended', 'rejected');
create type listing_status         as enum ('active', 'inactive');
create type subscription_status    as enum ('pending_payment', 'active', 'expired', 'cancelled');
create type payment_status         as enum ('created', 'paid', 'failed', 'refunded');
create type suggestion_scope       as enum ('global', 'temple');
create type suggestion_target      as enum ('deity', 'category', 'field_modification', 'other');
create type suggestion_status      as enum ('pending', 'approved', 'rejected');
create type temple_version_type    as enum ('initial_submission', 'edit', 'approved_baseline');

-- =====================================================================
-- USERS  (no public signup — Super Admin provisions Managers & Admins)
-- =====================================================================
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  role          user_role not null,
  full_name     text not null,
  phone         text,
  status        user_status not null default 'active',  -- super-admin-created accounts start active
  created_by    uuid references users(id) on delete set null,  -- which super admin created this account
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index users_role_idx   on users(role);
create index users_status_idx on users(status);
create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();

-- =====================================================================
-- CONTROLLED LISTS  (deities, categories) — grown via field_suggestions
-- =====================================================================
create table deities (
  id          uuid primary key default gen_random_uuid(),
  label_en    text not null,
  label_te    text,
  status      listing_status not null default 'active',
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index deities_label_en_uniq on deities(lower(label_en));
create index deities_label_en_trgm on deities using gin (label_en gin_trgm_ops);
create index deities_label_te_trgm on deities using gin (label_te gin_trgm_ops);
create trigger deities_set_updated_at before update on deities
  for each row execute function set_updated_at();

create table categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,            -- used in /temples?category=<slug>
  label_en        text not null,
  label_te        text,
  description_en  text,
  description_te  text,
  sort_order      int not null default 0,
  status          listing_status not null default 'active',
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index categories_sort_idx on categories(sort_order);
create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();

-- =====================================================================
-- TEMPLES  (this row is the LIVE / current state the public sees)
-- =====================================================================
create table temples (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,         -- public URL: /temple/<slug>

  -- bilingual identity
  name_en            text not null,
  name_te            text,

  -- deities: exactly one primary here; zero-or-more secondary in join table
  primary_deity_id   uuid references deities(id) on delete restrict,

  -- description (optional; commonly wanted on a temple page)
  description_en     text,
  description_te     text,

  -- location (address bilingual; the rest language-neutral)
  address_line_en    text,
  address_line_te    text,
  city               text,
  district           text,
  state              text not null default 'Telangana',  -- Telangana / Andhra Pradesh
  pincode            text,
  latitude           numeric(9,6),
  longitude          numeric(9,6),

  -- contact
  contact_phone      text,
  contact_email      text,

  -- donations: temple's OWN UPI (we only display it; no money flows through us)
  donation_upi_vpa   text,
  donation_upi_name  text,   -- payee name shown in the UPI deep link / QR
  donation_qr_url    text,   -- optional uploaded QR image (else QR rendered from VPA)

  -- primary photo (gallery in temple_photos)
  primary_photo_url  text,

  -- workflow / lifecycle
  status             temple_status not null default 'pending_approval',
  created_by         uuid references users(id) on delete set null,  -- manager/super admin who added it
  temple_admin_id    uuid references users(id) on delete set null,  -- admin assigned to manage it
  approved_by        uuid references users(id) on delete set null,
  approved_at        timestamptz,

  -- light denormalisation maintained by the payment flow; drives the
  -- "admin editing locked on expiry" rule (page stays visible regardless)
  subscription_valid_until date,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index temples_status_idx       on temples(status);
create index temples_district_idx     on temples(district);
create index temples_state_idx        on temples(state);
create index temples_primary_deity_idx on temples(primary_deity_id);
create index temples_name_en_trgm     on temples using gin (name_en gin_trgm_ops);
create index temples_name_te_trgm     on temples using gin (name_te gin_trgm_ops);
create trigger temples_set_updated_at before update on temples
  for each row execute function set_updated_at();

-- secondary deities (0..n)
create table temple_secondary_deities (
  temple_id  uuid not null references temples(id) on delete cascade,
  deity_id   uuid not null references deities(id) on delete restrict,
  primary key (temple_id, deity_id)
);

-- temple <-> category (n..n)
create table temple_categories (
  temple_id    uuid not null references temples(id) on delete cascade,
  category_id  uuid not null references categories(id) on delete restrict,
  primary key (temple_id, category_id)
);
create index temple_categories_category_idx on temple_categories(category_id);

-- gallery
create table temple_photos (
  id          uuid primary key default gen_random_uuid(),
  temple_id   uuid not null references temples(id) on delete cascade,
  url         text not null,
  caption_en  text,
  caption_te  text,
  sort_order  int not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index temple_photos_temple_idx on temple_photos(temple_id);
-- at most one primary photo per temple
create unique index temple_photos_one_primary
  on temple_photos(temple_id) where is_primary;

-- =====================================================================
-- TIMINGS  (structured, per-day sessions) + exceptions (festivals etc.)
-- =====================================================================
create table temple_timings (
  id              uuid primary key default gen_random_uuid(),
  temple_id       uuid not null references temples(id) on delete cascade,
  day_of_week     smallint not null,             -- 0 = Sunday ... 6 = Saturday
  session_order   smallint not null default 1,   -- 1 = morning, 2 = evening, ...
  session_label_en text,                          -- e.g. "Morning Darshan"
  session_label_te text,
  open_time       time not null,
  close_time      time not null,
  constraint temple_timings_dow_chk check (day_of_week between 0 and 6),
  unique (temple_id, day_of_week, session_order)
);
create index temple_timings_temple_idx on temple_timings(temple_id);

create table temple_timing_exceptions (
  id                 uuid primary key default gen_random_uuid(),
  temple_id          uuid not null references temples(id) on delete cascade,
  title_en           text not null,               -- e.g. "Bonalu", "Ekadasi"
  title_te           text,
  note_en            text,
  note_te            text,
  exception_date     date,                         -- single date  (optional)
  valid_from         date,                         -- or a range    (optional)
  valid_to           date,
  is_closed          boolean not null default false,
  special_open_time  time,                         -- used when not closed
  special_close_time time,
  created_at         timestamptz not null default now()
);
create index temple_timing_exceptions_temple_idx on temple_timing_exceptions(temple_id);

-- =====================================================================
-- EVENTS & VIDEOS  (hidden from public unless is_public = true; may be empty)
-- =====================================================================
create table temple_events (
  id                uuid primary key default gen_random_uuid(),
  temple_id         uuid not null references temples(id) on delete cascade,
  title_en          text not null,
  title_te          text,
  description_en    text,
  description_te    text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  location_note_en  text,
  location_note_te  text,
  image_url         text,
  is_public         boolean not null default false,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index temple_events_temple_idx on temple_events(temple_id);
create index temple_events_public_idx on temple_events(temple_id) where is_public;
create trigger temple_events_set_updated_at before update on temple_events
  for each row execute function set_updated_at();

create table temple_videos (
  id            uuid primary key default gen_random_uuid(),
  temple_id     uuid not null references temples(id) on delete cascade,
  title_en      text not null,
  title_te      text,
  video_url     text not null,         -- e.g. a YouTube watch URL
  thumbnail_url text,
  sort_order    int not null default 0,
  is_public     boolean not null default false,
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index temple_videos_temple_idx on temple_videos(temple_id);
create index temple_videos_public_idx on temple_videos(temple_id) where is_public;

-- =====================================================================
-- VERSIONS / BACKUPS
-- Immutable JSONB snapshots of the CORE temple information (not events/videos).
-- Snapshot shape: { temple: {...}, primary_deity_id, secondary_deity_ids: [],
--   category_ids: [], photos: [], timings: [], timing_exceptions: [] }.
-- Super Admin always retains the original-approved baseline and may mark any
-- later live version as the approved baseline; both are restorable.
-- =====================================================================
create table temple_versions (
  id                   uuid primary key default gen_random_uuid(),
  temple_id            uuid not null references temples(id) on delete cascade,
  version_number       int not null,
  version_type         temple_version_type not null,
  snapshot             jsonb not null,
  is_original_approved boolean not null default false,
  is_approved_baseline boolean not null default false,
  note                 text,
  created_by           uuid references users(id) on delete set null,
  created_at           timestamptz not null default now(),
  unique (temple_id, version_number)
);
create index temple_versions_temple_idx on temple_versions(temple_id);
-- exactly one of each baseline kind per temple
create unique index temple_versions_one_original
  on temple_versions(temple_id) where is_original_approved;
create unique index temple_versions_one_baseline
  on temple_versions(temple_id) where is_approved_baseline;
comment on table temple_versions is
  'Immutable snapshots of core temple info for backup/rollback. The original approved version and the latest approved baseline are flagged and never overwritten.';

-- =====================================================================
-- SUBSCRIPTIONS & PAYMENTS  (plan = paid duration; features identical)
-- Plan payment = real money to the platform via Razorpay (UPI/cards/etc.).
-- Public donations are NOT here — those use the temple's own UPI QR.
-- =====================================================================
create table subscription_plans (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,    -- 'monthly' | 'half_yearly' | 'yearly'
  name_en          text not null,
  name_te          text,
  duration_months  int not null,
  amount_inr       numeric(10,2) not null,  -- 150 / 600 / 1000
  status           listing_status not null default 'active',
  created_at       timestamptz not null default now()
);

create table subscriptions (
  id           uuid primary key default gen_random_uuid(),
  temple_id    uuid not null references temples(id) on delete cascade,
  plan_id      uuid not null references subscription_plans(id) on delete restrict,
  amount_inr   numeric(10,2) not null,      -- snapshotted at purchase time
  start_date   date,
  end_date     date,
  status       subscription_status not null default 'pending_payment',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index subscriptions_temple_idx on subscriptions(temple_id);
create index subscriptions_status_idx on subscriptions(status);
create index subscriptions_end_date_idx on subscriptions(end_date);
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create table payments (
  id                   uuid primary key default gen_random_uuid(),
  temple_id            uuid not null references temples(id) on delete cascade,
  subscription_id      uuid references subscriptions(id) on delete set null,
  amount_inr           numeric(10,2) not null,
  currency             text not null default 'INR',
  status               payment_status not null default 'created',
  razorpay_order_id    text,
  razorpay_payment_id  text,
  razorpay_signature   text,                 -- verified server-side before marking paid
  method               text,                 -- upi / card / netbanking / wallet
  initiated_by         uuid references users(id) on delete set null,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);
create index payments_temple_idx on payments(temple_id);
create index payments_subscription_idx on payments(subscription_id);
create unique index payments_rzp_order_uniq on payments(razorpay_order_id)
  where razorpay_order_id is not null;

-- =====================================================================
-- FIELD SUGGESTIONS  (Manager proposes; Super Admin approves/rejects)
-- e.g. add "Maisamma / మైసమ్మ" to the deity list (global), or a temple-level tweak.
-- =====================================================================
create table field_suggestions (
  id                uuid primary key default gen_random_uuid(),
  suggested_by      uuid not null references users(id) on delete set null,
  scope             suggestion_scope not null,
  temple_id         uuid references temples(id) on delete cascade,  -- required when scope = 'temple'
  target            suggestion_target not null,
  label_en          text,    -- proposed value for add-a-deity / add-a-category
  label_te          text,
  payload           jsonb,   -- structured detail (e.g. which field, old -> new)
  rationale         text,
  status            suggestion_status not null default 'pending',
  reviewed_by       uuid references users(id) on delete set null,
  reviewed_at       timestamptz,
  review_note       text,
  created_at        timestamptz not null default now(),
  constraint field_suggestions_scope_chk
    check (scope = 'global' or temple_id is not null)
);
create index field_suggestions_status_idx on field_suggestions(status);
create index field_suggestions_scope_idx  on field_suggestions(scope);
create index field_suggestions_temple_idx on field_suggestions(temple_id);

-- =====================================================================
-- AUDIT LOG  (oversight: who approved/changed what, and when)
-- =====================================================================
create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references users(id) on delete set null,
  action       text not null,        -- e.g. 'temple.approved', 'user.created'
  entity_type  text not null,        -- e.g. 'temple', 'user', 'subscription'
  entity_id    uuid,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log(entity_type, entity_id);
create index audit_log_actor_idx  on audit_log(actor_id);
