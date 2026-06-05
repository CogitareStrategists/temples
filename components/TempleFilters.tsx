"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { t, pick, type Lang } from "@/lib/i18n";
import type { DeityRow, SignificanceRow, FacilityRow } from "@/lib/types";

export function TempleFilters({
  lang,
  deities,
  significances,
  facilities,
  districts,
}: {
  lang: Lang;
  deities: DeityRow[];
  significances: SignificanceRow[];
  facilities: FacilityRow[];
  districts: string[];
}) {
  const tr = t(lang);
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    sp.delete("browse"); // a home "View all" hint; not a real filter
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/temples?${sp.toString()}`);
  }

  return (
    <div className="card mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search });
        }}
        className="sm:col-span-2 lg:col-span-3"
      >
        <input className="input" placeholder={tr.search} value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      <select className="input" defaultValue={params.get("deity") ?? ""} onChange={(e) => apply({ deity: e.target.value })}>
        <option value="">{tr.primaryDeity} — {tr.allCategories}</option>
        {deities.map((d) => (
          <option key={d.id} value={d.id}>{pick(lang, d.label_en, d.label_te)}</option>
        ))}
      </select>

      <select className="input" defaultValue={params.get("district") ?? ""} onChange={(e) => apply({ district: e.target.value })}>
        <option value="">{tr.allDistricts}</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select className="input" defaultValue={params.get("significance") ?? ""} onChange={(e) => apply({ significance: e.target.value })}>
        <option value="">{tr.bySignificance}</option>
        {significances.map((s) => (
          <option key={s.id} value={s.slug}>{pick(lang, s.label_en, s.label_te)}</option>
        ))}
      </select>

      <select className="input" defaultValue={params.get("facility") ?? ""} onChange={(e) => apply({ facility: e.target.value })}>
        <option value="">{tr.byFacilities}</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.slug}>{pick(lang, f.label_en, f.label_te)}</option>
        ))}
      </select>

      <button className="btn-primary" onClick={() => apply({ q: search })}>{tr.search}</button>
    </div>
  );
}
