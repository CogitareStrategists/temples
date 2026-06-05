import { query, queryOne } from "@/lib/db";
import type { DeityRow, CategoryRow, SignificanceRow, FacilityRow } from "@/lib/types";

export async function listDeities(): Promise<DeityRow[]> {
  return query<DeityRow>`select * from deities where status = 'active' order by label_en`;
}
export async function listCategories(): Promise<CategoryRow[]> {
  return query<CategoryRow>`select * from categories where status = 'active' order by sort_order, label_en`;
}
export async function addDeity(label_en: string, label_te: string | null, createdBy: string | null): Promise<DeityRow> {
  const row = await queryOne<DeityRow>`
    insert into deities (label_en, label_te, created_by) values (${label_en}, ${label_te}, ${createdBy})
    on conflict (lower(label_en)) do update set label_te = coalesce(excluded.label_te, deities.label_te)
    returning *`;
  if (!row) throw new Error("Failed to add deity");
  return row;
}

export async function listSignificances(): Promise<SignificanceRow[]> {
  return query<SignificanceRow>`select * from significances where status = 'active' order by sort_order, label_en`;
}

export async function listFacilities(): Promise<FacilityRow[]> {
  return query<FacilityRow>`select * from facilities where status = 'active' order by sort_order, label_en`;
}

export async function listAllDeities(): Promise<DeityRow[]> {
  return query<DeityRow>`select * from deities order by label_en`;
}

export async function setDeityImage(id: string, imageUrl: string | null): Promise<void> {
  await queryOne`update deities set image_url = ${imageUrl} where id = ${id}`;
}
