# Phase 10 — V1 Company Migration (Migration Day)

> **Status as of writing (2026-05-19):** Phase 9 complete. V1 proven on personal Vercel + personal Supabase. Real Telegram broadcast went end-to-end. Ready for company migration.

**Goal:** put V1 onto company-owned infrastructure at `https://crm.boldvision.com.au` with zero ties to personal accounts. After this, personal Vercel + personal Supabase become disposable.

**Total time:** ~2 focused hours of active work + DNS propagation wait + ~1 week observation before decommission.

**Total recurring cost:** ~$70–78 AUD/month (see breakdown below).

**Block out one quiet afternoon.** Don't squeeze between meetings — distractions cause copy-paste errors with API keys.

---

## Cost summary

### Recurring (monthly)

| Item | USD | AUD (~) | Notes |
|---|---|---|---|
| Supabase Pro (1 project) | $25 | ~$39 | 8GB DB, 100GB storage, 250GB bandwidth, daily backups, 7-day PITR. Usage over limits is metered separately. |
| Vercel Pro (1 seat) | $20 | ~$31 | Per seat. Hobby is non-commercial per TOS — must upgrade. |
| Workspace user (Business Starter) | — | $8.40 | Per added user. Skip if repurposing existing user. |
| **Subtotal — with new Workspace user** | $45 USD + $8.40 AUD | **~$78/mo AUD** | |
| **Subtotal — repurposing existing user** | $45 USD | **~$70/mo AUD** | |

### One-time

