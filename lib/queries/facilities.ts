import { query, queryOne } from "@/lib/db";
import type { FacilityRow } from "@/lib/types";
import { slugify, withSuffix } from "@/lib/slug";

export async function listAllFacilities(): Promise<FacilityRow[]> {
  return query<FacilityRow>`select * from facilities order by sort_order, label_en`;
}

export async function addFacility(label_en: string, label_te: string | null, createdBy: string | null): Promise<FacilityRow> {
  let slug = slugify(label_en);
  const clash = await queryOne<{ id: string }>`select id from facilities where slug = ${slug} limit 1`;
  if (clash) slug = withSuffix(slug);
  const next = await queryOne<{ n: number }>`select coalesce(max(sort_order),0)+1 as n from facilities`;
  const row = await queryOne<FacilityRow>`
    insert into facilities (slug, label_en, label_te, sort_order, created_by)
    values (${slug}, ${label_en}, ${label_te}, ${next?.n ?? 1}, ${createdBy})
    returning *`;
  if (!row) throw new Error("Failed to add facility");
  return row;
}

export async function removeFacility(id: string): Promise<void> {
  await queryOne`delete from facilities where id = ${id}`;
}
