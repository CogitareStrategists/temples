import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getTempleById, isEditingLocked, graceDaysLeft } from "@/lib/queries/temples";
import { listDeities, listCategories, listSignificances, listFacilities } from "@/lib/queries/lists";
import { listAreas } from "@/lib/queries/areas";
import { listTempleAdmins } from "@/lib/queries/users";
import { listAdminRequestsForTemple } from "@/lib/queries/admin-requests";
import { listPlans } from "@/lib/queries/subscriptions";
import { DistrictAreaPicker } from "@/components/DistrictAreaPicker";
import { ImageUpload } from "@/components/ImageUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { ContactsEditor } from "@/components/ContactsEditor";
import {
  getCategoryIds,
  getSecondaryDeityIds,
  getSignificanceIds,
  getFacilityIds,
  getContacts,
  getTempleAdminIds,
  listEvents,
  listVideos,
  listTimings,
} from "@/lib/queries/temple-admin";
import {
  saveTempleAction,
  addEventAction,
  toggleEventPublicAction,
  deleteEventAction,
  addVideoAction,
  toggleVideoPublicAction,
  deleteVideoAction,
  addTimingAction,
  deleteTimingAction,
  proposeTempleAdminAction,
  recordOfflinePaymentAction,
} from "@/app/(dashboard)/actions";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function EditTemplePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const temple = await getTempleById(params.id);
  if (!temple) notFound();
  const adminIds = await getTempleAdminIds(temple.id);
  // A temple admin may only open a temple they are assigned to.
  if (user.role === "temple_admin" && !adminIds.includes(user.id)) notFound();
  const tAdmins = user.role === "super_admin" ? await listTempleAdmins() : [];
  const adminRequests = user.role === "temple_admin" ? [] : await listAdminRequestsForTemple(temple.id);
  const plans = user.role === "super_admin" ? await listPlans() : [];

  const [deities, categories, significances, facilities, areas, catIds, secIds, sigIds, facIds, events, videos, timings, contacts] =
    await Promise.all([
      listDeities(),
      listCategories(),
      listSignificances(),
      listFacilities(),
      listAreas(),
      getCategoryIds(temple.id),
      getSecondaryDeityIds(temple.id),
      getSignificanceIds(temple.id),
      getFacilityIds(temple.id),
      listEvents(temple.id),
      listVideos(temple.id),
      listTimings(temple.id),
      getContacts(temple.id),
    ]);

  const locked = user.role === "temple_admin" && isEditingLocked(temple);
  const inTrial =
    user.role === "temple_admin" &&
    !locked &&
    !(temple.subscription_valid_until && new Date(`${temple.subscription_valid_until}T23:59:59`) >= new Date());
  const trialDaysLeft = inTrial ? graceDaysLeft(temple) : 0;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-kumkum">{temple.name_en}</h1>
        <p className="text-sm text-muted">
          Status: {temple.status.replace("_", " ")}
          {temple.subscription_valid_until ? ` · Active until ${temple.subscription_valid_until}` : " · No active plan"}
        </p>
      </div>

      {inTrial && (
        <div className="rounded-lg border border-saffron/40 bg-turmeric/15 p-4 text-sm text-[#8a5a00]">
          Free trial: {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left to edit. Choose a plan under{" "}
          <strong>Payments</strong> to keep editing after the trial.
        </div>
      )}

      {locked && (
        <div className="rounded-lg border border-kumkum/30 bg-kumkum/10 p-4 text-sm text-kumkum">
          Editing is locked because this temple has no active subscription. The public page stays visible; choose a plan
          under <strong>Payments</strong> to edit again.
        </div>
      )}

      {/* ---- Core info ---- */}
      <form action={saveTempleAction} className="card space-y-4 p-6">
        <fieldset disabled={locked} className="space-y-4">
          <input type="hidden" name="id" value={temple.id} />
          <h2 className="font-display text-xl text-kumkum">Temple information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name (English) *"><input className="input" name="name_en" defaultValue={temple.name_en} required /></Field>
            <Field label="పేరు (తెలుగు)"><input className="input lang-te" name="name_te" defaultValue={temple.name_te ?? ""} /></Field>
          </div>

          <Field label="Primary deity">
            <select className="input" name="primary_deity_id" defaultValue={temple.primary_deity_id ?? ""}>
              <option value="">—</option>
              {deities.map((d) => (
                <option key={d.id} value={d.id}>{d.label_en}{d.label_te ? ` / ${d.label_te}` : ""}</option>
              ))}
            </select>
          </Field>

          <Field label="Significance (optional — select one or more)">
            <select className="input h-28" name="significance_ids" multiple defaultValue={sigIds}>
              {significances.map((sgf) => (
                <option key={sgf.id} value={sgf.id}>{sgf.label_en}{sgf.label_te ? ` / ${sgf.label_te}` : ""}</option>
              ))}
            </select>
          </Field>

          <Field label="Other (secondary) deities — Ctrl/Cmd-click to select multiple">
            <select className="input h-32" name="secondary_deity_ids" multiple defaultValue={secIds}>
              {deities.map((d) => (
                <option key={d.id} value={d.id}>{d.label_en}{d.label_te ? ` / ${d.label_te}` : ""}</option>
              ))}
            </select>
          </Field>

          <Field label="Categories">
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="category_ids" value={c.id} defaultChecked={catIds.includes(c.id)} />
                  {c.label_en}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Facilities">
            <div className="flex flex-wrap gap-3">
              {facilities.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="facility_ids" value={f.id} defaultChecked={facIds.includes(f.id)} />
                  {f.label_en}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Description (English)"><textarea className="input" name="description_en" defaultValue={temple.description_en ?? ""} /></Field>
            <Field label="వివరణ (తెలుగు)"><textarea className="input lang-te" name="description_te" defaultValue={temple.description_te ?? ""} /></Field>
          </div>

          <h3 className="pt-2 font-medium text-saffron">Address & location</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address (English)"><input className="input" name="address_line_en" defaultValue={temple.address_line_en ?? ""} /></Field>
            <Field label="చిరునామా (తెలుగు)"><input className="input lang-te" name="address_line_te" defaultValue={temple.address_line_te ?? ""} /></Field>
            <Field label="City"><input className="input" name="city" defaultValue={temple.city ?? ""} /></Field>
            <DistrictAreaPicker areas={areas} defaultDistrict={temple.district} defaultAreaId={temple.area_id} />
            <Field label="State">
              <select className="input" name="state" defaultValue={temple.state}>
                <option>Telangana</option><option>Andhra Pradesh</option>
              </select>
            </Field>
            <Field label="Pincode"><input className="input" name="pincode" defaultValue={temple.pincode ?? ""} /></Field>
            <LocationPicker
              defaultLat={temple.latitude ? Number(temple.latitude) : null}
              defaultLng={temple.longitude ? Number(temple.longitude) : null}
            />
          </div>

          <h3 className="pt-2 font-medium text-saffron">Contact & media</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="General phone"><input className="input" name="contact_phone" defaultValue={temple.contact_phone ?? ""} /></Field>
            <Field label="Email"><input className="input" name="contact_email" defaultValue={temple.contact_email ?? ""} /></Field>
            <ImageUpload name="primary_photo_url" label="Primary photo" defaultUrl={temple.primary_photo_url} />
          </div>

          <ContactsEditor
            initial={contacts.map((c) => ({ label_en: c.label_en, person_name: c.person_name, phone: c.phone }))}
          />

          <h3 className="pt-2 font-medium text-saffron">Donations (temple’s own UPI — display only)</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="UPI ID (VPA)"><input className="input" name="donation_upi_vpa" defaultValue={temple.donation_upi_vpa ?? ""} placeholder="temple@upi" /></Field>
            <Field label="Payee name"><input className="input" name="donation_upi_name" defaultValue={temple.donation_upi_name ?? ""} /></Field>
            <ImageUpload name="donation_qr_url" label="Donation QR image (optional)" defaultUrl={temple.donation_qr_url} />
          </div>

          {user.role === "super_admin" && (
            <>
              <h3 className="pt-2 font-medium text-saffron">Assigned temple admins</h3>
              {tAdmins.length === 0 ? (
                <p className="text-sm text-muted">No temple-admin accounts yet. Create one on the Users page, or approve a manager&apos;s request.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tAdmins.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="temple_admin_ids" value={a.id} defaultChecked={adminIds.includes(a.id)} />
                      {a.full_name} <span className="text-muted">({a.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          <button className="btn-primary" disabled={locked}>Save changes</button>
        </fieldset>
      </form>

      {/* ---- Temple admins (managers propose; super admin approves) ---- */}
      {user.role !== "temple_admin" && (
        <section className="card space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold text-kumkum">Temple admins</h2>
          <p className="text-sm text-muted">
            Add a person to manage this temple. Their account is created once the Super Admin approves the request.
          </p>

          {adminRequests.length > 0 && (
            <ul className="divide-y divide-ink/5 text-sm">
              {adminRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span>{r.full_name} <span className="text-muted">({r.email})</span></span>
                  <span className="rounded px-2 py-0.5 text-xs capitalize bg-sandal text-muted">{r.status}</span>
                </li>
              ))}
            </ul>
          )}

          <form action={proposeTempleAdminAction} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input type="hidden" name="temple_id" value={temple.id} />
            <input className="input" name="full_name" placeholder="Full name" required />
            <input className="input" name="email" type="email" placeholder="Email" required />
            <input className="input" name="phone" placeholder="Phone (optional)" />
            <button className="btn-saffron sm:col-span-3">Propose temple admin</button>
          </form>
        </section>
      )}

      {user.role === "super_admin" && (
        <section className="card space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold text-kumkum">Record offline / manual payment</h2>
          <p className="text-sm text-muted">
            Use this when a temple pays by cash, cheque, bank transfer or direct UPI — or to grant complimentary access.
            It extends validity exactly like an online payment (renewals stack).{" "}
            {temple.subscription_valid_until ? `Currently active until ${temple.subscription_valid_until}.` : "No active plan yet."}
          </p>
          <form action={recordOfflinePaymentAction} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="hidden" name="temple_id" value={temple.id} />
            <select className="input" name="plan_id" required defaultValue="">
              <option value="" disabled>Select duration (plan)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_en} — {p.duration_months} month(s), ₹{Number(p.amount_inr).toFixed(0)}
                </option>
              ))}
            </select>
            <select className="input" name="method" required defaultValue="Cash">
              <option>Cash</option>
              <option>Cheque</option>
              <option>Bank transfer</option>
              <option>UPI</option>
              <option>Complimentary</option>
              <option>Other</option>
            </select>
            <input className="input" name="amount" type="number" min="0" step="1" placeholder="Amount ₹ (blank = plan price; 0 for complimentary)" />
            <input className="input" name="paid_at" type="date" />
            <button className="btn-primary sm:col-span-2">Record payment &amp; extend validity</button>
          </form>
        </section>
      )}

      {/* ---- Timings ---- */}
      <section className="card p-6">
        <h2 className="mb-3 font-display text-xl text-kumkum">Timings</h2>
        {timings.length > 0 && (
          <ul className="mb-4 divide-y divide-ink/5 text-sm">
            {timings.map((tm) => (
              <li key={tm.id} className="flex items-center justify-between py-2">
                <span>{DAYS[tm.day_of_week]} — {tm.open_time}–{tm.close_time}{tm.session_label_en ? ` (${tm.session_label_en})` : ""}</span>
                <form action={deleteTimingAction}>
                  <input type="hidden" name="id" value={tm.id} />
                  <input type="hidden" name="temple_id" value={temple.id} />
                  <button className="text-kumkum hover:underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addTimingAction} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <input type="hidden" name="temple_id" value={temple.id} />
          <select className="input" name="day_of_week">{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>
          <input className="input" name="session_order" type="number" min={1} defaultValue={1} title="Session order" />
          <input className="input" name="session_label_en" placeholder="Morning" />
          <input className="input" name="open_time" type="time" required />
          <input className="input" name="close_time" type="time" required />
          <button className="btn-saffron">Add</button>
        </form>
      </section>

      {/* ---- Events ---- */}
      <section className="card p-6">
        <h2 className="mb-3 font-display text-xl text-kumkum">Events</h2>
        <p className="mb-3 text-sm text-muted">Events appear on the public page only when marked visible.</p>
        {events.length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between rounded border border-ink/5 px-3 py-2">
                <span>{ev.title_en} {ev.is_public ? <em className="text-green-700">· visible</em> : <em className="text-muted">· hidden</em>}</span>
                <span className="flex gap-3">
                  <form action={toggleEventPublicAction}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="temple_id" value={temple.id} /><button className="text-saffron hover:underline">{ev.is_public ? "Hide" : "Show"}</button></form>
                  <form action={deleteEventAction}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="temple_id" value={temple.id} /><button className="text-kumkum hover:underline">Delete</button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
        <form action={addEventAction} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="hidden" name="temple_id" value={temple.id} />
          <input className="input" name="title_en" placeholder="Title (English) *" required />
          <input className="input lang-te" name="title_te" placeholder="శీర్షిక (తెలుగు)" />
          <input className="input" name="starts_at" type="datetime-local" />
          <input className="input" name="description_en" placeholder="Description (English)" />
          <input className="input lang-te" name="description_te" placeholder="వివరణ (తెలుగు)" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" /> Visible to public</label>
          <button className="btn-saffron sm:col-span-2">Add event</button>
        </form>
      </section>

      {/* ---- Videos ---- */}
      <section className="card p-6">
        <h2 className="mb-3 font-display text-xl text-kumkum">Videos</h2>
        <p className="mb-3 text-sm text-muted">Videos appear on the public page only when marked visible.</p>
        {videos.length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {videos.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded border border-ink/5 px-3 py-2">
                <span>{v.title_en} {v.is_public ? <em className="text-green-700">· visible</em> : <em className="text-muted">· hidden</em>}</span>
                <span className="flex gap-3">
                  <form action={toggleVideoPublicAction}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="temple_id" value={temple.id} /><button className="text-saffron hover:underline">{v.is_public ? "Hide" : "Show"}</button></form>
                  <form action={deleteVideoAction}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="temple_id" value={temple.id} /><button className="text-kumkum hover:underline">Delete</button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
        <form action={addVideoAction} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="hidden" name="temple_id" value={temple.id} />
          <input className="input" name="title_en" placeholder="Title (English) *" required />
          <input className="input lang-te" name="title_te" placeholder="శీర్షిక (తెలుగు)" />
          <input className="input sm:col-span-2" name="video_url" placeholder="https://youtube.com/watch?v=…" required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" /> Visible to public</label>
          <button className="btn-saffron sm:col-span-2">Add video</button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
