<template>
  <div class="dash-shell">
    <!-- Header -->
    <header class="dash-header">
      <h1 class="dash-title">Dashboard</h1>
      <p class="dash-subtitle">{{ today }}</p>
    </header>

    <!-- Follow-ups summary (the only live widget for now) -->
    <section class="dash-card dash-card--hero">
      <div class="dash-card__head">
        <div class="dash-card__title">
          <AppIcon name="bell" :size="16" />
          <h3>Follow-ups</h3>
        </div>
        <span v-if="overdueCount > 0" class="pill hot" style="height: 22px; padding: 0 10px;">
          <span class="dot"></span>{{ overdueCount }} overdue
        </span>
      </div>

      <div class="dash-card__body">
        <div v-if="hasStats" class="dash-fu-stats">
          <div v-if="overdueCount > 0" class="dash-fu-stat" data-tone="hot">
            <div class="num">{{ overdueCount }}</div>
            <div class="lbl">Overdue</div>
          </div>
          <div v-if="unscheduledCount > 0" class="dash-fu-stat" data-tone="warm">
            <div class="num">{{ unscheduledCount }}</div>
            <div class="lbl">No schedule</div>
          </div>
          <div v-if="todayCount > 0" class="dash-fu-stat" data-tone="accent">
            <div class="num">{{ todayCount }}</div>
            <div class="lbl">Due today</div>
          </div>
          <div v-if="weekCount > 0" class="dash-fu-stat" data-tone="muted">
            <div class="num">{{ weekCount }}</div>
            <div class="lbl">This week</div>
          </div>
        </div>

        <div v-else class="dash-fu-empty">
          <AppIcon name="check" :size="28" />
          <p class="t">All caught up</p>
          <p class="s">No overdue or unscheduled customers.</p>
        </div>
      </div>

      <div class="dash-card__foot">
        <RouterLink :to="{ name: 'follow-ups' }" class="btn btn-ghost dash-cta">
          View follow-ups
          <AppIcon name="arrow-right" :size="13" />
        </RouterLink>
      </div>
    </section>

    <!-- Coming soon — placeholder widgets for future phases -->
    <div class="dash-soon-head">
      <span class="dash-section-label">Coming soon</span>
      <span class="dash-section-meta">Planned for a future phase</span>
    </div>

    <div class="dash-grid">
      <div
        v-for="card in upcomingCards"
        :key="card.title"
        class="dash-soon-card"
        :data-tone="card.tone"
      >
        <div class="dash-soon-card__top">
          <span class="dash-soon-icon">
            <AppIcon :name="card.icon" :size="20" />
          </span>
          <span class="dash-soon-pill">
            <span class="dot"></span>Coming soon
          </span>
        </div>
        <h3 class="dash-soon-card__title">{{ card.title }}</h3>
        <p class="dash-soon-card__desc">{{ card.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'

const store = useCustomerStore()
const customers = computed(() => store.customers)
const { overdueCount, unscheduledCount, days } = useCustomerFollowups(customers)

const todayCount = computed(() => days.value[0]?.customers.length ?? 0)
const weekCount = computed(() =>
  days.value.reduce((sum, d) => sum + d.customers.length, 0),
)
const hasStats = computed(() =>
  overdueCount.value > 0 || unscheduledCount.value > 0 || weekCount.value > 0,
)

const today = new Date().toLocaleDateString('en-AU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const upcomingCards = [
  {
    title: 'Properties pipeline',
    icon:  'house',
    tone:  'accent',
    desc:  'At-a-glance view of listings by stage — on market, under contract, sold this month.',
  },
  {
    title: 'Recent activity',
    icon:  'chat',
    tone:  'cold',
    desc:  'Latest interactions across all your customers — calls, emails, Telegram broadcasts.',
  },
  {
    title: 'Inquiries this month',
    icon:  'mail',
    tone:  'warm',
    desc:  'New inquiries, response rates, and how leads are progressing through the funnel.',
  },
  {
    title: 'Performance',
    icon:  'star',
    tone:  'success',
    desc:  'Deals closed, properties sold, and conversion rates over the past 30 / 90 days.',
  },
]
</script>

<style scoped>
.dash-shell {
  padding: 24px 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ───────────────────────────────────────── */
.dash-header { display: flex; flex-direction: column; gap: 4px; }
.dash-title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.dash-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
}

/* ── Card chrome (shared) ────────────────────────── */
.dash-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.dash-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
}
.dash-card__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}
.dash-card__title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.dash-card__body { padding: 4px 20px 16px; flex: 1; }
.dash-card__foot {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}
.dash-cta { text-decoration: none; }

