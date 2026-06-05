# Devalayam — Temple Information Portal (Telangana & Andhra Pradesh)

A bilingual (English + Telugu) temple portal built with **Next.js (App Router) + TypeScript**,
**Neon Postgres** (raw parameterized SQL, no ORM), **Auth.js (NextAuth)** for role-based access,
**Leaflet + OpenStreetMap** for maps, and **Razorpay** for subscription plan payments. Deploys on **Vercel**.

## Roles

- **Public viewers** — browse temples by category, search/filter, view a temple page (deities, photo, map,
  timings, categories, donation QR, address, contact, and any events/videos the temple chose to make public).
- **Temple Admin** — log in, edit their temple’s information, manage timings/events/videos, and pay for a plan.
  Editing locks when the subscription lapses (the public page stays visible).
- **Temple Manager** — add new temples, view/edit any temple, suggest new deities/categories/field changes,
  and see payment status per temple.
- **Super Admin** — create users, approve new temples, review suggestions, and do everything above.

## Stack & key decisions

- **No ORM.** Queries are parameterized tagged templates via `@neondatabase/serverless` (`lib/db.ts`).
  Migrations are plain `.sql` files in `db/migrations/`, applied by `scripts/migrate.ts` (uses `pg`).
- **Auth.js / NextAuth v4**, credentials provider, **JWT sessions** (no DB session tables). No public signup —
  the Super Admin provisions users; the first one is created by `scripts/bootstrap-superadmin.ts`.
- **Approval gates** — new temples are `pending_approval` until a Super Admin approves them. After approval,
  Temple Admin edits go live immediately (no re-approval).
- **Versioning** — `temple_versions` stores immutable JSONB snapshots of core temple info. The original approved
  baseline and the latest approved baseline are each flagged uniquely per temple and are restorable.
- **Bilingual** — paired `*_en` / `*_te` columns; English required, Telugu optional with English fallback.
  Language toggle (cookie `lang`) in the header.
- **Subscriptions** — ₹150/month, ₹600/6 months, ₹1000/year. Features are identical across plans; the plan is just
  paid duration. Renewals stack onto remaining validity. Payments use Razorpay with **server-side HMAC-SHA256
  signature verification** (`app/api/razorpay/verify`). Public **donations are display-only** (the temple’s own UPI
  QR — no money flows through the platform).
- **Maps** — Leaflet with free OpenStreetMap tiles; “Get directions” opens OSM.

## Local setup

```bash
npm install
cp .env.example .env.local      # fill in the values

# Database (use a Neon dev branch connection string in DATABASE_URL)
npm run migrate                 # applies db/migrations/*.sql in order
npm run bootstrap:superadmin    # creates the first Super Admin from env vars

npm run dev                     # http://localhost:3000
```

> **Neon dev workflow:** create a dev *branch* of your Neon database and point `DATABASE_URL` at it for local work,
> so you never test against production data. Promote/migrate the main branch when ready.

### Environment variables (`.env.local`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (`?sslmode=require`) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth.js — secret via `openssl rand -base64 32` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | server-side Razorpay keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | client-side key id for Checkout |
| `BOOTSTRAP_SUPERADMIN_*` | first Super Admin (used once) |

### Razorpay test mode

UPI `success@razorpay` / `failure@razorpay`; card `4111 1111 1111 1111` (any future expiry/CVV). Run one full
test purchase before switching to live keys.

## Deploy (Vercel)

1. Push to a private GitHub repo.
2. Import into Vercel; add all env vars (Production + Preview).
3. Run `npm run migrate` and `npm run bootstrap:superadmin` against the production Neon DB once.

## Project layout

```
db/migrations/        0001_init.sql (schema), 0002_seed.sql (plans, categories, deities)
scripts/              migrate.ts, bootstrap-superadmin.ts
lib/                  db, types, auth, i18n, razorpay, password, slug
lib/queries/          temples, lists, users, subscriptions, suggestions, temple-admin
app/                  public pages (home, /temples, /temple/[slug]), /login
app/(dashboard)/      role-gated dashboard + server actions
app/api/              auth + razorpay (order, verify)
components/           Header, Footer, LanguageToggle, maps, QR, pay button, etc.
```

## Honest status / next steps

This is a complete, coherent scaffold covering all four roles and the main flows end-to-end. Deliberately left as
fast-follows:

- **Photo/QR uploads** are URL fields for now (wire up Vercel Blob / S3 for direct uploads).
- **Temple-scoped suggestions and `field_modification`** are recorded and reviewable; only global *deity* adds are
  auto-applied on approval — extend `approveSuggestion` to apply category adds and field edits.
- **Version restore UI** — snapshots are written and flagged; a “restore this backup” button on the temple page is
  the natural next addition (the data and partial-unique guards are already in place).
- **Telugu input** relies on the user’s keyboard (e.g. Gboard Telugu); no transliteration helper yet.
- Tests and a webhook fallback for Razorpay are not included.
