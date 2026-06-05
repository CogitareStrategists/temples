"use client";
import { useState } from "react";
import { TELANGANA_DISTRICTS, ANDHRA_PRADESH_DISTRICTS } from "@/lib/districts";
import type { AreaRow } from "@/lib/types";

export function DistrictAreaPicker({
  areas,
  defaultDistrict,
  defaultAreaId,
}: {
  areas: AreaRow[];
  defaultDistrict?: string | null;
  defaultAreaId?: string | null;
}) {
  const [district, setDistrict] = useState(defaultDistrict ?? "");
  const [areaId, setAreaId] = useState(defaultAreaId ?? "");
  const areasForDistrict = areas.filter((a) => a.district === district);

  return (
    <>
      <div>
        <label className="label">Location — district</label>
        <select
          className="input"
          name="district"
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setAreaId(""); // reset area when district changes
          }}
        >
          <option value="">—</option>
          <optgroup label="Telangana">
            {TELANGANA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </optgroup>
          <optgroup label="Andhra Pradesh">
            {ANDHRA_PRADESH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </optgroup>
        </select>
      </div>
      <div>
        <label className="label">Location — area</label>
        <select
          className="input"
          name="area_id"
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          disabled={!district}
        >
          <option value="">{district ? "—" : "Select a district first"}</option>
          {areasForDistrict.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name_en}{a.name_te ? ` / ${a.name_te}` : ""}
            </option>
          ))}
        </select>
        {district && areasForDistrict.length === 0 && (
          <p className="mt-1 text-xs text-muted">No areas yet for {district}. A Super Admin can add them, or suggest one.</p>
        )}
      </div>
    </>
  );
}
