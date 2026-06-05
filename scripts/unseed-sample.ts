/**
 * Removes the 10 demo temples added by `npm run seed:sample` (and, via ON DELETE
 * CASCADE, all their timings/events/videos/contacts/facilities/significances/
 * admins/featured rows/payments). Only touches those known sample slugs — your
 * real content is untouched. Idempotent. Usage: npm run unseed:sample
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { Client } from "pg";

const SLUGS = [
  "yadagirigutta-lakshmi-narasimha",
  "bhadrachalam-sita-ramachandra",
  "vemulawada-raja-rajeswara",
  "basara-gnana-saraswati",
  "srisailam-mallikarjuna",
  "tirumala-venkateswara",
  "vijayawada-kanaka-durga",
  "simhachalam-varaha-narasimha",
  "chilkur-balaji",
  "karmanghat-hanuman",
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: url!.includes("localhost") ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  const res = await client.query("delete from temples where slug = any($1::text[])", [SLUGS]);
  await client.end();
  console.log(`Removed ${res.rowCount} sample temple(s) (and all their related rows).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
