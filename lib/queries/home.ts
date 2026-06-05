import { query, queryOne } from "@/lib/db";
import type { HomeSection } from "@/lib/types";
import type { TempleCard } from "@/lib/queries/temples";

/** Curated, published temples for a given home section (ordered by sort_order). */
export async function getHomeFeatured(section: HomeSection): Promise<TempleCard[]> {
  return query<TempleCard>`
    select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te,
           a.name_en as area_en, a.name_te as area_te,
           coalesce((select json_agg(json_build_object('slug', s.slug, 'label_en', s.label_en, 'label_te', s.label_te) order by s.label_en)
                     from temple_significances ts join significances s on s.id = ts.significance_id
                     where ts.temple_id = t.id), '[]'::json) as significances,
           coalesce((select json_agg(json_build_object('slug', f.slug, 'label_en', f.label_en, 'label_te', f.label_te) order by f.sort_order)
                     from temple_facilities tf join facilities f on f.id = tf.facility_id
                     where tf.temple_id = t.id), '[]'::json) as facilities
    from home_featured hf
    join temples t on t.id = hf.temple_id and t.status = 'published'
    left join deities d on d.id = t.primary_deity_id
    left join areas a on a.id = t.area_id
    where hf.section = ${section}
    order by hf.sort_order, t.name_en`;
}

export interface FeaturedAdminRow {
  id: string;
  section: HomeSection;
  temple_id: string;
  sort_order: number;
  name_en: string;
}

/** All featured rows (any status) for the Super Admin curation screen. */
export async function listFeaturedForAdmin(): Promise<FeaturedAdminRow[]> {
  return query<FeaturedAdminRow>`
    select hf.id, hf.section, hf.temple_id, hf.sort_order, t.name_en
    from home_featured hf join temples t on t.id = hf.temple_id
    order by hf.section, hf.sort_order, t.name_en`;
}

export async function addFeatured(section: HomeSection, templeId: string, userId: string): Promise<void> {
  const next = await queryOne<{ n: number }>`
    select coalesce(max(sort_order), 0) + 1 as n from home_featured where section = ${section}`;
  await queryOne`
    insert into home_featured (section, temple_id, sort_order, created_by)
    values (${section}, ${templeId}, ${next?.n ?? 1}, ${userId})
    on conflict (section, temple_id) do nothing`;
}

export async function removeFeatured(id: string): Promise<void> {
  await queryOne`delete from home_featured where id = ${id}`;
}

/** Lightweight list of published temples for the curation picker. */
export async function listPublishedLite(): Promise<{ id: string; name_en: string }[]> {
  return query<{ id: string; name_en: string }>`
    select id, name_en from temples where status = 'published' order by name_en`;
}

// ---- Browse-by facets: dimension values with published-temple counts ----
export interface Facet {
  value: string; // URL filter value: deity id, district name, or slug
  label_en: string;
  label_te: string | null;
  count: number;
  image_url?: string | null;
}

export async function getDeityFacets(): Promise<Facet[]> {
  return query<Facet>`
    select d.id::text as value, d.label_en, d.label_te, d.image_url, count(t.id)::int as count
    from deities d
    join temples t on t.primary_deity_id = d.id and t.status = 'published'
    group by d.id, d.label_en, d.label_te, d.image_url
    order by count desc, d.label_en`;
}

export async function getLocationFacets(): Promise<Facet[]> {
  return query<Facet>`
    select t.district as value, t.district as label_en, null::text as label_te, count(*)::int as count
    from temples t
    where t.status = 'published' and t.district is not null and t.district <> ''
    group by t.district
    order by count desc, t.district`;
}

export async function getSignificanceFacets(): Promise<Facet[]> {
  return query<Facet>`
    select s.slug as value, s.label_en, s.label_te, count(*)::int as count
    from significances s
    join temple_significances ts on ts.significance_id = s.id
    join temples t on t.id = ts.temple_id and t.status = 'published'
    group by s.slug, s.label_en, s.label_te
    order by count desc, s.label_en`;
}

export async function getFacilityFacets(): Promise<Facet[]> {
  return query<Facet>`
    select f.slug as value, f.label_en, f.label_te, count(*)::int as count
    from facilities f
    join temple_facilities tf on tf.facility_id = f.id
    join temples t on t.id = tf.temple_id and t.status = 'published'
    group by f.slug, f.label_en, f.label_te
    order by count desc, f.label_en`;
}
