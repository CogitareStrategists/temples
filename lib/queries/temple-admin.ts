import { query, queryOne } from "@/lib/db";
import type { TempleEventRow, TempleVideoRow, TempleTimingRow, TempleContactRow } from "@/lib/types";

export interface TempleUpdate {
  name_en: string;
  name_te: string | null;
  primary_deity_id: string | null;
  area_id: string | null;
  description_en: string | null;
  description_te: string | null;
  address_line_en: string | null;
  address_line_te: string | null;
  city: string | null;
  district: string | null;
  state: string;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  donation_upi_vpa: string | null;
  donation_upi_name: string | null;
  donation_qr_url: string | null;
  primary_photo_url: string | null;
}

export async function updateTemple(id: string, u: TempleUpdate): Promise<void> {
  await queryOne`
    update temples set
      name_en = ${u.name_en}, name_te = ${u.name_te},
      primary_deity_id = ${u.primary_deity_id},
      area_id = ${u.area_id},
      description_en = ${u.description_en}, description_te = ${u.description_te},
      address_line_en = ${u.address_line_en}, address_line_te = ${u.address_line_te},
      city = ${u.city}, district = ${u.district}, state = ${u.state}, pincode = ${u.pincode},
      latitude = ${u.latitude}, longitude = ${u.longitude},
      contact_phone = ${u.contact_phone}, contact_email = ${u.contact_email},
      donation_upi_vpa = ${u.donation_upi_vpa}, donation_upi_name = ${u.donation_upi_name},
      donation_qr_url = ${u.donation_qr_url}, primary_photo_url = ${u.primary_photo_url}
    where id = ${id}`;
}

export async function getCategoryIds(templeId: string): Promise<string[]> {
  const rows = await query<{ category_id: string }>`
    select category_id from temple_categories where temple_id = ${templeId}`;
  return rows.map((r) => r.category_id);
}

export async function setCategories(templeId: string, categoryIds: string[]): Promise<void> {
  await queryOne`delete from temple_categories where temple_id = ${templeId}`;
  for (const cid of categoryIds) {
    await queryOne`
      insert into temple_categories (temple_id, category_id) values (${templeId}, ${cid})
      on conflict do nothing`;
  }
}

export async function getSecondaryDeityIds(templeId: string): Promise<string[]> {
  const rows = await query<{ deity_id: string }>`
    select deity_id from temple_secondary_deities where temple_id = ${templeId}`;
  return rows.map((r) => r.deity_id);
}

export async function setSecondaryDeities(templeId: string, deityIds: string[]): Promise<void> {
  await queryOne`delete from temple_secondary_deities where temple_id = ${templeId}`;
  for (const did of deityIds) {
    await queryOne`
      insert into temple_secondary_deities (temple_id, deity_id) values (${templeId}, ${did})
      on conflict do nothing`;
  }
}

export async function getSignificanceIds(templeId: string): Promise<string[]> {
  const rows = await query<{ significance_id: string }>`
    select significance_id from temple_significances where temple_id = ${templeId}`;
  return rows.map((r) => r.significance_id);
}

export async function setSignificances(templeId: string, significanceIds: string[]): Promise<void> {
  await queryOne`delete from temple_significances where temple_id = ${templeId}`;
  for (const sid of significanceIds) {
    await queryOne`
      insert into temple_significances (temple_id, significance_id) values (${templeId}, ${sid})
      on conflict do nothing`;
  }
}

export async function getFacilityIds(templeId: string): Promise<string[]> {
  const rows = await query<{ facility_id: string }>`
    select facility_id from temple_facilities where temple_id = ${templeId}`;
  return rows.map((r) => r.facility_id);
}

export async function setFacilities(templeId: string, facilityIds: string[]): Promise<void> {
  await queryOne`delete from temple_facilities where temple_id = ${templeId}`;
  for (const fid of facilityIds) {
    await queryOne`
      insert into temple_facilities (temple_id, facility_id) values (${templeId}, ${fid})
      on conflict do nothing`;
  }
}

