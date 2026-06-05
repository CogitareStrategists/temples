import { query, queryOne } from "@/lib/db";
import type { TempleAdminRequestRow } from "@/lib/types";

export interface AdminRequestWithTemple extends TempleAdminRequestRow {
  temple_name_en: string;
}

export async function createTempleAdminRequest(
  templeId: string,
  input: { full_name: string; email: string; phone: string | null },
  requestedBy: string | null
): Promise<void> {
  await queryOne`
    insert into temple_admin_requests (temple_id, full_name, email, phone, requested_by)
    values (${templeId}, ${input.full_name}, ${input.email.toLowerCase()}, ${input.phone}, ${requestedBy})`;
}

export async function listPendingAdminRequests(): Promise<AdminRequestWithTemple[]> {
  return query<AdminRequestWithTemple>`
    select r.*, t.name_en as temple_name_en
    from temple_admin_requests r join temples t on t.id = r.temple_id
    where r.status = 'pending' order by r.created_at`;
}

export async function listAdminRequestsForTemple(templeId: string): Promise<TempleAdminRequestRow[]> {
  return query<TempleAdminRequestRow>`
    select * from temple_admin_requests where temple_id = ${templeId} order by created_at desc`;
}

export async function getAdminRequest(id: string): Promise<TempleAdminRequestRow | null> {
  return queryOne<TempleAdminRequestRow>`select * from temple_admin_requests where id = ${id}`;
}

export async function markAdminRequest(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string | null
): Promise<void> {
  await queryOne`update temple_admin_requests set status = ${status}, reviewed_by = ${reviewedBy} where id = ${id}`;
}
