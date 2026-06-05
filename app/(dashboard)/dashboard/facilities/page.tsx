import { requireRole } from "@/lib/auth-helpers";
import { listAllFacilities } from "@/lib/queries/facilities";
import { addFacilityAction, removeFacilityAction } from "@/app/(dashboard)/actions";

export const dynamic = "force-dynamic";

export default async function FacilitiesPage() {
  await requireRole("super_admin");
  const facilities = await listAllFacilities();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Facilities</h1>
        <p className="text-sm text-muted">
          Facilities are a shared list that temple managers and admins choose from on each temple. Add new ones here.
        </p>
      </div>

      <form action={addFacilityAction} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-display text-xl text-kumkum sm:col-span-2">Add a facility</h2>
        <div><label className="label">Name (English) *</label><input className="input" name="label_en" required /></div>
        <div><label className="label">పేరు (తెలుగు)</label><input className="input lang-te" name="label_te" /></div>
        <button className="btn-primary sm:col-span-2">Add facility</button>
      </form>

      {facilities.length === 0 ? (
        <p className="text-muted">No facilities yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-sandal text-muted"><tr><th className="px-4 py-2">English</th><th className="px-4 py-2">తెలుగు</th><th className="px-4 py-2"></th></tr></thead>
            <tbody className="divide-y divide-ink/5 bg-white">
              {facilities.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2 font-medium">{f.label_en}</td>
                  <td className="px-4 py-2 lang-te">{f.label_te ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeFacilityAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="text-kumkum hover:underline">Remove</button>
                    </form>
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
