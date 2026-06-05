import Link from "next/link";
import { pick, type Lang } from "@/lib/i18n";
import type { Facet } from "@/lib/queries/home";

// A browse row for one dimension. If any facet has an image (deities),
// renders image tiles; otherwise renders compact text+count pills.
export function BrowseTiles({
  title,
  facets,
  paramName,
  lang,
  emptyText,
  imageMode = false,
}: {
  title: string;
  facets: Facet[];
  paramName: "deity" | "district" | "significance" | "facility";
  lang: Lang;
  emptyText: string;
  imageMode?: boolean;
}) {
  const teClass = lang === "te" ? "lang-te" : "";

  return (
    <section className="mb-10">
      <h2 className={`mb-4 font-display text-2xl font-semibold text-kumkum ${teClass}`}>{title}</h2>

      {facets.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : imageMode ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {facets.map((f) => (
            <Link
              key={f.value}
              href={`/temples?${paramName}=${encodeURIComponent(f.value)}`}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-ink/10 bg-sandal shadow-card transition group-hover:ring-2 group-hover:ring-saffron/50">
                {f.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.image_url} alt={pick(lang, f.label_en, f.label_te)} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-2xl text-kumkum/30">ॐ</span>
                )}
              </span>
              <span className={`text-sm font-medium text-ink ${teClass}`}>{pick(lang, f.label_en, f.label_te)}</span>
              <span className="-mt-1 text-xs text-muted">{f.count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {facets.map((f) => (
            <Link
              key={f.value}
              href={`/temples?${paramName}=${encodeURIComponent(f.value)}`}
              className="group inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2 text-sm transition hover:border-saffron hover:bg-white"
            >
              <span className={`font-medium text-ink ${teClass}`}>{pick(lang, f.label_en, f.label_te)}</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sandal px-1.5 text-xs text-muted group-hover:bg-turmeric/30">
                {f.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
