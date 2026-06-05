import { requireRole } from "@/lib/auth-helpers";
import { listDeities, listSignificances, listFacilities } from "@/lib/queries/lists";
import { listAreas } from "@/lib/queries/areas";
import { createTempleAction } from "@/app/(dashboard)/actions";
import { DistrictAreaPicker } from "@/components/DistrictAreaPicker";
import { ImageUpload } from "@/components/ImageUpload";

export const dynamic = "force-dynamic";

export default async function NewTemplePage() {
  await requireRole("super_admin", "temple_manager");
  const [deities, significances, facilities, areas] = await Promise.all([
    listDeities(),
    listSignificances(),
    listFacilities(),
    listAreas(),
  ]);
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Add a Temple</h1>
      <p className="mb-6 text-sm text-muted">
        The temple will be created in <strong>pending approval</strong> and goes live once a Super Admin approves it.
      </p>
      <form action={createTempleAction} className="card space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Temple name (English) *</label>
            <input className="input" name="name_en" required />
          </div>
          <div>
            <label className="label">దేవాలయం పేరు (తెలుగు)</label>
            <input className="input lang-te" name="name_te" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Deity</label>
            <select className="input" name="primary_deity_id" defaultValue="">
              <option value="">—</option>
              {deities.map((d) => (
                <option key={d.id} value={d.id}>{d.label_en}{d.label_te ? ` / ${d.label_te}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Significance (optional — select one or more)</label>
            <select className="input h-28" name="significance_ids" multiple>
              {significances.map((sg) => (
                <option key={sg.id} value={sg.id}>{sg.label_en}{sg.label_te ? ` / ${sg.label_te}` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DistrictAreaPicker areas={areas} />
        </div>

        <div>
          <label className="label">State</label>
          <select className="input" name="state" defaultValue="Telangana">
            <option>Telangana</option>
            <option>Andhra Pradesh</option>
          </select>
        </div>

        <div>
          <label className="label">Facilities (select all that apply)</label>
          <div className="flex flex-wrap gap-3">
            {facilities.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="facility_ids" value={f.id} />
                {f.label_en}
              </label>
            ))}
          </div>
        </div>

        <ImageUpload name="primary_photo_url" label="Temple photo (optional)" />

        <button className="btn-primary">Create temple</button>
      </form>
    </div>
  );
}
