"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const Map = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading map…</div>,
});

export function LocationPicker({
  defaultLat,
  defaultLng,
}: {
  defaultLat?: number | null;
  defaultLng?: number | null;
}) {
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function pick(la: number, lo: number) {
    setLat(la);
    setLng(lo);
  }

  async function runSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (Array.isArray(data) && data.length) {
        pick(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setMsg("No match found — try the place or town name.");
      }
    } catch {
      setMsg("Search failed. You can still click the map to drop a pin.");
    } finally {
      setSearching(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setMsg("Location isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => pick(p.coords.latitude, p.coords.longitude),
      () => setMsg("Couldn't get your current location.")
    );
  }

  return (
    <div className="sm:col-span-2">
      <label className="label">Location on map — search, click the map, or drag the pin</label>
      <div className="mb-2 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search a temple, town or address"
        />
        <button type="button" className="btn-ghost" onClick={runSearch} disabled={searching}>
          {searching ? "…" : "Search"}
        </button>
        <button type="button" className="btn-ghost" onClick={locate}>
          Use my location
        </button>
      </div>
      <div className="h-72 overflow-hidden rounded-xl border border-ink/10">
        <Map lat={lat} lng={lng} onPick={pick} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {lat != null && lng != null ? `Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "No location set yet."}
      </p>
      {msg && <p className="text-xs text-kumkum">{msg}</p>}
      <input type="hidden" name="latitude" value={lat != null ? String(lat) : ""} />
      <input type="hidden" name="longitude" value={lng != null ? String(lng) : ""} />
    </div>
  );
}
