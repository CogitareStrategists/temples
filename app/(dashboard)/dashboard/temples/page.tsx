import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import type { TempleCard } from "@/lib/queries/temples";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-turmeric/20 text-[#8a5a00]",
  published: "bg-green-100 text-green-800",
  suspended: "bg-gray-200 text-gray-700",
  rejected: "bg-kumkum/10 text-kumkum",
};

export default async function DashboardTemples() {
  const user = await requireUser();
  const temples =
    user.role === "temple_admin"
      ? await query<TempleCard>`
          select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te
          from temples t left join deities d on d.id = t.primary_deity_id
          where exists (select 1 from temple_admins ta where ta.temple_id = t.id and ta.user_id = ${user.id})
          order by t.created_at desc`
      : await query<TempleCard>`
          select t.*, d.label_en as primary_deity_en, d.label_te as primary_deity_te
          from temples t left join deities d on d.id = t.primary_deity_id
          order by t.created_at desc limit 500`;

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-semibold text-kumkum">Temples</h1>
      {temples.length === 0 ? (
        <p className="text-muted">No temples yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-sandal text-muted">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 hidden sm:table-cell">District</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 bg-white">
              {temples.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium">{t.name_en}</td>
                  <td className="px-4 py-2 hidden sm:table-cell">{t.district ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[t.status] ?? ""}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/dashboard/temples/${t.id}/edit`} className="text-saffron hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
