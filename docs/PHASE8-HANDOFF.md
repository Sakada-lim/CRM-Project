# Phase 8 Handoff — Input Validation Slice (Slice 1 + 1b)

**Branch:** `Feature/Phase8-InputValidation` (off `main` at `8d04305`)
**State:** Working tree dirty with Slice 1 + 1b changes. **Not committed, not merged.**
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

---

## Files touched

**New files (untracked):**
- `Bold_Vision_CRM/src/utils/validators.js`
- `Bold_Vision_CRM/src/utils/inputFilters.js`
- `Bold_Vision_CRM/src/composables/useFeedback.js`
- `Bold_Vision_CRM/src/components/base/AppSnackbar.vue`
- `Bold_Vision_CRM/src/components/base/ConfirmDeleteDialog.vue`
- `Bold_Vision_CRM/src/components/assessment/NAButton.vue`
- `supabase/migrations/0012_customer_unique_contacts.sql`

**Modified:** App.vue, all 7 assessment sections + view, AddCustomerDialog, CustomerDetailView, CustomersView, AddPropertyDialog, PropertiesForm, PropertiesView, PropertyDetailsView, PropertyInterestsPanel, CustomerInterestsPanel, BroadcastPanel, BaseSearchBar, KanbanCard, FollowUpsView, LoginView, all four services that take user input (customers, properties, media, assessments), assessmentStore, formatters.js, followUp.js, tokens.css, assessment-form.css. ~32 files total.

---

## What's NOT done

The audit (`crispy-shimmying-valiant.md`) still has 90+ findings open. **No CRITICAL item beyond C13 has shipped.** Top of the next slice's pile:

| ID | Item |
|---|---|
| C1 | `verify_jwt=true` + caller-owns-property check on `send-telegram` edge fn |
| C2 | Telegram webhook `X-Telegram-Bot-Api-Secret-Token` validation |
| C3 | `SET search_path = public, pg_temp` on all `SECURITY DEFINER` trigger functions |
| C4 | UNIQUE on `customers.telegram_chat_id` (Slice 1 only did phone + email) |
| C6 | `vite.config.js`: `base: '/'` |
| C7 | `vercel.json` (SPA rewrite + CSP + security headers) |
| C8 | `useAuthStore().init()` error handling — no infinite loading |
| C9 | `vueDevTools` dev-only |
| C10/C11 | Broadcast idempotency key + server-side recipient computation |
| C12 | `await authStore.init()` before mount; use store in router guard |
| C14 | Backup / DR plan (Supabase Pro + weekly `pg_dump` mirror) |
| C15 | (rolled into C7) |

After CRITICAL: 34 HIGH, 40 MEDIUM, 16 LOW. **Next migration is `0013_*.sql`** (0012 is taken).

---

## Continuing this work

1. **Decide branch strategy first.**
   - Option A: merge `Feature/Phase8-InputValidation` to main now, branch new slice off main.
   - Option B: keep extending this branch with Slice 2 (less safe — PR keeps growing).
   - Slice 1 + 1b is a clean reviewable PR as-is. Recommend Option A.

2. **Commit before moving on.** Working tree is dirty across ~32 files. Suggested commits:
   - `Phase 8 Slice 1: input validation across all forms + duplicate-detection + delete dialogs`
   - `Phase 8 Slice 1b: assessment N/A flags + three-state completion logic`
   - `Phase 8 deep-scan: LoginView email rule + search-bar maxlength + FollowUps inline errors`

3. **Open PR manually on GitHub** (per [[no-gh-cli]] memory — `gh` CLI doesn't work on this machine).

4. **For the next slice**, re-read the audit doc and pick a focused scope. Edge-fn auth (C1+C2) is a self-contained slice and the highest security value. Vercel deploy (C6+C7+C9+C12) is another self-contained slice but interacts with hosting setup.

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

For the migration: apply `0012_customer_unique_contacts.sql` to a fresh Supabase project, verify the two partial UNIQUE indexes exist on `customers (auth_user_id, normalized phone)` and `customers (auth_user_id, lower email)`. Pre-flight SELECTs in the file should return 0 rows on a clean DB.
