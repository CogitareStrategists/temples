import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Server-side geocoding proxy to OpenStreetMap Nominatim (free, no key).
// Done server-side so we can send a proper User-Agent per Nominatim policy
// and keep usage light. Biased to India; logged-in users only.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const q = new URL(req.url).searchParams.get("q");
  if (!q || !q.trim()) return NextResponse.json([], { status: 400 });

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DevalayamTemplePortal/1.0 (temple information portal)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return NextResponse.json([], { status: 502 });
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return NextResponse.json(data.map((d) => ({ lat: d.lat, lon: d.lon, display_name: d.display_name })));
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
