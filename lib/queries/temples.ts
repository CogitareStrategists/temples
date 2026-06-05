import { query, queryOne } from "@/lib/db";
import type {
  TempleRow,
  DeityRow,
  CategoryRow,
  SignificanceRow,
  FacilityRow,
  TempleContactRow,
  TempleTimingRow,
  TempleTimingExceptionRow,
  TempleEventRow,
  TempleVideoRow,
} from "@/lib/types";

export interface LabelPair {
  slug: string;
  label_en: string;
  label_te: string | null;
}

export interface TempleCard extends TempleRow {
  primary_deity_en: string | null;
  primary_deity_te: string | null;
  area_en: string | null;
  area_te: string | null;
  significances: LabelPair[];
  facilities: LabelPair[];
}

export interface TempleDetail extends TempleCard {
  secondary_deities: DeityRow[];
  categories: CategoryRow[];
  significance_list: SignificanceRow[];
  facility_list: FacilityRow[];
  contact_list: TempleContactRow[];
  timings: TempleTimingRow[];
  exceptions: TempleTimingExceptionRow[];
  events: TempleEventRow[];
  videos: TempleVideoRow[];
}

export interface TempleFilter {
  search?: string;
  categorySlug?: string;
  district?: string;
  deityId?: string;
  significanceSlug?: string;
  facilitySlug?: string;
}


export async function listPublishedTemples(filter: TempleFilter = {}): Promise<TempleCard[]> {
  const search = filter.search?.trim() || null;
  const category = filter.categorySlug || null;
  const district = filter.district || null;
  const deityId = filter.deityId || null;
  const significanceSlug = filter.significanceSlug || null;
  const facilitySlug = filter.facilitySlug || null;
  // Single query with optional filters; trigram-friendly ILIKE for EN+Telugu.
  const like = search ? `%${search}%` : null;
  return query<TempleCard>`
    select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te,
           a.name_en as area_en, a.name_te as area_te,
           coalesce((select json_agg(json_build_object('slug', s.slug, 'label_en', s.label_en, 'label_te', s.label_te) order by s.label_en)
                     from temple_significances ts join significances s on s.id = ts.significance_id
                     where ts.temple_id = t.id), '[]'::json) as significances,
           coalesce((select json_agg(json_build_object('slug', f.slug, 'label_en', f.label_en, 'label_te', f.label_te) order by f.sort_order)
                     from temple_facilities tf join facilities f on f.id = tf.facility_id
                     where tf.temple_id = t.id), '[]'::json) as facilities
    from temples t
    left join deities d on d.id = t.primary_deity_id
    left join areas a on a.id = t.area_id
    where t.status = 'published'
      and (${category}::text is null or exists (
            select 1 from temple_categories tc
            join categories c on c.id = tc.category_id
            where tc.temple_id = t.id and c.slug = ${category}))
      and (${district}::text is null or t.district = ${district})
      and (${deityId}::uuid is null or t.primary_deity_id = ${deityId}::uuid)
      and (${significanceSlug}::text is null or exists (
            select 1 from temple_significances ts2
            join significances s2 on s2.id = ts2.significance_id
            where ts2.temple_id = t.id and s2.slug = ${significanceSlug}))
      and (${facilitySlug}::text is null or exists (
            select 1 from temple_facilities tf2
            join facilities f2 on f2.id = tf2.facility_id
            where tf2.temple_id = t.id and f2.slug = ${facilitySlug}))
      and (${like}::text is null
           or t.name_en ilike ${like} or t.name_te ilike ${like}
           or t.city ilike ${like} or t.district ilike ${like}
           or d.label_en ilike ${like} or d.label_te ilike ${like})
    order by t.name_en asc
    limit 200
  `;
}

