# Bold Vision CRM

A CRM application for real estate agents — manage properties, customers, interest tracking, follow-ups, and automated messaging.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Vue 3 + Vite | UI and routing |
| UI Library | Vuetify 3 | Component system and design |
| State | Pinia | Store management |
| Backend | Supabase | Postgres + Auth + Storage + Edge Functions |
| Deployment | GitHub Actions → Vercel | CI/CD |

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/Sakada-lim/CRM-Project.git
cd CRM-Project/Bold_Vision_CRM
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_key_here
```

Find these in your Supabase dashboard → Project Settings → API Keys.

### 3. Run the database migration

In the Supabase dashboard, go to **SQL Editor → New query**, paste the contents of `supabase/migrations/0001_init.sql`, and click **Run**.

This creates the `properties`, `customers`, and `property_photos` tables, sets up RLS policies, and creates the Storage buckets.

### 4. Create your agent account

In the Supabase dashboard → **Authentication → Users → Add user → Create new user**.  
Use your real email and set "Auto Confirm User" checked.

### 5. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173`, sign in with the credentials you created in step 4.

---

## Development phases

| Phase | What ships |
|---|---|
| 1 (current) | Supabase backend + Auth + Properties & Customers CRUD |
| 2 | Property photo & floorplan uploads via Storage |
| 3 | Customer↔Property interest tracking (M:N, Hot/Warm/Cold) |
| 4 | Follow-up dashboard + Home rewrite |
| 5 | Broadcast messaging UI + provider interface |
| 6 | Telegram live integration + auto-broadcast on new listing |
| 7 | Realtime sync + CI/CD + production hardening |

---

## Project structure

```
CRM-Project/
├── Bold_Vision_CRM/          # Vue 3 SPA
│   ├── src/
│   │   ├── assets/styles/    # Global CSS + design tokens
│   │   ├── components/       # Reusable UI components
│   │   │   ├── base/         # BaseDialog, BaseFilterBar, etc.
│   │   │   ├── customer/
│   │   │   └── properties/
│   │   ├── composables/      # Filter, pagination, responsive logic
│   │   ├── constants/        # Shared enums, property defaults
│   │   ├── router/           # Vue Router + auth guard
│   │   ├── services/         # Supabase data access layer
│   │   ├── stores/           # Pinia stores
│   │   ├── utils/            # Property helpers, follow-up logic
│   │   └── views/            # Page-level components
│   ├── .env.example
│   └── vite.config.js
└── supabase/
    └── migrations/           # SQL migration files
```

---

## Secrets (never commit these)

| Secret | Where it lives |
|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (gitignored) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` (gitignored) |
| `TELEGRAM_BOT_TOKEN` | Supabase Secrets (Phase 6) |
| `SUPABASE_ACCESS_TOKEN` | GitHub Actions secrets (Phase 7) |
