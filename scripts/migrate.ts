/**
 * Applies db/migrations/*.sql in filename order, exactly once each.
 * Usage: npm run migrate   (reads DATABASE_URL from .env / .env.local)
 * Uses node-postgres (simple query protocol) so dollar-quoted functions
 * and multi-statement files run as a single batch.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); // Next.js convention
config();                        // .env fallback
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )`);

  const dir = join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const done = await client.query("select 1 from schema_migrations where filename = $1", [file]);
    if (done.rowCount) {
      console.log(`= skip ${file}`);
      continue;
    }
    const sqlText = readFileSync(join(dir, file), "utf8");
    console.log(`+ apply ${file}`);
    try {
      await client.query("begin");
      await client.query(sqlText);
      await client.query("insert into schema_migrations(filename) values ($1)", [file]);
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      console.error(`  failed: ${file}`);
      throw err;
    }
  }
  await client.end();
  console.log("migrations complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
