-- =====================================================================
-- 0007 — Deity images. Each deity may carry an uploaded image, shown as
-- tiles in the home "Temples by Deity" section. Super Admin manages these.
-- =====================================================================

alter table deities add column image_url text;