/* ── Hero card — Follow-ups summary ──────────────── */
.dash-card--hero .dash-card__head { padding: 18px 22px 14px; }
.dash-card--hero .dash-card__title h3 { font-size: 17px; }

.dash-fu-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  padding-top: 8px;
}
.dash-fu-stat {
  padding: 18px 20px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dash-fu-stat .num {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.dash-fu-stat .lbl {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.dash-fu-stat[data-tone='hot']    { background: var(--hot-soft);    border-color: color-mix(in oklab, var(--hot) 25%, var(--border)); }
.dash-fu-stat[data-tone='hot']    .num { color: var(--hot-ink); }
.dash-fu-stat[data-tone='hot']    .lbl { color: var(--hot-ink); }
.dash-fu-stat[data-tone='warm']   { background: var(--warm-soft);   border-color: color-mix(in oklab, var(--warm) 25%, var(--border)); }
.dash-fu-stat[data-tone='warm']   .num { color: var(--warm-ink); }
.dash-fu-stat[data-tone='warm']   .lbl { color: var(--warm-ink); }
.dash-fu-stat[data-tone='accent'] { background: var(--accent-soft); border-color: color-mix(in oklab, var(--accent) 30%, var(--border)); }
.dash-fu-stat[data-tone='accent'] .num { color: var(--accent-ink); }
.dash-fu-stat[data-tone='accent'] .lbl { color: var(--accent-ink); }

.dash-fu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 36px 16px;
  text-align: center;
}
.dash-fu-empty :deep(svg) { color: var(--success); }
.dash-fu-empty .t {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.dash-fu-empty .s {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

/* ── Coming-soon section ─────────────────────────── */
.dash-soon-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
}
.dash-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.dash-section-meta {
  font-size: 12px;
  color: var(--text-faint);
  font-style: italic;
}

.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

/* ── Coming-soon cards ─────────────────────────────
   Tone-coded preview tiles. Each card gets a colored icon block
   matching its data-tone (accent / cold / warm / success) plus a
   matching soft gradient stripe along the top edge. Hover lift +
   border-strong to feel "almost interactive" without being clickable. */
.dash-soon-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  transition: transform .12s, border-color .12s, box-shadow .12s;
}
.dash-soon-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}
.dash-soon-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--accent);
  opacity: 0.7;
}
.dash-soon-card[data-tone='accent']::before  { background: var(--accent); }
.dash-soon-card[data-tone='cold']::before    { background: var(--cold); }
.dash-soon-card[data-tone='warm']::before    { background: var(--warm); }
.dash-soon-card[data-tone='success']::before { background: var(--success); }

.dash-soon-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dash-soon-icon {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  flex-shrink: 0;
}
.dash-soon-card[data-tone='accent']  .dash-soon-icon { background: var(--accent-soft);  color: var(--accent-ink); }
.dash-soon-card[data-tone='cold']    .dash-soon-icon { background: var(--cold-soft);    color: var(--cold-ink); }
.dash-soon-card[data-tone='warm']    .dash-soon-icon { background: var(--warm-soft);    color: var(--warm-ink); }
.dash-soon-card[data-tone='success'] .dash-soon-icon { background: var(--success-soft); color: var(--success-ink); }

.dash-soon-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 10px 0 8px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.dash-soon-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-faint);
  animation: dash-pulse 1.8s ease-in-out infinite;
}
@keyframes dash-pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}

.dash-soon-card__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
}
.dash-soon-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 1100px) { .dash-shell { padding: 20px 20px 32px; } }
@media (max-width: 720px) {
  .dash-shell { padding: 14px 12px 24px; gap: 16px; }
  .dash-title { font-size: 22px; }
  .dash-card__head { padding: 14px 16px 10px; }
  .dash-card__body { padding: 0 16px 14px; }
  .dash-card__foot { padding: 10px 16px 14px; }
}
</style>