export async function getTempleBySlug(slug: string): Promise<TempleDetail | null> {
  const temple = await queryOne<TempleCard>`
    select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te,
           a.name_en as area_en, a.name_te as area_te,
           coalesce((select json_agg(json_build_object('slug', s.slug, 'label_en', s.label_en, 'label_te', s.label_te) order by s.label_en)
                     from temple_significances ts join significances s on s.id = ts.significance_id
                     where ts.temple_id = t.id), '[]'::json) as significances,
           coalesce((select json_agg(json_build_object('slug', f.slug, 'label_en', f.label_en, 'label_te', f.label_te) order by f.sort_order)
                     from temple_facilities tf join facilities f on f.id = tf.facility_id
                     where tf.temple_id = t.id), '[]'::json) as facilities
    from temples t
    left join deities d on d.id = t.primary_deity_id
    left join areas a on a.id = t.area_id
    where t.slug = ${slug} limit 1
  `;
  if (!temple) return null;
  const id = temple.id;
  const [secondary, cats, sigs, facs, contacts, timings, exceptions, events, videos] = await Promise.all([
    query<DeityRow>`
      select d.* from deities d
      join temple_secondary_deities s on s.deity_id = d.id
      where s.temple_id = ${id} order by d.label_en`,
    query<CategoryRow>`
      select c.* from categories c
      join temple_categories tc on tc.category_id = c.id
      where tc.temple_id = ${id} order by c.sort_order`,
    query<SignificanceRow>`
      select s.* from significances s
      join temple_significances ts on ts.significance_id = s.id
      where ts.temple_id = ${id} order by s.sort_order, s.label_en`,
    query<FacilityRow>`
      select f.* from facilities f
      join temple_facilities tf on tf.facility_id = f.id
      where tf.temple_id = ${id} order by f.sort_order, f.label_en`,
    query<TempleContactRow>`
      select * from temple_contacts where temple_id = ${id} order by sort_order, created_at`,
    query<TempleTimingRow>`
      select * from temple_timings where temple_id = ${id}
      order by day_of_week, session_order`,
    query<TempleTimingExceptionRow>`
      select * from temple_timing_exceptions where temple_id = ${id}
      order by coalesce(exception_date, valid_from)`,
    query<TempleEventRow>`
      select * from temple_events where temple_id = ${id} and is_public = true
      order by starts_at nulls last, created_at desc`,
    query<TempleVideoRow>`
      select * from temple_videos where temple_id = ${id} and is_public = true
      order by sort_order, created_at desc`,
  ]);
  return {
    ...temple,
    secondary_deities: secondary,
    categories: cats,
    significance_list: sigs,
    facility_list: facs,
    contact_list: contacts,
    timings,
    exceptions,
    events,
    videos,
  };
}

export async function getTempleById(id: string): Promise<TempleRow | null> {
  return queryOne<TempleRow>`select * from temples where id = ${id} limit 1`;
}

export async function listDistricts(): Promise<string[]> {
  const rows = await query<{ district: string }>`
    select distinct district from temples
    where status = 'published' and district is not null and district <> ''
    order by district`;
  return rows.map((r) => r.district);
}

export interface NewTempleInput {
  slug: string;
  name_en: string;
  name_te?: string | null;
  primary_deity_id?: string | null;
  area_id?: string | null;
  district?: string | null;
  state?: string;
  primary_photo_url?: string | null;
  created_by: string;
}

/** Create a temple in pending_approval state and record the initial snapshot. */
export async function createTemple(input: NewTempleInput): Promise<TempleRow> {
  const temple = await queryOne<TempleRow>`
    insert into temples (slug, name_en, name_te, primary_deity_id, area_id, district, state, primary_photo_url, created_by, status)
    values (${input.slug}, ${input.name_en}, ${input.name_te ?? null},
            ${input.primary_deity_id ?? null}, ${input.area_id ?? null}, ${input.district ?? null},
            ${input.state ?? "Telangana"}, ${input.primary_photo_url ?? null}, ${input.created_by}, 'pending_approval')
    returning *`;
  if (!temple) throw new Error("Failed to create temple");
  await writeVersion(temple.id, "initial_submission", input.created_by, false, false);
  return temple;
}

/** Build a JSON snapshot of the core temple info. */
export async function buildSnapshot(templeId: string): Promise<Record<string, unknown>> {
  const temple = await getTempleById(templeId);
  const [secondary, cats, sigs, facs, timings, exceptions] = await Promise.all([
    query<{ deity_id: string }>`select deity_id from temple_secondary_deities where temple_id = ${templeId}`,
    query<{ category_id: string }>`select category_id from temple_categories where temple_id = ${templeId}`,
    query<{ significance_id: string }>`select significance_id from temple_significances where temple_id = ${templeId}`,
    query<{ facility_id: string }>`select facility_id from temple_facilities where temple_id = ${templeId}`,
    query<TempleTimingRow>`select * from temple_timings where temple_id = ${templeId}`,
    query<TempleTimingExceptionRow>`select * from temple_timing_exceptions where temple_id = ${templeId}`,
  ]);
  return {
    temple,
    secondary_deity_ids: secondary.map((s) => s.deity_id),
    category_ids: cats.map((c) => c.category_id),
    significance_ids: sigs.map((s) => s.significance_id),
    facility_ids: facs.map((f) => f.facility_id),
    timings,
    timing_exceptions: exceptions,
  };
}

