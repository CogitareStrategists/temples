"use client";
import dynamic from "next/dynamic";

// Leaflet needs `window`, so load the map only on the client.
const TempleMap = dynamic(() => import("@/components/TempleMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading map…</div>,
});

export function MapSection({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-ink/10">
      <TempleMap lat={lat} lng={lng} name={name} />
    </div>
  );
}