| Item | AUD (~) | Notes |
|---|---|---|
| YubiKey 5 NFC (optional) | $80 | Hardware 2FA for root identity. TOTP via Authenticator app is acceptable substitute. |
| Domain | $0 | Already own `boldvision.com.au`. |
| Data migration (boss's Word/PDF docs) | $15–30 in LLM API | Separate effort, after V1 is live. |

**FX caveat:** USD→AUD shown at ~1.55. Bank typically adds 2–3% FX margin. Negligible at this scale.

### Workspace user — repurpose vs new

**Recommendation: create new `it@boldvision.com.au`.** Reasons:

1. **Audit cleanliness** — the identity owning Supabase + Vercel + GitHub + Telegram bot should have zero history of being someone else.
2. **Old data baggage** — renaming a Workspace user keeps their Gmail, Drive, Calendar attached.
3. **Alias confusion (30–90 days)** — renamed account keeps old email as forwarding alias by default.
4. **Cost is small** vs the full stack ($8.40/mo is ~11% of total).

**Counter: if dormant accounts exist, delete them while you're in admin.** Each suspended/deleted user saves $8.40/mo. Check with boss first — sometimes "dormant" accounts get used quarterly for specific things (Xero, contracts).

---

## Pre-flight (do this BEFORE migration day, ~30 min)

These 3 things have no time pressure. Doing them in advance means migration day is just "click through the list."

- [ ] **Set up a password manager folder called "Bold Vision IT"** — 1Password, Bitwarden, or Apple Keychain all work. Every credential, token, and bot ID created during migration goes here. **Never paste these in chat with Claude.**
- [ ] **Decide on Workspace email** — recommended: `it@boldvision.com.au`.
- [ ] **Decide on GitHub org name** — recommended: `BoldVision`. Could be `bold-vision-properties` if taken. Doesn't affect URLs (Vercel domain is what users see).
- [ ] **(Optional but recommended)** Order a YubiKey 5 NFC (~$80 AUD) for hardware 2FA on the Workspace root account.

---

## Migration day — Phases A–I in order

---

### Phase A — Create Workspace user (15 min)

**Why:** All production SaaS gets owned by a dedicated company identity. If you ever hand the CRM to an IT intern or leave the business, that identity transfers cleanly. **Guard like the master key.**

**Your job:**

1. Sign in to https://admin.google.com as existing Workspace super-admin
2. **Directory → Users → Add new user**
3. Username: `it@boldvision.com.au`
4. Set a random 20+ char password (1Password "Generate" → save under "Bold Vision IT")
5. Recovery email: your personal Gmail
6. After creation, sign out of admin, sign in once as the new `it@` user to confirm credentials work
7. **Enable 2FA** for the `it@` account:
   - TOTP via Authenticator app (acceptable)
   - **Hardware key via YubiKey** (recommended — register under **Account → Security → 2-Step Verification → Add security key**)

**Save to password manager:**
- `it@boldvision.com.au` password
- Recovery codes (Google gives 10 backup codes — save all)

**You're done when:** you can sign in to admin.google.com as `it@boldvision.com.au` and pass 2FA.

**Cost:** +$8.40 AUD/mo (extra Workspace user).

---

### Phase B — Create company GitHub org (10 min)

**Why:** CRM source lives here. Separate from personal `Sakada-lim/CRM-Project`. Personal repo stays as local archive.

**Your job:**

1. Open a fresh browser session (different from personal GitHub login — incognito works)
2. Go to https://github.com/signup
3. Sign up with **email = `it@boldvision.com.au`** (verify via Workspace inbox)
4. Username: e.g. `boldvision-it`
5. **Enable 2FA on the new GitHub user** — Settings → Password & authentication → Two-factor authentication → YubiKey or Authenticator app
6. Top-right `+` icon → **New organization**
7. Pick **Free plan** (upgrade to Team later if needed)
8. Org name: **`BoldVision`** (or `bold-vision-properties` if taken — tell Claude which)
9. Billing email: `it@boldvision.com.au`
10. Skip "invite members" — single owner for now
11. **Org Settings → Authentication security → Require 2FA for everyone in the organization**

**Don't create the repo yet — Phase C does that as part of the squash push.**

**Save to password manager:**
- GitHub username + password
- 2FA recovery codes

**You're done when:** the org exists at `github.com/BoldVision` and you're the sole owner.

---

### Phase C — Squash V1 + push to company repo (15 min — Claude does most)

**Why:** Personal repo has 30+ commits across 8 phases. Company repo should start clean with a single `v1.0` commit. Personal repo stays as audit archive.

**Together — Claude runs commands, you watch:**

Claude will:

1. **Secrets scan** on personal repo — make sure no production tokens leaked into git history. If anything sensitive shows up, rewrite history before pushing.
2. **Create an orphan `v1-release` branch** off current `main`
3. **Squash everything** into one commit: `v1.0 — Bold Vision CRM initial release`
4. **Add the company repo as a new remote** (`company`)
5. **Push** the orphan branch to `BoldVision/crm:main`

**Your job — after the push:**

1. Open `github.com/BoldVision/crm`
2. Verify the commit lands as the only commit on `main`
3. **Settings → Branches → Add branch protection rule** for `main`:
   - ✅ Require pull request before merging
   - ✅ Require at least 1 approval
   - ✅ Dismiss stale approvals on push
   - ❌ Disallow force pushes
4. Confirm `main` is default branch

**Don't push personal repo anywhere new** — keep as local archive.

**You're done when:** `github.com/BoldVision/crm` has exactly 1 commit on a protected `main` branch.

---

### Phase D — New Supabase project + migrations (30 min)

**Why:** Personal Supabase is Free-tier (no daily backups, no PITR). Production needs Pro for safety.

**Your job:**

1. Open https://supabase.com → sign up with `it@boldvision.com.au` (or sign in if account exists)
2. **New organization** "Bold Vision" → **Pro plan** → add credit card (Stripe checkout)
3. **New project:**
   - Name: `bold-vision-crm-prod`
   - Region: **Sydney (ap-southeast-2)** ← critical for AU latency
   - DB password: generate 20+ chars in password manager
4. Wait ~2 minutes for provisioning
5. **Settings to verify:**
   - **Database → Tables → Settings → "Automatically expose new tables"** → **OFF**
   - **Authentication → Providers → Email** → enable email/password
6. **Authentication → URL Configuration:**
   - Site URL: `https://crm.boldvision.com.au`
   - Redirect URLs: add both `https://crm.boldvision.com.au` AND the eventual Vercel preview URL (get in Phase G; come back here then)
7. **Authentication → Attack Protection → Prevent use of leaked passwords → ON** (Pro-only — was deferred on personal account)
8. **SQL Editor → New query** → apply migrations in order **0001 through 0017** (17 files in `supabase/migrations/`). Paste each separately, click **Run**, wait for "Success" before next. Don't bulk-paste — error in any one is harder to diagnose.
9. **Storage → New bucket:**
   - `property-photos` — Public OFF, file size limit 10 MB, MIME `image/jpeg,image/png,image/webp`
   - `property-floorplans` — same settings
   - `property-brochures` — Public OFF, file size limit 25 MB, MIME `application/pdf`
10. **Settings → API** → record (needed in Phases F + G):
    - **Project URL:** `https://<new-project-ref>.supabase.co`
    - **anon public key** (`eyJ...` JWT — safe to expose, goes in client bundle)
    - **service_role secret key** (`eyJ...` — server-only, **NEVER paste in chat**)

**Save to password manager:**
- DB password
- service_role key (separately labeled — never confuse with anon)

**You're done when:** all 17 migrations applied + 3 storage buckets exist + auth settings configured.

**Cost:** +$38 AUD/mo (Pro plan).

---

### Phase E — New Telegram bot (10 min)

**Why:** Personal bot becomes dev/test. Production gets fresh identity so customers see "@BoldVisionPropertiesBot" not personal one.

**Your job:**

1. Open Telegram → message **@BotFather**
2. `/newbot`
3. Display name: **"Bold Vision Properties"**
4. Username: **`BoldVisionPropertiesBot`** (must end in `bot`; pick another suffix if taken — e.g. `BoldVisionRealEstateBot`)
5. BotFather replies with the token — **copy to password manager only**, do not paste in chat
6. `/setdescription` → "Property updates from Bold Vision Properties"
7. `/setabouttext` → short bio
8. `/setuserpic` → upload Bold Vision logo
9. `/setjoingroups` → **Disable** (broadcast model is DM-only)
10. Generate a 64-char webhook secret. On Windows PowerShell run:
    ```powershell
    -join (1..32 | %{ '{0:x2}' -f (Get-Random -Max 256) })
    ```
    Save to password manager.

**Save to password manager:**
- Bot token
- Webhook secret

**You're done when:** you can find `@BoldVisionPropertiesBot` in Telegram search and `/start` it (won't reply yet — webhook isn't registered).

---

### Phase F — Deploy edge functions to new Supabase (20 min)

**Why:** New Supabase needs the edge functions to send broadcasts + receive webhooks.

**Your job (with Claude coaching through each):**

1. **Supabase Dashboard (new project) → Edge Functions → Create new function** named exactly **`send-telegram`**. Paste contents of `supabase/functions/send-telegram/index.ts` from the repo. Click Deploy.
2. **Repeat for `telegram-webhook`** — paste `supabase/functions/telegram-webhook/index.ts`. Deploy.
3. **Project Settings → Edge Functions → Secrets** → add three rows (don't paste these values in chat — get from password manager):
   - `TELEGRAM_BOT_TOKEN` = new bot token from Phase E
   - `TELEGRAM_WEBHOOK_SECRET` = new webhook secret from Phase E
   - `ALLOWED_ORIGINS` = `https://crm.boldvision.com.au` (add Vercel URL after Phase G)
4. **Edge Functions → `send-telegram` → Settings → Verify JWT → ON**
5. **Edge Functions → `telegram-webhook` → Settings → Verify JWT → OFF** (Telegram doesn't send JWTs; secret-token header authenticates)
6. **Register the webhook** — one-line curl from Git Bash or PowerShell. Replace `NEW_BOT_TOKEN`, `NEW_SUPABASE_REF`, `NEW_WEBHOOK_SECRET` with real values:
   ```bash
   curl -o resp.json -X POST "https://api.telegram.org/botNEW_BOT_TOKEN/setWebhook" -H "Content-Type: application/json" -d '{"url":"https://NEW_SUPABASE_REF.supabase.co/functions/v1/telegram-webhook","secret_token":"NEW_WEBHOOK_SECRET"}'; cat resp.json; echo; rm resp.json
   ```
   Expected: `{"ok":true,"result":true,"description":"Webhook was set"}`

**You're done when:** both functions deployed, secrets configured, webhook returns `"ok":true`.

---

### Phase G — Vercel project (Pro tier) (15 min)

**Why:** Vercel Hobby (current free tier) is non-commercial per TOS. Pro is production tier.

**Your job:**

1. Open https://vercel.com → sign in (or create account) as `it@boldvision.com.au`
2. **Create team "Bold Vision"** → **Pro plan** ($20 USD/seat/month)
3. **Settings → Git → Install GitHub App** → on the `BoldVision` org → grant access to **just the `crm` repo**
4. **Add New → Project → Import** the `crm` repo
5. **Configure exactly as in Phase 9** — except env vars now point at NEW Supabase:
   - Framework: **Vite**
   - Root Directory: **`Bold_Vision_CRM`**
   - Environment Variables (Production + Preview):
     - `VITE_SUPABASE_URL` = new Supabase project URL from Phase D
     - `VITE_SUPABASE_ANON_KEY` = new Supabase anon key from Phase D
6. Deploy. First build ~2 minutes.
7. **Grab the `.vercel.app` URL** (e.g. `crm-bold-vision.vercel.app`) — tell Claude what it is
8. **Open the URL** → verify login screen renders (same smoke test as Phase 9 Step 4)

**Critical follow-up:** go back to **Supabase Phase F step 3** → update `ALLOWED_ORIGINS` to include both `https://crm.boldvision.com.au` AND the `.vercel.app` URL, comma-separated:
```
https://crm.boldvision.com.au,https://crm-bold-vision.vercel.app
```

**You're done when:** Vercel `.vercel.app` URL loads the app + you can sign up a test user and verify the email lands.

**Cost:** +$30 AUD/mo (Pro plan).

---

### Phase H — Wire DNS for `crm.boldvision.com.au` (10 min + 5–30 min propagation)

**Why:** Customer-facing URL. Until DNS resolves, users hit `.vercel.app`.

**Determine DNS host first.** From Git Bash:
```bash
dig boldvision.com.au NS +short
```
Nameservers reveal where DNS lives:
- `ns-cloud-*.googledomains.com` → Google Cloud DNS (manage in Workspace admin → Domains)
- `dns*.squarespace.com` → Squarespace
- Cloudflare → Cloudflare dashboard

**Your job:**

1. Vercel project → **Settings → Domains → Add** → enter `crm.boldvision.com.au`
2. Vercel shows the target CNAME value (typically `cname.vercel-dns.com`). **Copy exactly.**
3. Open DNS host's control panel
4. Add a **CNAME** record:
   - Name/Host: `crm`
   - Value/Target: `cname.vercel-dns.com` (exact string Vercel gave)
   - TTL: 3600 (default)
5. Save
6. Wait 5–30 min (rarely up to 24h). Refresh Vercel's Domains page — green checkmark appears when DNS resolves.
7. SSL cert auto-provisions via Let's Encrypt within ~1 minute of DNS resolving.
8. Open `https://crm.boldvision.com.au` in a fresh browser → should be the app.

**You're done when:** `https://crm.boldvision.com.au` loads the login page with a valid cert.

---

### Phase I — Production smoke tests (30–45 min)

**Why:** Final gate before declaring done. Anything broken here = block, fix, re-test.

**Run these in order at `https://crm.boldvision.com.au`:**

| # | Test | Pass criteria |
|---|---|---|
| 1 | Sign up the agent account (use real boss email or a dedicated one) | Verification email arrives from new Supabase domain |
| 2 | Sign in | Lands on dashboard |
| 3 | Sign in with `?redirect=https://evil.com` | Ignored; lands on `/` (H14 safeRedirect) |
| 4 | Create a test property (`NDIS SDA Home`, `Under Construction`) | Saves; new badge renders correctly |
| 5 | Create a test customer (with phone number) | Saves; duplicate-detection works |
| 6 | Trigger duplicate-detection by trying to add another customer with same phone | Blocks |
| 7 | Open assessment form on the test customer | N/A toggles work; three-state nav works |
| 8 | Upload a photo to the test property | Photo renders via signed URL |
| 8b | Upload a PDF brochure to the test property | "View" opens it in new tab; "Replace" swaps it; "Delete" removes it |
| 9 | Enroll a Telegram test account via the bot | `/start <token>` in DM → customer's `telegram_chat_id` populates |
| 10 | Send a Telegram broadcast to the test customer | Message arrives on test phone |
| 11 | Delete the test customer (typed `CONFIRM` gate) | Works |
| 12 | Sign out + sign back in | Auth lifecycle clean |
| 13 | Hard-refresh on `/customers/<id>` | Loads directly (SPA rewrite) |
| 14 | Browser DevTools Network tab → check response headers on root | HSTS, CSP, X-Frame-Options DENY all present |
| 15 | Browser DevTools Console → no errors after navigation | Clean |

**Anything that fails → tell Claude. Don't proceed to Phase J with a known issue.**

**You're done when:** all 15 pass.

---

## Phase J — Decommission personal infra (schedule for ~1 week LATER)

**Why the wait:** if anything subtly breaks in the first week (env var typo, edge case in a workflow), the personal stack is your fallback. After a week of clean production = safe to delete.

**One week after Phase I passes:**

1. **Personal Supabase project** → Dashboard → Project Settings → General → **Pause project** (free + reversible). Delete a week after pause if nothing else depends on it.
2. **Personal Vercel project** → Delete (Settings → General → bottom).
3. **Personal GitHub repo** (`Sakada-lim/CRM-Project`) → keep as private archive. **Don't push it anywhere new.** It's the audit-trail of how V1 was built.
4. **Old Telegram bot** → keep. Re-purpose as future dev/test bot when next needed. Re-register webhook at a future dev Supabase.

---

## Critical artifacts at end of P10

By end of migration day, all owned by `it@boldvision.com.au`:

- [ ] Workspace user with 2FA enabled
- [ ] `BoldVision/crm` private repo, branch-protected, 1 commit
- [ ] `bold-vision-crm-prod` Supabase project (Pro, Sydney) with all 16 migrations + 2 buckets + edge fns deployed
- [ ] New Telegram bot `@BoldVisionPropertiesBot` with webhook registered
- [ ] Vercel `crm` project, prod branch `main`, auto-deploys from GitHub
- [ ] `crm.boldvision.com.au` CNAME → Vercel with SSL
- [ ] Password manager folder "Bold Vision IT" populated with every credential

---

## Roles split

| Phase | Your time | Claude's time |
|---|---|---|
| Pre-flight | 30 min | — |
| A (Workspace user) | 15 min | — |
| B (GitHub org) | 10 min | — |
| C (squash + push) | 5 min watching | 15 min running git |
| D (Supabase Pro + migrations) | 30 min | guiding |
| E (Telegram bot) | 10 min | — |
| F (deploy edge fns) | 20 min | guiding |
| G (Vercel + env vars) | 15 min | guiding |
| H (DNS + propagation) | 10 min + wait | — |
| I (smoke tests) | 30–45 min | diagnosing if anything fails |
| J (decommission) | 5 min | — |

**Total active time on migration day: ~2 hours + DNS wait.**

---

## When ready

Reply to Claude with:
- **"go pre-flight"** → Claude waits while you do the 3 prep items. Tell Claude when done.
- **"go migration day"** → if pre-flight is already done, start at Phase A.
- **"questions first"** → ask anything before committing.

Once you start, recommend going A→I in a single sitting. Stopping mid-way and resuming hours later is OK but slightly riskier (you lose context).
