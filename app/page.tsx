import Link from "next/link";
import { cookies } from "next/headers";
import { t, type Lang } from "@/lib/i18n";
import {
  getHomeFeatured,
  getDeityFacets,
  getLocationFacets,
  getSignificanceFacets,
} from "@/lib/queries/home";
import { HomeSection } from "@/components/HomeSection";
import { BrowseTiles } from "@/components/BrowseTiles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lang = (cookies().get("lang")?.value as Lang) ?? "en";
  const tr = t(lang);
  const teClass = lang === "te" ? "lang-te" : "";

  const [featured, deityFacets, locationFacets, significanceFacets] = await Promise.all([
    getHomeFeatured("featured"),
    getDeityFacets(),
    getLocationFacets(),
    getSignificanceFacets(),
  ]);

  return (
    <div>
      {/* Hero with temple image background */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-temple.svg" alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-kumkum/55 via-kumkum/45 to-kumkum/75" />
        <div className="container-page flex flex-col items-center py-20 text-center text-white sm:py-28">
          <p className={`mb-4 text-sm uppercase tracking-[0.25em] text-turmeric ${teClass}`} style={{ textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>
            {tr.dharmaLine}
          </p>
          <h1 className={`font-display text-4xl font-bold sm:text-6xl ${teClass}`} style={{ textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
            {tr.appName}
          </h1>
          <p className={`mt-3 max-w-xl text-white/90 ${teClass}`} style={{ textShadow: "0 1px 8px rgba(0,0,0,.4)" }}>
            {tr.tagline}
          </p>
          <Link href="/temples" className="mt-7 inline-block rounded-lg bg-turmeric px-6 py-2.5 font-medium text-ink shadow-lg">
            {tr.temples}
          </Link>
        </div>
      </section>

      <div className="container-page py-12">
        {/* Curated, visual row of hand-picked temples */}
        <HomeSection
          title={tr.featured}
          temples={featured}
          lang={lang}
          highlight="deity"
          emptyText={tr.comingSoon}
          viewAllHref="/temples"
          viewAllLabel={tr.viewAll}
        />

        {/* Browse-by sections: real values as tiles, each drilling into the listing */}
        <BrowseTiles title={tr.byDeities} facets={deityFacets} paramName="deity" lang={lang} emptyText={tr.comingSoon} imageMode />
        <BrowseTiles title={tr.byLocation} facets={locationFacets} paramName="district" lang={lang} emptyText={tr.comingSoon} />
        <BrowseTiles title={tr.bySignificance} facets={significanceFacets} paramName="significance" lang={lang} emptyText={tr.comingSoon} />
      </div>
    </div>
  );
}
