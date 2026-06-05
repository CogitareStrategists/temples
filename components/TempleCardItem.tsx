import Link from "next/link";
import { pick, type Lang } from "@/lib/i18n";
import type { TempleCard } from "@/lib/queries/temples";

type Highlight = "deity" | "location" | "significance" | "facility";

export function TempleCardItem({
  temple,
  lang,
  highlight = "deity",
}: {
  temple: TempleCard;
  lang: Lang;
  highlight?: Highlight;
}) {
  const name = pick(lang, temple.name_en, temple.name_te);
  const area = pick(lang, temple.area_en, temple.area_te);
  const place = [area, temple.district].filter(Boolean).join(", ");
  const deity = pick(lang, temple.primary_deity_en, temple.primary_deity_te);
  const significance = (temple.significances ?? []).map((s) => pick(lang, s.label_en, s.label_te)).filter(Boolean).join(", ");
  const facility = (temple.facilities ?? []).map((f) => pick(lang, f.label_en, f.label_te)).filter(Boolean).join(", ");

  const subtitle =
    highlight === "location"
      ? place
      : highlight === "significance"
        ? significance
        : highlight === "facility"
          ? facility
          : deity;

  return (
    <Link href={`/temple/${temple.slug}`} className="card group block overflow-hidden">
      <div className="aspect-[16/10] w-full overflow-hidden bg-sandal">
        {temple.primary_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={temple.primary_photo_url} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center font-display text-3xl text-kumkum/30">ॐ</div>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-display text-lg font-semibold text-ink ${lang === "te" ? "lang-te" : ""}`}>{name}</h3>
        {subtitle && <p className={`text-sm text-saffron ${lang === "te" ? "lang-te" : ""}`}>{subtitle}</p>}
        {highlight !== "location" && place && <p className="mt-1 text-sm text-muted">{place}</p>}
        {highlight === "location" && deity && <p className="mt-1 text-sm text-muted">{deity}</p>}
      </div>
    </Link>
  );
}
