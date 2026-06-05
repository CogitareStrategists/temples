import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import type { TempleCard } from "@/lib/queries/temples";
import { TempleCardItem } from "@/components/TempleCardItem";

type Highlight = "deity" | "location" | "significance" | "facility";

export function HomeSection({
  title,
  temples,
  lang,
  highlight,
  emptyText,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  temples: TempleCard[];
  lang: Lang;
  highlight: Highlight;
  emptyText: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className={`font-display text-2xl font-semibold text-kumkum ${lang === "te" ? "lang-te" : ""}`}>{title}</h2>
        <Link href={viewAllHref} className={`shrink-0 text-sm font-medium text-saffron hover:underline ${lang === "te" ? "lang-te" : ""}`}>
          {viewAllLabel} →
        </Link>
      </div>
      {temples.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {temples.map((tpl) => (
            <div key={tpl.id} className="w-64 shrink-0 snap-start lg:w-auto">
              <TempleCardItem temple={tpl} lang={lang} highlight={highlight} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
