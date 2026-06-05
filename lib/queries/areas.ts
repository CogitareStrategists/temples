import { query, queryOne } from "@/lib/db";
import type { AreaRow } from "@/lib/types";

export async function listAreas(): Promise<AreaRow[]> {
  return query<AreaRow>`select * from areas where status = 'active' order by district, name_en`;
}

export async function listAllAreas(): Promise<AreaRow[]> {
  return query<AreaRow>`select * from areas order by district, name_en`;
}

export async function addArea(
  district: string,
  name_en: string,
  name_te: string | null,
  createdBy: string | null
): Promise<AreaRow> {
  const row = await queryOne<AreaRow>`
    insert into areas (district, name_en, name_te, created_by)
    values (${district}, ${name_en}, ${name_te}, ${createdBy})
    on conflict (district, lower(name_en)) do update set name_te = coalesce(excluded.name_te, areas.name_te)
    returning *`;
  if (!row) throw new Error("Failed to add area");
  return row;
}

export async function removeArea(id: string): Promise<void> {
  await queryOne`delete from areas where id = ${id}`;
}
