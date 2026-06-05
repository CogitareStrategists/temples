// Derive a thumbnail for a video. Prefers an explicit thumbnail_url, else
// extracts a YouTube video id and uses YouTube's thumbnail. Returns null when
// no thumbnail can be determined (e.g. a YouTube *search* link) so the UI can
// fall back to a placeholder tile.
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function videoThumb(url: string, thumbnailUrl?: string | null): string | null {
  if (thumbnailUrl) return thumbnailUrl;
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
