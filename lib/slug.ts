export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Ensure uniqueness by appending a short random suffix when needed. */
export function withSuffix(slug: string): string {
  const s = Math.random().toString(36).slice(2, 6);
  return `${slug}-${s}`;
}
