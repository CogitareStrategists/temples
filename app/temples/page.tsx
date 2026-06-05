import { cookies } from "next/headers";
import { t, type Lang } from "@/lib/i18n";
import { listPublishedTemples, listDistricts } from "@/lib/queries/temples";
import { listDeities, listSignificances, listFacilities } from "@/lib/queries/lists";
import { TempleFilters } from "@/components/TempleFilters";
import { TempleCardItem } from "@/components/TempleCardItem";

export const dynamic = "force-dynamic";

export default async function TemplesPage({
  searchParams,
}: {
  searchParams: { q?: string; district?: string; deity?: string; significance?: string; facility?: string };
}) {
  const lang = (cookies().get("lang")?.value as Lang) ?? "en";
  const tr = t(lang);
  const [temples, deities, significances, facilities, districts] = await Promise.all([
    listPublishedTemples({
      search: searchParams.q,
      district: searchParams.district,
      deityId: searchParams.deity,
      significanceSlug: searchParams.significance,
      facilitySlug: searchParams.facility,
    }),
    listDeities(),
    listSignificances(),
    listFacilities(),
    listDistricts(),
  ]);

  return (
    <div className="container-page py-8">
      <h1 className={`mb-4 font-display text-3xl font-semibold text-kumkum ${lang === "te" ? "lang-te" : ""}`}>
        {tr.temples}
      </h1>
      <TempleFilters lang={lang} deities={deities} significances={significances} facilities={facilities} districts={districts} />
      {temples.length === 0 ? (
        <p className="text-muted">{tr.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {temples.map((temple) => (
            <TempleCardItem key={temple.id} temple={temple} lang={lang} highlight="deity" />
          ))}
        </div>
      )}
    </div>
  );
}