// ---- Events ----
export async function listEvents(templeId: string): Promise<TempleEventRow[]> {
  return query<TempleEventRow>`select * from temple_events where temple_id = ${templeId} order by created_at desc`;
}
export async function addEvent(
  templeId: string,
  data: { title_en: string; title_te: string | null; description_en: string | null; description_te: string | null; starts_at: string | null; is_public: boolean },
  userId: string
): Promise<void> {
  await queryOne`
    insert into temple_events (temple_id, title_en, title_te, description_en, description_te, starts_at, is_public, created_by)
    values (${templeId}, ${data.title_en}, ${data.title_te}, ${data.description_en}, ${data.description_te},
            ${data.starts_at}, ${data.is_public}, ${userId})`;
}
export async function toggleEventPublic(id: string): Promise<void> {
  await queryOne`update temple_events set is_public = not is_public where id = ${id}`;
}
export async function deleteEvent(id: string): Promise<void> {
  await queryOne`delete from temple_events where id = ${id}`;
}

// ---- Videos ----
export async function listVideos(templeId: string): Promise<TempleVideoRow[]> {
  return query<TempleVideoRow>`select * from temple_videos where temple_id = ${templeId} order by sort_order, created_at desc`;
}
export async function addVideo(
  templeId: string,
  data: { title_en: string; title_te: string | null; video_url: string; is_public: boolean },
  userId: string
): Promise<void> {
  await queryOne`
    insert into temple_videos (temple_id, title_en, title_te, video_url, is_public, created_by)
    values (${templeId}, ${data.title_en}, ${data.title_te}, ${data.video_url}, ${data.is_public}, ${userId})`;
}
export async function toggleVideoPublic(id: string): Promise<void> {
  await queryOne`update temple_videos set is_public = not is_public where id = ${id}`;
}
export async function deleteVideo(id: string): Promise<void> {
  await queryOne`delete from temple_videos where id = ${id}`;
}

// ---- Timings ----
export async function listTimings(templeId: string): Promise<TempleTimingRow[]> {
  return query<TempleTimingRow>`
    select * from temple_timings where temple_id = ${templeId} order by day_of_week, session_order`;
}
export async function addTiming(
  templeId: string,
  data: { day_of_week: number; session_order: number; session_label_en: string | null; open_time: string; close_time: string }
): Promise<void> {
  await queryOne`
    insert into temple_timings (temple_id, day_of_week, session_order, session_label_en, open_time, close_time)
    values (${templeId}, ${data.day_of_week}, ${data.session_order}, ${data.session_label_en}, ${data.open_time}, ${data.close_time})
    on conflict (temple_id, day_of_week, session_order) do update
      set session_label_en = excluded.session_label_en, open_time = excluded.open_time, close_time = excluded.close_time`;
}
export async function deleteTiming(id: string): Promise<void> {
  await queryOne`delete from temple_timings where id = ${id}`;
}

export async function rejectTemple(templeId: string, superAdminId: string): Promise<void> {
  await queryOne`update temples set status = 'rejected', approved_by = ${superAdminId} where id = ${templeId}`;
}

export async function getContacts(templeId: string): Promise<TempleContactRow[]> {
  return query<TempleContactRow>`
    select * from temple_contacts where temple_id = ${templeId} order by sort_order, created_at`;
}

export async function setContacts(
  templeId: string,
  contacts: { label_en: string; label_te: string | null; person_name: string | null; phone: string }[]
): Promise<void> {
  await queryOne`delete from temple_contacts where temple_id = ${templeId}`;
  let i = 0;
  for (const c of contacts) {
    await queryOne`
      insert into temple_contacts (temple_id, label_en, label_te, person_name, phone, sort_order)
      values (${templeId}, ${c.label_en}, ${c.label_te}, ${c.person_name}, ${c.phone}, ${i++})`;
  }
}

export async function getTempleAdminIds(templeId: string): Promise<string[]> {
  const rows = await query<{ user_id: string }>`
    select user_id from temple_admins where temple_id = ${templeId}`;
  return rows.map((r) => r.user_id);
}

export async function setTempleAdmins(templeId: string, userIds: string[]): Promise<void> {
  await queryOne`delete from temple_admins where temple_id = ${templeId}`;
  for (const uid of userIds) {
    await queryOne`
      insert into temple_admins (temple_id, user_id) values (${templeId}, ${uid})
      on conflict do nothing`;
  }
}

export async function addTempleAdmin(templeId: string, userId: string): Promise<void> {
  await queryOne`
    insert into temple_admins (temple_id, user_id) values (${templeId}, ${userId})
    on conflict do nothing`;
}

export async function isTempleAdmin(templeId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ x: number }>`
    select 1 as x from temple_admins where temple_id = ${templeId} and user_id = ${userId} limit 1`;
  return !!row;
}
