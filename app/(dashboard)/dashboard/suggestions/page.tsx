import { requireUser } from "@/lib/auth-helpers";
import { listSuggestions } from "@/lib/queries/suggestions";
import { TELANGANA_DISTRICTS, ANDHRA_PRADESH_DISTRICTS } from "@/lib/districts";
import {
  createSuggestionAction,
  approveSuggestionAction,
  rejectSuggestionAction,
} from "@/app/(dashboard)/actions";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const user = await requireUser();
  const isSuper = user.role === "super_admin";
  const all = await listSuggestions();
  const mine = all.filter((s) => s.suggested_by === user.id);
  const pending = all.filter((s) => s.status === "pending");

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold text-kumkum">Suggestions</h1>

      {/* Managers and temple admins can both suggest; admins mainly use this for areas. */}
      <form action={createSuggestionAction} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-display text-xl text-kumkum sm:col-span-2">Propose a change</h2>
          <div>
            <label className="label">Scope</label>
            <select className="input" name="scope" defaultValue="global">
              <option value="global">Global (whole portal)</option>
              <option value="temple">A specific temple</option>
            </select>
          </div>
          <div>
            <label className="label">Target</label>
            <select className="input" name="target" defaultValue="deity">
              <option value="deity">Add a deity</option>
              <option value="area">Add an area (under a district)</option>
              <option value="category">Add a category</option>
              <option value="field_modification">Field modification</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">District (required for an area)</label>
            <select className="input" name="district" defaultValue="">
              <option value="">—</option>
              <optgroup label="Telangana">
                {TELANGANA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
              <optgroup label="Andhra Pradesh">
                {ANDHRA_PRADESH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            </select>
          </div>
          <div><label className="label">Temple ID (if temple-scoped)</label><input className="input" name="temple_id" /></div>
          <div><label className="label">Value (English)</label><input className="input" name="label_en" placeholder="e.g. Maisamma, or area name" /></div>
          <div><label className="label">విలువ (తెలుగు)</label><input className="input lang-te" name="label_te" placeholder="e.g. మైసమ్మ" /></div>
          <div className="sm:col-span-2"><label className="label">Rationale</label><textarea className="input" name="rationale" /></div>
          <button className="btn-primary sm:col-span-2">Submit suggestion</button>
        </form>

      {isSuper && (
        <section>
          <h2 className="mb-3 font-display text-xl text-kumkum">Pending review</h2>
          {pending.length === 0 ? (
            <p className="text-muted">Nothing pending.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((s) => (
                <li key={s.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {s.target.replace("_", " ")} · {s.scope}
                      {s.label_en ? `: ${s.label_en}` : ""}
                      {s.label_te ? ` / ${s.label_te}` : ""}
                    </p>
                    {s.rationale && <p className="text-sm text-muted">{s.rationale}</p>}
                  </div>
                  <div className="flex gap-2">
                    <form action={approveSuggestionAction}><input type="hidden" name="id" value={s.id} /><button className="btn-primary">Approve</button></form>
                    <form action={rejectSuggestionAction}><input type="hidden" name="id" value={s.id} /><button className="btn-ghost">Reject</button></form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!isSuper && (
        <section>
          <h2 className="mb-3 font-display text-xl text-kumkum">Your suggestions</h2>
          {mine.length === 0 ? (
            <p className="text-muted">No suggestions yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {mine.map((s) => (
                <li key={s.id} className="card flex items-center justify-between p-3">
                  <span>{s.target.replace("_", " ")}{s.label_en ? `: ${s.label_en}` : ""}</span>
                  <span className="text-muted">{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
