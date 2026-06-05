/**
 * Creates the first Super Admin from env vars. Run ONCE after migrating.
 * Usage: npm run bootstrap:superadmin
 * Reads BOOTSTRAP_SUPERADMIN_EMAIL / _PASSWORD / _NAME.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); // Next.js convention
config();                        // .env fallback
import { Client } from "pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL;
const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_SUPERADMIN_NAME ?? "Super Admin";

if (!url || !email || !password) {
  console.error("Set DATABASE_URL, BOOTSTRAP_SUPERADMIN_EMAIL and BOOTSTRAP_SUPERADMIN_PASSWORD");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password!, 10);
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(
    `insert into users (email, password_hash, full_name, role, status)
     values ($1, $2, $3, 'super_admin', 'active')
     on conflict (email) do nothing
     returning id`,
    [email!.toLowerCase(), hash, name]
  );
  await client.end();
  if (res.rowCount) console.log(`Super Admin created: ${email}`);
  else console.log(`User already exists: ${email} (no change)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
