/**
 * Inserts ~10 sample published temples so the home page and listing show
 * real-looking data. Idempotent (keyed on slug) — safe to run more than once.
 * Usage: npm run seed:sample
 *
 * Sample/approximate data for demo purposes (deity/district mappings are
 * indicative). Photos are intentionally left blank.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

type Sample = {
  slug: string;
  name_en: string;
  name_te: string;
  deity: string; // matches a deities.label_en
  significances: string[]; // significances.slug
  facilities: string[]; // facilities.slug
  district: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  desc: string;
  featured?: boolean;
};

const TEMPLES: Sample[] = [
  {
    slug: "yadagirigutta-lakshmi-narasimha", name_en: "Yadagirigutta Lakshmi Narasimha Swamy",
    name_te: "యాదగిరిగుట్ట లక్ష్మీ నరసింహ స్వామి", deity: "Vishnu", significances: ["swayambhu"],
    facilities: ["parking", "drinking-water", "accommodation", "restaurants-nearby"],
    district: "Yadadri Bhuvanagiri", state: "Telangana", city: "Yadagirigutta", lat: 17.579, lng: 78.948,
    desc: "Hill shrine of Lakshmi Narasimha Swamy, a major pilgrimage centre in Telangana.", featured: true,
  },
  {
    slug: "bhadrachalam-sita-ramachandra", name_en: "Bhadrachalam Sri Sita Ramachandra Swamy",
    name_te: "భద్రాచలం శ్రీ సీతా రామచంద్ర స్వామి", deity: "Rama", significances: [],
    facilities: ["parking", "drinking-water", "accommodation"],
    district: "Bhadradri Kothagudem", state: "Telangana", city: "Bhadrachalam", lat: 17.6688, lng: 80.8936,
    desc: "Famous temple of Lord Rama on the banks of the Godavari.", featured: true,
  },
  {
    slug: "vemulawada-raja-rajeswara", name_en: "Vemulawada Sri Raja Rajeswara Swamy",
    name_te: "వేములవాడ శ్రీ రాజ రాజేశ్వర స్వామి", deity: "Shiva", significances: [],
    facilities: ["parking", "drinking-water", "gosaala"],
    district: "Rajanna Sircilla", state: "Telangana", city: "Vemulawada", lat: 18.4646, lng: 78.866,
    desc: "Ancient Shiva temple, popularly called Dakshina Kashi.", featured: true,
  },
  {
    slug: "basara-gnana-saraswati", name_en: "Basara Sri Gnana Saraswati",
    name_te: "బాసర శ్రీ జ్ఞాన సరస్వతి", deity: "Saraswati", significances: [],
    facilities: ["parking", "drinking-water"],
    district: "Nirmal", state: "Telangana", city: "Basara", lat: 18.879, lng: 77.958,
    desc: "One of the few temples dedicated to Goddess Saraswati, on the Godavari.", featured: true,
  },
  {
    slug: "srisailam-mallikarjuna", name_en: "Srisailam Mallikarjuna Swamy",
    name_te: "శ్రీశైలం మల్లికార్జున స్వామి", deity: "Shiva", significances: ["jyotirlinga", "shakti-peetha"],
    facilities: ["parking", "drinking-water", "accommodation", "restaurants-nearby", "gosaala"],
    district: "Nandyal", state: "Andhra Pradesh", city: "Srisailam", lat: 16.0733, lng: 78.8682,
    desc: "Jyotirlinga and Shakti Peetha on the Nallamala hills.", featured: true,
  },
  {
    slug: "tirumala-venkateswara", name_en: "Tirumala Sri Venkateswara Swamy",
    name_te: "తిరుమల శ్రీ వేంకటేశ్వర స్వామి", deity: "Venkateswara", significances: ["divya-desam"],
    facilities: ["parking", "drinking-water", "accommodation", "restaurants-nearby"],
    district: "Tirupati", state: "Andhra Pradesh", city: "Tirumala", lat: 13.6839, lng: 79.347,
    desc: "One of the most visited temples in the world, atop the Tirumala hills.", featured: true,
  },
  {
    slug: "vijayawada-kanaka-durga", name_en: "Vijayawada Kanaka Durga",
    name_te: "విజయవాడ కనక దుర్గ", deity: "Durga", significances: ["ashtadasha-shakti"],
    facilities: ["parking", "drinking-water", "restaurants-nearby"],
    district: "NTR", state: "Andhra Pradesh", city: "Vijayawada", lat: 16.5167, lng: 80.6116,
    desc: "Hilltop temple of Goddess Kanaka Durga on Indrakeeladri.",
  },
  {
    slug: "simhachalam-varaha-narasimha", name_en: "Simhachalam Varaha Lakshmi Narasimha",
    name_te: "సింహాచలం వరాహ లక్ష్మీ నరసింహ", deity: "Vishnu", significances: [],
    facilities: ["parking", "drinking-water"],
    district: "Visakhapatnam", state: "Andhra Pradesh", city: "Simhachalam", lat: 17.766, lng: 83.251,
    desc: "Ancient hill temple near Visakhapatnam.",
  },
  {
    slug: "chilkur-balaji", name_en: "Chilkur Balaji Temple",
    name_te: "చిల్కూర్ బాలాజీ", deity: "Venkateswara", significances: [],
    facilities: ["parking", "drinking-water"],
    district: "Rangareddy", state: "Telangana", city: "Chilkur", lat: 17.349, lng: 78.303,
    desc: "Known as the Visa Balaji temple, near Hyderabad.",
  },
  {
    slug: "karmanghat-hanuman", name_en: "Karmanghat Hanuman Temple",
    name_te: "కర్మన్‌ఘాట్ హనుమాన్ ఆలయం", deity: "Hanuman", significances: [],
    facilities: ["parking", "gosaala"],
    district: "Hyderabad", state: "Telangana", city: "Hyderabad", lat: 17.349, lng: 78.536,
    desc: "Historic Hanuman temple in Hyderabad.",
  },
];

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: url!.includes("localhost") ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  const admin = await client.query("select id from users where role = 'super_admin' order by created_at limit 1");
  const adminId: string | null = admin.rows[0]?.id ?? null;

  let inserted = 0;
  let order = 1;
  const SESSIONS = [
    { order: 1, en: "Morning Darshan", te: "ఉదయం దర్శనం", open: "06:00", close: "13:00" },
    { order: 2, en: "Evening Darshan", te: "సాయంత్రం దర్శనం", open: "16:00", close: "20:30" },
  ];
  const phone = (n: number) => `+91 90000 ${String(10000 + n).slice(-5)}`;
  const FESTIVAL: Record<string, { en: string; te: string; desc: string }> = {
    Shiva: { en: "Maha Shivaratri", te: "మహా శివరాత్రి", desc: "Night-long prayers and special abhishekam to Lord Shiva." },
    Vishnu: { en: "Narasimha Jayanti", te: "నరసింహ జయంతి", desc: "Celebration of Lord Narasimha with special pujas." },
    Rama: { en: "Sri Rama Navami", te: "శ్రీ రామ నవమి", desc: "Sita Rama Kalyanam and grand processions." },
    Saraswati: { en: "Vasant Panchami", te: "వసంత పంచమి", desc: "Aksharabhyasam and special worship of Goddess Saraswati." },
    Venkateswara: { en: "Annual Brahmotsavam", te: "వార్షిక బ్రహ్మోత్సవం", desc: "Nine-day festival with daily vahana sevas." },
    Durga: { en: "Dasara Navaratri", te: "దసరా నవరాత్రి", desc: "Nine nights of Devi worship and alankarams." },
    Hanuman: { en: "Hanuman Jayanti", te: "హనుమాన్ జయంతి", desc: "Celebration of Lord Hanuman with special pujas." },
  };
  // Real YouTube videos per temple so thumbnails render (two each).
  const VIDEO_IDS: Record<string, [string, string]> = {
    "yadagirigutta-lakshmi-narasimha": ["RxnAnx1Hwhk", "AUkn-cINenA"],
    "bhadrachalam-sita-ramachandra": ["706icuNERnM", "cTS0PRIFv6Q"],
    "vemulawada-raja-rajeswara": ["v9J0efMZ34Q", "V-9MNip8ZO0"],
    "basara-gnana-saraswati": ["ksP7ahLZXNg", "F_Mx1V7Msac"],
    "srisailam-mallikarjuna": ["Tm09e6f_b00", "yMVeWWfcTSI"],
    "tirumala-venkateswara": ["Brv9gRYyJCA", "LV-8IxAdUVk"],
    "vijayawada-kanaka-durga": ["ph6S_47PgjY", "T4rTOEMMY_U"],
    "simhachalam-varaha-narasimha": ["cGeqKY3rOas", "UZC8tgUCFJo"],
    "chilkur-balaji": ["OU6u9KawH2c", "16K6LMSnWec"],
    "karmanghat-hanuman": ["mnfbbqlEFHg", "9tbM11EANgI"],
  };
  const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
  for (const [ti, t] of TEMPLES.entries()) {
    const deity = await client.query("select id from deities where lower(label_en) = lower($1) limit 1", [t.deity]);
    const deityId: string | null = deity.rows[0]?.id ?? null;

    const ins = await client.query(
      `insert into temples
         (slug, name_en, name_te, primary_deity_id, district, state, city, latitude, longitude,
          description_en, status, created_by, approved_by, approved_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11,$11, now())
       on conflict (slug) do nothing
       returning id`,
      [t.slug, t.name_en, t.name_te, deityId, t.district, t.state, t.city, t.lat, t.lng, t.desc, adminId]
    );

    let templeId: string;
    if (ins.rows[0]?.id) {
      templeId = ins.rows[0].id;
      inserted++;
    } else {
      const ex = await client.query("select id from temples where slug = $1", [t.slug]);
      templeId = ex.rows[0].id;
    }

    for (const slug of t.significances) {
      await client.query(
        `insert into temple_significances (temple_id, significance_id)
         select $1, id from significances where slug = $2 on conflict do nothing`,
        [templeId, slug]
      );
    }
    for (const slug of t.facilities) {
      await client.query(
        `insert into temple_facilities (temple_id, facility_id)
         select $1, id from facilities where slug = $2 on conflict do nothing`,
        [templeId, slug]
      );
    }

    // Timings — morning & evening darshan for all 7 days (idempotent)
    for (let dow = 0; dow < 7; dow++) {
      for (const ses of SESSIONS) {
        await client.query(
          `insert into temple_timings
             (temple_id, day_of_week, session_order, session_label_en, session_label_te, open_time, close_time)
           values ($1,$2,$3,$4,$5,$6,$7)
           on conflict (temple_id, day_of_week, session_order) do nothing`,
          [templeId, dow, ses.order, ses.en, ses.te, ses.open, ses.close]
        );
      }
    }

    // Contacts — only if none yet (don't clobber manual edits / no duplicates)
    const hasContacts = await client.query("select 1 from temple_contacts where temple_id = $1 limit 1", [templeId]);
    if (hasContacts.rowCount === 0) {
      const contacts = [
        { label: "Temple Office", phone: phone(ti * 3 + 1) },
        { label: "Dharmakarta", phone: phone(ti * 3 + 2) },
        { label: "Chief Priest", phone: phone(ti * 3 + 3) },
      ];
      let o = 0;
      for (const c of contacts) {
        await client.query(
          `insert into temple_contacts (temple_id, label_en, phone, sort_order) values ($1,$2,$3,$4)`,
          [templeId, c.label, c.phone, o++]
        );
      }
    }

    // Donation — placeholder UPI so the donations block is visible (only if unset)
    await client.query(
      `update temples
         set donation_upi_vpa  = coalesce(donation_upi_vpa, $2),
             donation_upi_name = coalesce(donation_upi_name, $3)
       where id = $1`,
      [templeId, "donations@sampleupi", t.name_en]
    );

    // Events — a deity-appropriate festival + a monthly pooja (public; idempotent)
    const hasEvents = await client.query("select 1 from temple_events where temple_id = $1 limit 1", [templeId]);
    if (hasEvents.rowCount === 0) {
      const f = FESTIVAL[t.deity] ?? {
        en: "Annual Brahmotsavam", te: "వార్షిక బ్రహ్మోత్సవం", desc: "Annual temple festival with special sevas.",
      };
      const ev = [
        { en: f.en, te: f.te, desc: f.desc, days: (ti + 1) * 15 },
        { en: "Monthly Pournami Pooja", te: "మాసిక పౌర్ణమి పూజ", desc: "Special pooja on the full-moon day.", days: (ti + 1) * 15 + 30 },
      ];
      for (const e of ev) {
        await client.query(
          `insert into temple_events (temple_id, title_en, title_te, description_en, starts_at, is_public, created_by)
           values ($1,$2,$3,$4, now() + ($5 || ' days')::interval, true, $6)`,
          [templeId, e.en, e.te, e.desc, String(e.days), adminId]
        );
      }
    }

    // Videos — real YouTube URLs (refreshed each run so they pick up real thumbnails)
    await client.query("delete from temple_videos where temple_id = $1", [templeId]);
    const ids = VIDEO_IDS[t.slug] ?? [];
    const vtitles = [
      { en: "Temple Tour & Darshan", te: "దేవాలయ దర్శనం" },
      { en: "History & Significance", te: "చరిత్ర & ప్రాముఖ్యత" },
    ];
    let vo = 0;
    for (let k = 0; k < ids.length; k++) {
      await client.query(
        `insert into temple_videos (temple_id, title_en, title_te, video_url, sort_order, is_public, created_by)
         values ($1,$2,$3,$4,$5,true,$6)`,
        [templeId, vtitles[k].en, vtitles[k].te, watch(ids[k]), vo++, adminId]
      );
    }

    if (t.featured) {
      await client.query(
        `insert into home_featured (section, temple_id, sort_order, created_by)
         values ('featured', $1, $2, $3) on conflict (section, temple_id) do nothing`,
        [templeId, order++, adminId]
      );
    }
  }

  await client.end();
  console.log(`Sample data done — ${inserted} new temple(s) inserted (${TEMPLES.length - inserted} already existed).`);
  console.log("Added darshan timings, sample contacts, events and videos to each.");
  console.log("Donation UPI is a PLACEHOLDER (donations@sampleupi) — replace with the real UPI before going live.");
  console.log("All are published; a few are featured on the home page. Add deity images via Dashboard → Deities.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
