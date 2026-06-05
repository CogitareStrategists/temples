import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "production") {
  // Allow `next build` without a DB; queries throw at call time if unset.
  // eslint-disable-next-line no-console
  console.warn("[db] DATABASE_URL is not set");
}

// `sql` is a tagged-template function: sql`select * from t where id = ${id}`
// Parameters are sent separately, so this is safe against SQL injection.
export const sql = neon(url ?? "postgresql://invalid:invalid@localhost/invalid");

/**
 * Run a query and return typed rows.
 *   const rows = await query<TempleRow>`select * from temples where slug = ${slug}`;
 */
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<T[]> {
  const tagged = sql as unknown as (
    s: TemplateStringsArray,
    ...p: unknown[]
  ) => Promise<unknown[]>;
  const rows = (await tagged(strings, ...params)) as T[];
  return rows;
}

/** Return the first row or null. */
export async function queryOne<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<T | null> {
  const rows = await query<T>(strings, ...params);
  return rows[0] ?? null;
}
