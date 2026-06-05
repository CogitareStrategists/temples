import { requireRole } from "@/lib/auth-helpers";
import { listFeaturedForAdmin, listPublishedLite } from "@/lib/queries/home";
import { addHomeFeaturedAction, removeHomeFeaturedAction } from "@/app/(dashboard)/actions";
import type { HomeSection } from "@/lib/types";

export const dynamic = "force-dynamic";

const SECTIONS: { key: HomeSection; title: string }[] = [
  { key: "featured", title: "Featured Temples" },
];

export default async function HomeCurationPage() {
  await requireRole("super_admin");
  const [featured, temples] = await Promise.all([listFeaturedForAdmin(), listPublishedLite()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Home page</h1>
        <p className="text-sm text-muted">
          Pick the published temples shown in the <strong>Featured Temples</strong> row on the home page, in the order
          you add them. The other home sections (by deity, location, significance, facilities) are generated
          automatically from temple data — no curation needed.
        </p>
      </div>

      {SECTIONS.map((sec) => {
        const rows = featured.filter((f) => f.section === sec.key);
        return (
          <section key={sec.key} className="card p-6">
            <h2 className="mb-3 font-display text-xl text-kumkum">{sec.title}</h2>

            {rows.length === 0 ? (
              <p className="mb-4 text-sm text-muted">No temples featured yet.</p>
            ) : (
              <ul className="mb-4 divide-y divide-ink/5 text-sm">
                {rows.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2">
                    <span>{f.name_en}</span>
                    <form action={removeHomeFeaturedAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="text-kumkum hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={addHomeFeaturedAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="section" value={sec.key} />
              <div className="min-w-[16rem] flex-1">
                <label className="label">Add a temple</label>
                <select className="input" name="temple_id" defaultValue="" required>
                  <option value="" disabled>Select a published temple…</option>
                  {temples.map((t) => (
                    <option key={t.id} value={t.id}>{t.name_en}</option>
                  ))}
                </select>
              </div>
              <button className="btn-saffron">Add</button>
            </form>
          </section>
        );
      })}

      {temples.length === 0 && (
        <p className="text-sm text-muted">
          There are no published temples yet — approve a temple first, then come back to feature it here.
        </p>
      )}
    </div>
  );
}
