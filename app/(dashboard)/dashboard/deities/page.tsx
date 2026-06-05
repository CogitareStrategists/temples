import { requireRole } from "@/lib/auth-helpers";
import { listAllDeities } from "@/lib/queries/lists";
import { addDeityAction, setDeityImageAction } from "@/app/(dashboard)/actions";
import { ImageUpload } from "@/components/ImageUpload";

export const dynamic = "force-dynamic";

export default async function DeitiesPage() {
  await requireRole("super_admin");
  const deities = await listAllDeities();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Deities</h1>
        <p className="text-sm text-muted">
          Add deities and give each one an image. Deity images appear as tiles in the home “Temples by Deity” section.
          Upload a picture you have the right to use.
        </p>
      </div>

      <form action={addDeityAction} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-display text-xl text-kumkum sm:col-span-2">Add a deity</h2>
        <div><label className="label">Name (English) *</label><input className="input" name="label_en" required /></div>
        <div><label className="label">పేరు (తెలుగు)</label><input className="input lang-te" name="label_te" /></div>
        <button className="btn-primary sm:col-span-2">Add deity</button>
      </form>

      <div className="space-y-4">
        {deities.map((d) => (
          <form key={d.id} action={setDeityImageAction} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <input type="hidden" name="id" value={d.id} />
            <div className="min-w-48 flex-1">
              <p className="font-display text-lg text-ink">{d.label_en}</p>
              {d.label_te && <p className="lang-te text-sm text-muted">{d.label_te}</p>}
            </div>
            <div className="sm:w-72">
              <ImageUpload name="image_url" label="Deity image" defaultUrl={d.image_url} />
            </div>
            <button className="btn-primary sm:self-end">Save image</button>
          </form>
        ))}
      </div>
    </div>
  );
}
