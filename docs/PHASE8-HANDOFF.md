# Phase 8 Handoff — Slices 1, 1b, 2

**Branch:** `Feature/Phase8-InputValidation` (off `main` at `8d04305`) — **not yet merged**
**Commits:**
- `d5f1a93` — Phase 8 Slice 2: edge function security + idempotent broadcasts
- `25af33b` — Phase 8 Slice 1: input validation across forms + assessment N/A flags

**Date:** 2026-05-18
**Full audit:** [`C:\Users\limsa\.claude\plans\crispy-shimmying-valiant.md`](../../Users/limsa/.claude/plans/crispy-shimmying-valiant.md)

---

## What shipped

### Slice 1 — Input validation (defense in depth)

Three layers, every user input is gated by at least one:

| Layer | Where | What it catches |
|---|---|---|
| **Frontend rules** | New `src/utils/validators.js` — pure functions returning `null` or error string | 99% of typos / format errors / range violations before submit |
| **Service-layer guards** | `normalize{Entity}Payload()` helpers throw `ValidationError` | Programmatic bypass, optimistic-update drift, mismatched types |
| **DB constraints** | Migration `supabase/migrations/0012_customer_unique_contacts.sql` (functional UNIQUE indexes on phone + email per agent) | Direct API calls, future regressions |

Covers: AddCustomerDialog (+ duplicate phone/email **hard-block**, duplicate name **soft-warn**), CustomerDetailView basic-info edit, quick-log activity dialog, reschedule dialog, PropertiesForm (incl. `validate()` exposed via `defineExpose` for parent gate), all 7 assessment sections (currency parser hardened, keystroke filters for currency/integer/decimal/date-text), BroadcastPanel (4096-char body cap + counter), FollowUpsView reschedule + mark-followed-up dialogs (strict time, 2-year future cap), PropertyDetailsView photo upload (MIME + size + batch cap).

New shared infrastructure:
- `src/composables/useFeedback.js` + `src/components/base/AppSnackbar.vue` — module-scoped reactive toast, mounted once in `App.vue`. Replaces every per-component v-snackbar.
- `src/components/base/ConfirmDeleteDialog.vue` — typed-`CONFIRM` gate; wired into customer + property delete (new feature).
- `src/utils/inputFilters.js` — `@keydown` filters: currency, integer, decimal, date-text.

Bug fixes along the way:
- Follow-up overdue logic — same-day past-time cards now correctly bucketize as overdue (was rounding to "today"). See `src/utils/followUp.js`.
- Mirrored-field debounce in CustomerAssessmentView bumped 1000→2500ms so agent-clear-then-retype doesn't snap back mid-edit.
- Validation errors during debounced autosave now surface via `notifyFromError` + drop the pending value (was silently swallowing).

### Slice 1b — Assessment N/A flags + three-state completion

Replaces the misleading "touched = complete" nav rendering. New flow:

