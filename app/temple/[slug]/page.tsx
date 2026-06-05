import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { t, pick, type Lang } from "@/lib/i18n";
import { getTempleBySlug } from "@/lib/queries/temples";
import { MapSection } from "@/components/MapSection";
import { DonationQR } from "@/components/DonationQR";
import { ShareEvent } from "@/components/ShareEvent";
import { videoThumb } from "@/lib/video";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lang = (cookies().get("lang")?.value as Lang) ?? "en";
  const temple = await getTempleBySlug(params.slug);
  if (!temple || temple.status !== "published") return { title: "Temple" };
  const name = pick(lang, temple.name_en, temple.name_te);
  const desc =
    pick(lang, temple.description_en, temple.description_te) ||
    [pick(lang, temple.primary_deity_en, temple.primary_deity_te), temple.district].filter(Boolean).join(" • ");
  const images = temple.primary_photo_url ? [temple.primary_photo_url] : undefined;
  return {
    title: name,
    description: desc || undefined,
    openGraph: { title: name, description: desc || undefined, images, type: "website" },
    twitter: { card: images ? "summary_large_image" : "summary", title: name, description: desc || undefined, images },
  };
}

function fmt(time: string): string {
  // "09:30:00" -> "9:30 AM"
  const [h, m] = time.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${ap}`;
}

export default async function TemplePage({ params }: { params: { slug: string } }) {
  const lang = (cookies().get("lang")?.value as Lang) ?? "en";
  const tr = t(lang);
  const temple = await getTempleBySlug(params.slug);
  if (!temple || temple.status !== "published") notFound();

  const name = pick(lang, temple.name_en, temple.name_te);
  const lat = temple.latitude ? Number(temple.latitude) : null;
  const lng = temple.longitude ? Number(temple.longitude) : null;
  const teClass = lang === "te" ? "lang-te" : "";

  // group timings by day
  const byDay = new Map<number, typeof temple.timings>();
  for (const row of temple.timings) {
    if (!byDay.has(row.day_of_week)) byDay.set(row.day_of_week, []);
    byDay.get(row.day_of_week)!.push(row);
  }

  return (
    <div className="container-page py-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card">
        <div className="aspect-[16/7] w-full bg-sandal">
          {temple.primary_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={temple.primary_photo_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center font-display text-6xl text-kumkum/25">ॐ</div>
          )}
        </div>
        <div className="p-6">
          <h1 className={`font-display text-3xl font-bold text-kumkum ${teClass}`}>{name}</h1>
          {temple.primary_deity_en && (
            <p className={`mt-1 text-lg text-saffron ${teClass}`}>
              {tr.primaryDeity}: {pick(lang, temple.primary_deity_en, temple.primary_deity_te)}
            </p>
          )}
          {temple.secondary_deities.length > 0 && (
            <p className={`mt-1 text-sm text-muted ${teClass}`}>
              {tr.secondaryDeities}:{" "}
              {temple.secondary_deities.map((d) => pick(lang, d.label_en, d.label_te)).join(", ")}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {temple.categories.map((c) => (
              <span key={c.id} className={`rounded-full bg-sandal px-3 py-1 text-xs text-ink ${teClass}`}>
                {pick(lang, c.label_en, c.label_te)}
              </span>
            ))}
            {temple.significances.map((sg, i) => (
              <span key={i} className={`rounded-full bg-turmeric/25 px-3 py-1 text-xs text-[#8a5a00] ${teClass}`}>
                {pick(lang, sg.label_en, sg.label_te)}
              </span>
            ))}
            {temple.facilities.map((f, i) => (
              <span key={`f${i}`} className={`rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70 ${teClass}`}>
                ✓ {pick(lang, f.label_en, f.label_te)}
              </span>
            ))}
          </div>
          {pick(lang, temple.description_en, temple.description_te) && (
            <p className={`mt-4 text-ink/90 ${teClass}`}>{pick(lang, temple.description_en, temple.description_te)}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: timings, events, videos */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timings */}
          <section className="card p-5">
            <h2 className={`mb-3 font-display text-xl font-semibold text-kumkum ${teClass}`}>{tr.timings}</h2>
            {temple.timings.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {tr.days.map((dayLabel, dow) => {
                  const rows = byDay.get(dow);
                  if (!rows) return null;
                  return (
                    <li key={dow} className="flex items-center justify-between py-2 text-sm">
                      <span className={`font-medium ${teClass}`}>{dayLabel}</span>
                      <span className="text-right text-ink/80">
                        {rows.map((r) => `${fmt(r.open_time)} – ${fmt(r.close_time)}`).join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {temple.exceptions.length > 0 && (
              <div className="mt-4">
                <h3 className={`mb-2 text-sm font-semibold text-saffron ${teClass}`}>{tr.timingExceptions}</h3>
                <ul className="space-y-1 text-sm text-ink/80">
                  {temple.exceptions.map((ex) => (
                    <li key={ex.id} className={teClass}>
                      <span className="font-medium">{pick(lang, ex.title_en, ex.title_te)}</span>
                      {ex.exception_date ? ` · ${ex.exception_date}` : ""}
                      {ex.is_closed
                        ? ` · ${tr.closed}`
                        : ex.special_open_time && ex.special_close_time
                          ? ` · ${fmt(ex.special_open_time)} – ${fmt(ex.special_close_time)}`
                          : ""}
                      {pick(lang, ex.note_en, ex.note_te) ? ` — ${pick(lang, ex.note_en, ex.note_te)}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Events (only if present & public) */}
          {temple.events.length > 0 && (
            <section className="card p-5">
              <h2 className={`mb-3 font-display text-xl font-semibold text-kumkum ${teClass}`}>{tr.events}</h2>
              <ul className="space-y-3">
                {temple.events.map((ev) => (
                  <li key={ev.id} id={`event-${ev.id}`} className="scroll-mt-24 rounded-lg border border-ink/5 p-3">
                    <p className={`font-medium ${teClass}`}>{pick(lang, ev.title_en, ev.title_te)}</p>
                    {ev.starts_at && <p className="text-xs text-muted">{new Date(ev.starts_at).toLocaleString()}</p>}
                    {pick(lang, ev.description_en, ev.description_te) && (
                      <p className={`mt-1 text-sm text-ink/80 ${teClass}`}>
                        {pick(lang, ev.description_en, ev.description_te)}
                      </p>
                    )}
                    <ShareEvent
                      eventId={ev.id}
                      title={pick(lang, ev.title_en, ev.title_te)}
                      templeName={name}
                      dateText={ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : undefined}
                      lang={lang}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Videos (only if present & public) */}
          {temple.videos.length > 0 && (
            <section className="card p-5">
              <h2 className={`mb-3 font-display text-xl font-semibold text-kumkum ${teClass}`}>{tr.videos}</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {temple.videos.map((v) => {
                  const thumb = videoThumb(v.video_url, v.thumbnail_url);
                  return (
                    <li key={v.id}>
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="card group block overflow-hidden"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-sandal">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={pick(lang, v.title_en, v.title_te)}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full place-items-center bg-gradient-to-br from-kumkum/10 to-saffron/10 font-display text-3xl text-kumkum/30">
                              ▶
                            </div>
                          )}
                          <span className="absolute inset-0 grid place-items-center">
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white shadow-lg transition group-hover:bg-kumkum">
                              ▶
                            </span>
                          </span>
                        </div>
                        <div className={`p-2 text-sm font-medium text-ink ${teClass}`}>
                          {pick(lang, v.title_en, v.title_te)}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Right: map, address, contact, donation */}
        <aside className="space-y-6">
          {lat !== null && lng !== null && (
            <section className="card p-3">
              <MapSection lat={lat} lng={lng} name={name} />
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost mt-3 w-full"
              >
                {tr.getDirections}
              </a>
            </section>
          )}

          <section className="card p-5">
            <h2 className={`mb-2 font-display text-lg font-semibold text-kumkum ${teClass}`}>{tr.address}</h2>
            <p className={`text-sm text-ink/85 ${teClass}`}>
              {pick(lang, temple.address_line_en, temple.address_line_te)}
              {pick(lang, temple.area_en, temple.area_te) ? `, ${pick(lang, temple.area_en, temple.area_te)}` : ""}
              {temple.city ? `, ${temple.city}` : ""}
              {temple.district ? `, ${temple.district}` : ""}
              {temple.pincode ? ` - ${temple.pincode}` : ""}
              <br />
              {temple.state}
            </p>
            {(temple.contact_phone || temple.contact_email || temple.contact_list.length > 0) && (
              <div className="mt-3 text-sm">
                <h3 className="font-semibold text-saffron">{tr.contact}</h3>
                {temple.contact_list.map((c) => (
                  <div key={c.id} className="mt-1">
                    <span className={`text-muted ${teClass}`}>{pick(lang, c.label_en, c.label_te)}</span>
                    {c.person_name && <span className="text-ink/85"> · {c.person_name}</span>}
                    <a href={`tel:${c.phone}`} className="block text-ink/85">
                      {c.phone}
                    </a>
                  </div>
                ))}
                {temple.contact_phone && (
                  <a href={`tel:${temple.contact_phone}`} className="mt-1 block text-ink/85">
                    {temple.contact_phone}
                  </a>
                )}
                {temple.contact_email && (
                  <a href={`mailto:${temple.contact_email}`} className="block text-ink/85">
                    {temple.contact_email}
                  </a>
                )}
              </div>
            )}
          </section>

          {(temple.donation_upi_vpa || temple.donation_qr_url) && (
            <section className="card p-5">
              <h2 className={`mb-3 font-display text-lg font-semibold text-kumkum ${teClass}`}>{tr.donate}</h2>
              <DonationQR
                vpa={temple.donation_upi_vpa}
                payeeName={temple.donation_upi_name ?? temple.name_en}
                imageUrl={temple.donation_qr_url}
                label={tr.scanToDonate}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
