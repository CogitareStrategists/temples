import { requireRole } from "@/lib/auth-helpers";
import { listAllAreas } from "@/lib/queries/areas";
import { addAreaAction, removeAreaAction } from "@/app/(dashboard)/actions";
import { TELANGANA_DISTRICTS, ANDHRA_PRADESH_DISTRICTS } from "@/lib/districts";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  await requireRole("super_admin");
  const areas = await listAllAreas();

  // group by district for display
  const byDistrict = new Map<string, typeof areas>();
  for (const a of areas) {
    if (!byDistrict.has(a.district)) byDistrict.set(a.district, []);
    byDistrict.get(a.district)!.push(a);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Areas</h1>
        <p className="text-sm text-muted">
          Areas are the second level of location, nested under a district. Managers and temple admins can suggest new
          areas under <strong>Suggestions</strong>; approving an area suggestion adds it here automatically.
        </p>
      </div>

      <form action={addAreaAction} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-display text-xl text-kumkum sm:col-span-3">Add an area</h2>
        <div>
          <label className="label">District *</label>
          <select className="input" name="district" required defaultValue="">
            <option value="" disabled>Select…</option>
            <optgroup label="Telangana">
              {TELANGANA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
            <optgroup label="Andhra Pradesh">
              {ANDHRA_PRADESH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          </select>
        </div>
        <div><label className="label">Area name (English) *</label><input className="input" name="name_en" required /></div>
        <div><label className="label">పేరు (తెలుగు)</label><input className="input lang-te" name="name_te" /></div>
        <button className="btn-primary sm:col-span-3">Add area</button>
      </form>

      {areas.length === 0 ? (
        <p className="text-muted">No areas yet.</p>
      ) : (
        <div className="space-y-4">
          {[...byDistrict.entries()].map(([district, rows]) => (
            <section key={district} className="card p-5">
              <h3 className="mb-2 font-medium text-saffron">{district}</h3>
              <ul className="divide-y divide-ink/5 text-sm">
                {rows.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span>{a.name_en}{a.name_te ? ` / ${a.name_te}` : ""}</span>
                    <form action={removeAreaAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-kumkum hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
