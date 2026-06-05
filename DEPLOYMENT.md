# Deployment guide

This deploys the temple portal to **Vercel** (app) + **Neon** (Postgres), with
**Razorpay** for plan payments and **Vercel Blob** for image uploads.

The recommended path is a **protected staging deploy first** (for the content
team to test and load content), then a public launch once the live‑only
features are verified and real content is in.

---

## 0. What you need
- A **GitHub** account (to host the code so Vercel auto‑deploys).
- A **Vercel** account.
- A **Neon** Postgres project (you already have one).
- A **Razorpay** account — start in **Test mode**.
- Node 18+ locally (only to run migrations / bootstrap once).

---

## 1. Put the code on GitHub
Instead of merging zips, push the project to a GitHub repo. From the project folder:

```bash
git init
git add .
git commit -m "Temple portal"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.next`, `.env`, `.env.local`.

---

## 2. Create the Vercel project
1. Vercel → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto‑detected). Leave build settings default.
3. Don't deploy yet — set environment variables first (next step).

---

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)
Add these for **Production** (and **Preview** if you want preview deploys to work).
Do **not** wrap values in quotes.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`), `?sslmode=require`. |
| `NEXTAUTH_URL` | Your deployed URL, e.g. `https://your-app.vercel.app`. Must match the real domain. |
| `NEXTAUTH_SECRET` | Generate fresh: `openssl rand -base64 32`. Use a new one for production. |
| `RAZORPAY_KEY_ID` | Razorpay **test** key id for now (`rzp_test_…`). |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` (used in the browser). |
| `RAZORPAY_WEBHOOK_SECRET` | A long random string; must equal the secret you set on the webhook (step 6). |
| `BLOB_READ_WRITE_TOKEN` | Auto‑added when you connect a Vercel Blob store to the project. |
| `BOOTSTRAP_SUPERADMIN_EMAIL` | First super‑admin login (used once, step 5). |
| `BOOTSTRAP_SUPERADMIN_PASSWORD` | First super‑admin password (change after first login). |
| `BOOTSTRAP_SUPERADMIN_NAME` | Display name for the first super admin. |

Connect Blob: Vercel → Project → **Storage → Connect/Create Blob store**, with
"Add read‑write token env var" checked (creates `BLOB_READ_WRITE_TOKEN`). Enable
it for Development too if you want `vercel env pull` to work locally.

---

## 4. Set up the production database (run once)
Run these locally, pointed at the **production** Neon database. Pull the prod env
or paste the prod `DATABASE_URL` inline:

```bash
npm install
DATABASE_URL="<prod-neon-url>" npm run migrate              # creates all tables (0001–0009)
DATABASE_URL="<prod-neon-url>" \
  BOOTSTRAP_SUPERADMIN_EMAIL=you@org.in \
  BOOTSTRAP_SUPERADMIN_PASSWORD='a-strong-password' \
  BOOTSTRAP_SUPERADMIN_NAME='Your Name' \
  npm run bootstrap:superadmin                              # creates the first super admin
```

> A fresh database has the 3 plans, 15 deities, and 5 facilities seeded, and **no**
> super admin until you run bootstrap.

(Optional, staging only) load demo content so the team sees populated pages:

```bash
DATABASE_URL="<prod-neon-url>" npm run seed:sample
```

---

## 5. Deploy
Trigger the first deploy (push to `main`, or Vercel → **Deploy**). After it
finishes, open the site and sign in at `/login` with the bootstrap super admin.

---

## 6. Configure the Razorpay webhook
So subscriptions activate even if a payer's browser drops after paying:
1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://your-app.vercel.app/api/razorpay/webhook`
3. Secret: the exact value of `RAZORPAY_WEBHOOK_SECRET`.
4. Active events: **`payment.captured`** (and `order.paid` if you like).
5. Save. (Online payments work via the browser path even before this; the
   webhook is the safety net.)

---

## 7. Smoke test on the live site (do these first — they can't be tested offline)
- [ ] Sign in as super admin.
- [ ] Create a temple, set its location on the **map** (search + click + drag).
- [ ] Upload a **temple photo** and a **deity image** (Vercel Blob).
- [ ] Approve & publish the temple; confirm it shows on the public site.
- [ ] **Razorpay test payment** on the Payments page (test UPI `success@razorpay`,
      or card `4111 1111 1111 1111`, any future expiry/CVV); confirm "Active until" updates.
- [ ] Confirm the public temple page renders (map, timings, events share, video thumbnails, donation QR).
- [ ] Language toggle EN ⇄ తెలుగు.

---

## 8. Protect staging while the content team works
Pick one so the half‑populated site isn't public/indexed:
- **Vercel → Settings → Deployment Protection → Password Protection** (simplest), or
- keep the domain unannounced and add a `noindex` until launch.

Then create the content team's accounts (Users page) as **managers** or
**temple admins** and hand over. Note: temple admins get a **7‑day editing grace**
per temple; for older temples the super admin can grant time via **Record offline /
manual payment → Complimentary**.

---

## 9. Before public launch
- [ ] Review the demo temples. They're useful **reference** for the content team, so
      there's no need to delete them. But before the site is public, make sure none
      stay **published** with their placeholder fields — the sample **donation UPI**
      (`donations@sampleupi`) is a non‑existent payee and the **contact numbers** are
      fake. For each demo temple either edit those fields to real values, or remove it
      (individually, or bulk‑remove all 10: `DATABASE_URL="<prod>" npm run unseed:sample`).
      Note: there is no "hide/unpublish without deleting" toggle yet — a published
      temple stays public until edited or removed.
- [ ] Replace any placeholder donation UPIs and sample video URLs with real ones (on whatever temples you keep).
- [ ] Switch Razorpay to **Live** keys (`rzp_live_…`) in env, and update the webhook to the live endpoint/secret.
- [ ] Regenerate `NEXTAUTH_SECRET` if you used a placeholder.
- [ ] Turn off Deployment Protection (or remove `noindex`).
- [ ] Point your real domain at the Vercel project and update `NEXTAUTH_URL` to it.
- [ ] Confirm Neon backups/branching is on for the production branch.

---

## Notes / known gaps
- **No "forgot password" email** yet — recovery is the super admin resetting a
  password on the Users page (manual relay to the user).
- Razorpay/Blob/maps are coded to current APIs but were not testable in the build
  sandbox — step 7 is where they get their first real run.
- Donations on temple pages are **display‑only** (the temple's own UPI QR); no
  money flows through the platform for those.
