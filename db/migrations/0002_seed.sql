-- =====================================================================
-- Seed data: subscription plans + a starter controlled vocabulary.
-- Safe to run once after 0001_init.sql. Idempotent on natural keys.
--
-- NOTE: the Super Admin account is intentionally NOT seeded here. Never
-- commit a password (even hashed) to a migration. Create the first
-- Super Admin with a one-off bootstrap script that hashes a password
-- read from an env var / prompt (added in the app scaffold step).
-- =====================================================================

-- Subscription plans (features identical; plan = paid duration) ---------
insert into subscription_plans (code, name_en, name_te, duration_months, amount_inr) values
  ('monthly',     'Monthly',  'నెలవారీ',  1,  150.00),
  ('half_yearly', '6 Months', '6 నెలలు',  6,  600.00),
  ('yearly',      'Yearly',   'వార్షికం', 12, 1000.00)
on conflict (code) do nothing;

-- Starter categories (Telangana / AP) -----------------------------------
insert into categories (slug, label_en, label_te, sort_order) values
  ('shaiva',        'Shaiva (Lord Shiva)',  'శైవ',          1),
  ('vaishnava',     'Vaishnava (Lord Vishnu)', 'వైష్ణవ',    2),
  ('shakti',        'Shakti / Devi',        'శక్తి (దేవి)', 3),
  ('grama-devata',  'Village Deities',      'గ్రామ దేవతలు', 4),
  ('hanuman',       'Hanuman',              'హనుమాన్',      5),
  ('ganesha',       'Ganesha',              'గణేశ',         6),
  ('ayyappa',       'Ayyappa',              'అయ్యప్ప',      7),
  ('subrahmanya',   'Subrahmanya',          'సుబ్రహ్మణ్య',  8),
  ('navagraha',     'Navagraha',            'నవగ్రహ',       9)
on conflict (slug) do nothing;

-- Starter deity list (grown later via field_suggestions) ----------------
insert into deities (label_en, label_te) values
  ('Shiva',         'శివుడు'),
  ('Vishnu',        'విష్ణువు'),
  ('Venkateswara',  'వేంకటేశ్వరుడు'),
  ('Lakshmi',       'లక్ష్మి'),
  ('Durga',         'దుర్గ'),
  ('Hanuman',       'హనుమంతుడు'),
  ('Ganesha',       'గణేశుడు'),
  ('Saraswati',     'సరస్వతి'),
  ('Subrahmanya',   'సుబ్రహ్మణ్యుడు'),
  ('Ayyappa',       'అయ్యప్ప'),
  ('Rama',          'రాముడు'),
  ('Krishna',       'కృష్ణుడు'),
  ('Maisamma',      'మైసమ్మ'),
  ('Pochamma',      'పోచమ్మ'),
  ('Yellamma',      'ఎల్లమ్మ')
on conflict (lower(label_en)) do nothing;