export async function writeVersion(
  templeId: string,
  type: "initial_submission" | "edit" | "approved_baseline",
  userId: string | null,
  isOriginalApproved: boolean,
  isApprovedBaseline: boolean,
  note?: string
) {
  const snapshot = await buildSnapshot(templeId);
  const next = await queryOne<{ n: number }>`
    select coalesce(max(version_number), 0) + 1 as n from temple_versions where temple_id = ${templeId}`;
  await queryOne`
    insert into temple_versions
      (temple_id, version_number, version_type, snapshot, is_original_approved, is_approved_baseline, note, created_by)
    values (${templeId}, ${next?.n ?? 1}, ${type}, ${JSON.stringify(snapshot)}::jsonb,
            ${isOriginalApproved}, ${isApprovedBaseline}, ${note ?? null}, ${userId})`;
}

/** Super Admin approves a pending temple: publish + flag the original baseline. */
export async function approveTemple(templeId: string, superAdminId: string): Promise<void> {
  await queryOne`
    update temples set status = 'published', approved_by = ${superAdminId}, approved_at = now()
    where id = ${templeId}`;
  // Is this the first approval? (sets the immutable original baseline)
  const existing = await queryOne<{ id: string }>`
    select id from temple_versions where temple_id = ${templeId} and is_original_approved limit 1`;
  // Clear any prior approved-baseline flag so the new snapshot is the sole baseline.
  await queryOne`
    update temple_versions set is_approved_baseline = false
    where temple_id = ${templeId} and is_approved_baseline`;
  await writeVersion(templeId, "approved_baseline", superAdminId, !existing, true, "Approved");
}

export async function listTemplesForRole(): Promise<TempleCard[]> {
  return query<TempleCard>`
    select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te,
           a.name_en as area_en, a.name_te as area_te,
           coalesce((select json_agg(json_build_object('slug', s.slug, 'label_en', s.label_en, 'label_te', s.label_te) order by s.label_en)
                     from temple_significances ts join significances s on s.id = ts.significance_id
                     where ts.temple_id = t.id), '[]'::json) as significances,
           coalesce((select json_agg(json_build_object('slug', f.slug, 'label_en', f.label_en, 'label_te', f.label_te) order by f.sort_order)
                     from temple_facilities tf join facilities f on f.id = tf.facility_id
                     where tf.temple_id = t.id), '[]'::json) as facilities
    from temples t
    left join deities d on d.id = t.primary_deity_id
    left join areas a on a.id = t.area_id
    order by t.created_at desc limit 500`;
}

/** A temple admin's editing is locked when there is no valid subscription. */
export const EDIT_GRACE_DAYS = 7;

/**
 * A temple admin's editing is locked when there's no active subscription AND
 * the new-temple grace window has passed. Order:
 *   1) active paid subscription (through end of that day) -> open
 *   2) within EDIT_GRACE_DAYS of creation (free trial)   -> open
 *   3) otherwise                                          -> locked
 * (Managers and the Super Admin are never subject to this.)
 */
export function isEditingLocked(temple: TempleRow): boolean {
  const now = new Date();
  if (temple.subscription_valid_until) {
    const until = new Date(`${temple.subscription_valid_until}T23:59:59`);
    if (until >= now) return false;
  }
  const graceEnd = new Date(temple.created_at);
  graceEnd.setDate(graceEnd.getDate() + EDIT_GRACE_DAYS);
  if (now <= graceEnd) return false;
  return true;
}

/** Days left in the free-trial grace window (0 once it has passed). */
export function graceDaysLeft(temple: TempleRow): number {
  const graceEnd = new Date(temple.created_at);
  graceEnd.setDate(graceEnd.getDate() + EDIT_GRACE_DAYS);
  const ms = graceEnd.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
