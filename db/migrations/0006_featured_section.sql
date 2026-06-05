-- =====================================================================
-- 0006 — Hybrid home page. The four "by X" sections become auto-generated
-- browse tiles (no curation needed). The Super Admin now curates a single
-- "Featured Temples" row, stored under home_featured.section = 'featured'.
-- =====================================================================

alter type home_section add value if not exists 'featured';