- **Untouched** → grey numbered circle (default)
- **In-progress** → amber dot (touched but at least one optional field is blank without N/A)
- **Complete** → green check (every required field is filled, every optional field is either filled or explicitly N/A'd)

`computeSectionStatus(sectionKey, assessment)` in `validators.js` is the single source of truth. Per-section completion rules encoded directly in the function.

**N/A flag storage** (additive, no migration):
- Client-split sections (Personal/Employment/Income): `payload.client1.na = { fieldKey: true }`
- Flat sections (Assets/Discovery/Notes): `payload.na = { fieldKey: true }`
- Liabilities only: `payload.naSection: true` (whole-section toggle — "No liabilities to record")

**N/A UI:** new `src/components/assessment/NAButton.vue` pill placed next to every optional field. On activate: clears the value, disables + greys the input, swaps placeholder to "N/A", and counts toward "complete". Liabilities' section toggle hides the row table entirely.

**Print contract** (documented at top of `validateAssessmentSection`, no UI yet):
- `na[field] === true` → render "N/A"
- value present → render value
- blank + no NA flag → render "—" (signals agent left blank without explicit decision)

### Bonus — end-of-session deep-scan fixes

A second-pass Explore agent audited every input across the app for missed validation. Real gaps found + fixed:

- **LoginView** email format rule (`validateEmail` via Vuetify `:rules`). Password length **deliberately not added** — Supabase enforces server-side; client-side stricter would lock out existing users.
- **BaseSearchBar** `maxlength="200"` prop (defaults 200) — covers Customers/Properties/Follow-ups search.
- **Customer + Property interest pickers** `maxlength="200"` on internal search input.
- **FollowUpsView reschedule + mark-followed-up dialogs** — `required` attr on date/time inputs, inline `<p class="field-error">` with reactive `rescheduleErrorMsg` / `markContactedErrorMsg` computed, Confirm button gated on error/empty.

### Slice 2 — Edge function security + idempotent broadcasts (`d5f1a93`)

Telegram-themed hardening. Closes audit items **C1, C2, C4, C10, C11** plus several HIGH/MEDIUM (H2, H3, H4, H15, H25, M1).

| Change | Audit ID | Why |
|---|---|---|
| `verify_jwt = true` on `send-telegram` + JWT-derived ownership check via user-scoped Supabase client | C1 | Anyone with the URL could previously broadcast as anyone. |
| Recipients derived server-side from `audience_filter` instead of trusting client array | C11 | Tampered client could insert wrong-category recipients. |
| `idempotency_key` UUID per dialog session; UNIQUE per agent on `messages` | C10 | Double-clicks / network retries no longer fan out duplicates. |
| `message_recipients (message_id, customer_id)` UNIQUE | C10 | Concurrent invocations collapse cleanly via `ON CONFLICT DO NOTHING`. |
| Partial UNIQUE on `customers.telegram_chat_id` | C4 | Two customers can't bind same chat (was code-side only). |
| `X-Telegram-Bot-Api-Secret-Token` verification on webhook | C2 | Anonymous `/start` calls with guessed enrollment tokens are blocked. |
| 128-bit enrollment tokens (backfill rotates all existing) | H15 | 48-bit was borderline brute-forceable; 128-bit is cryptographic-key territory. |
| Batched fan-out (25/batch, 1.1s pause) + per-fetch `AbortSignal.timeout(10s)` | H2/H3 | Old code did `Promise.all` over all recipients → Telegram rate-limit hits + 60s edge-fn hangs. |
| CORS allowlist via `ALLOWED_ORIGINS` env var (was `*`) | H4 | Cross-origin phishing pages can't invoke as the user. |
| Structured JSON logging (`level`/`messageId`/`customerId`/`ip`) | H25 | Grep-able function logs across both fns. |
| Enum error codes (`auth`/`not_found`/`recipient_cap`/`rate_limited`/...) returned to client | M1 | Don't leak raw `e.message` to attackers. |
| In-memory per-IP rate limit on webhook `/start` lookups (10/min) | belt-and-suspenders | Per-instance only (stateless edge fns); real defense is the 128-bit token. |

**Two migrations:** `0013_telegram_hardening.sql` (UNIQUE indexes + idempotency_key + token bump) and `0014_service_role_grants.sql` (hotfix — `INSERT` on `message_recipients` + `SELECT, UPDATE` on `messages` for the new server-side recipient flow). The GRANT gap caught us on the first smoke test; lesson captured in [[feedback-edge-fn-grants]].

**Client-side:** `messagesService.createBroadcast` now generates an `idempotencyKey` (pinned per dialog via a BroadcastPanel ref), drops the `customers`/`recipients` params, sends only `{ messageId, mediaUrls, captionLimit }` to the edge fn. On 23505 collision (retry path), looks up the existing message and lets the fn re-process failed recipients only.

**Dashboard cutover steps** were executed during the session — see [`docs/PHASE8-SLICE2-CUTOVER.md`](PHASE8-SLICE2-CUTOVER.md) for the durable checklist + rollback plan.

---

## Files touched

**New files (Slice 1):**
- `Bold_Vision_CRM/src/utils/validators.js`
- `Bold_Vision_CRM/src/utils/inputFilters.js`
- `Bold_Vision_CRM/src/composables/useFeedback.js`
- `Bold_Vision_CRM/src/components/base/AppSnackbar.vue`
- `Bold_Vision_CRM/src/components/base/ConfirmDeleteDialog.vue`
- `Bold_Vision_CRM/src/components/assessment/NAButton.vue`
- `supabase/migrations/0012_customer_unique_contacts.sql`

**Slice 1 modified:** App.vue, all 7 assessment sections + view, AddCustomerDialog, CustomerDetailView, CustomersView, AddPropertyDialog, PropertiesForm, PropertiesView, PropertyDetailsView, PropertyInterestsPanel, CustomerInterestsPanel, BroadcastPanel, BaseSearchBar, KanbanCard, FollowUpsView, LoginView, all four services that take user input (customers, properties, media, assessments), assessmentStore, formatters.js, followUp.js, tokens.css, assessment-form.css. ~32 files.

**New files (Slice 2):**
- `supabase/migrations/0013_telegram_hardening.sql`
- `supabase/migrations/0014_service_role_grants.sql`
- `docs/PHASE8-SLICE2-CUTOVER.md`

**Slice 2 modified:** `supabase/functions/send-telegram/index.ts`, `supabase/functions/telegram-webhook/index.ts`, `messagesService.js`, `BroadcastPanel.vue`. 7 files / +1034/-190.

---

## What's NOT done

The audit (`crispy-shimmying-valiant.md`) still has ~80 findings open. Critical items closed by Slices 1+2: **C1, C2, C4, C10, C11, C13** (the last was Phase 7). Still open:

| ID | Item |
|---|---|
| C3 | `SET search_path = public, pg_temp` on all `SECURITY DEFINER` trigger functions (30-min slice) |
| C6 | `vite.config.js`: `base: '/'` |
| C7 | `vercel.json` (SPA rewrite + CSP + security headers) |
| C8 | `useAuthStore().init()` error handling — no infinite loading |
| C9 | `vueDevTools` dev-only |
| C12 | `await authStore.init()` before mount; use store in router guard |
| C14 | Backup / DR plan (Supabase Pro + weekly `pg_dump` mirror) |
| C15 | (rolled into C7) |

After CRITICAL: ~34 HIGH, ~40 MEDIUM, ~16 LOW. **Next migration is `0015_*.sql`** (0012/13/14 are taken).

---

## Continuing this work

1. **Decide branch strategy first.**
   - Option A: merge `Feature/Phase8-InputValidation` to main now (two clean commits ready), branch new slice off main.
   - Option B: keep extending this branch with Slice 3+ (PR keeps growing).
   - Slices 1+2 are a clean reviewable PR as-is. **Recommend Option A.**

2. **Open PR manually on GitHub** when ready (per [[no-gh-cli]] memory — `gh` CLI doesn't work on this machine). Push the branch first.

3. **For the next slice**, re-read the audit doc and pick a focused scope. Recommended:
   - **Vercel deploy prep** (C6 + C7 + C9 + C12): last big chunk before production launch. Self-contained config + 2 small frontend changes.
   - **DB hardening** (C3 + H10 FK indexes + H13 RLS tightening): small SQL-only slice if you want a quick win first.
   - **Frontend resilience** (C8 + H5 + H6/H7 + H24): user-visible robustness.

4. **Lesson from Slice 2:** when an edge-fn rewrite changes what tables it reads/writes, audit `service_role` GRANTs in a fresh migration BEFORE deploying. See [[feedback-edge-fn-grants]].

---

## Test plan (for reviewing this PR locally)

Quick smoke tests for Slice 1 + 1b:

- **AddCustomerDialog**: try saving with no name → blocked; same phone as existing customer → blocked with link to that customer; same name only → yellow warn "Save anyway"; long notes (>5000) → blocked.
- **CustomerDetailView**: open existing customer; type `abc` in phone → red inline error on blur; try delete → typed `CONFIRM` gate.
- **PropertiesForm**: bedrooms=999 → blocked; postcode=abc → blocked; price max < min → blocked.
- **Assessment form**: open a draft; nav rail shows correct three states as you fill fields; click N/A on Income row → row clears + locks; tick Liabilities "No liabilities" → section turns green and rows hide.
- **Broadcast**: paste 5000-char body → cuts at 4096 with red counter; send to 0 eligible → blocked.
- **FollowUps reschedule**: pick yesterday → inline red error; Confirm disabled.
- **LoginView**: type `abc` in email → Vuetify rule fires "Invalid email format" on submit.
- **Search bars**: paste 500 chars → truncated to 200.

Slice 2 smoke tests are in [`PHASE8-SLICE2-CUTOVER.md`](PHASE8-SLICE2-CUTOVER.md) §6 — covers anon-call-rejected, missing-secret-rejected, wrong-secret-rejected, authenticated-broadcast-works, idempotency, enrollment, already-enrolled, bad-token, structured-logs. All 9 passed in the session.

For the migrations on a fresh Supabase project, apply in order: `0012_customer_unique_contacts.sql` (Slice 1 — pre-flight + functional UNIQUE indexes), then `0013_telegram_hardening.sql` (Slice 2 — UNIQUE + idempotency + token bump), then `0014_service_role_grants.sql` (Slice 2 hotfix — grants for new edge-fn flow). Each has pre-flight SELECTs or is idempotent.
