<template>
  <div class="modal-card">
    <!-- Head -->
    <div class="modal-head">
      <span class="ico"><AppIcon name="chat" :size="18" /></span>
      <div class="modal-head__text">
        <h2>Broadcast via Telegram</h2>
        <div class="sub">{{ property.address }}<span v-if="property.suburb">, {{ property.suburb }}</span></div>
      </div>
      <button class="close" aria-label="Close" @click="$emit('close')">
        <AppIcon name="x" :size="16" />
      </button>
    </div>

    <!-- Grid: audience picker (left) + message preview/editor (right) -->
    <div class="modal-grid">

      <!-- Audience picker -->
      <div class="audience-panel">
        <h4>Audience</h4>
        <div class="audience-options">
          <button
            v-for="opt in audienceOptions"
            :key="opt.value"
            class="audience-opt"
            :data-tone="opt.tone"
            :aria-pressed="selectedAudience === opt.value"
            @click="selectedAudience = opt.value"
          >
            <span class="dot" />
            <span class="lbl">{{ opt.label }}</span>
            <span class="ct">{{ audienceCount(opt.value) }}</span>
            <AppIcon name="check" :size="14" class="tick" />
          </button>
        </div>

        <div class="recipients-preview">
          <div class="label">
            {{ eligibleRecipients.length === 0
              ? 'No recipients'
              : `Reaches ${eligibleRecipients.length} customer${eligibleRecipients.length === 1 ? '' : 's'}` }}
          </div>
          <div v-if="eligibleRecipients.length === 0" class="empty">
            Add interested Telegram customers first.
          </div>
          <div v-else class="recipients-stack">
            <span
              v-for="r in eligibleRecipients.slice(0, 4)"
              :key="r.id"
              class="av"
              :style="{ background: avatarColor(r) }"
            >{{ initials(r.name) }}</span>
            <span v-if="eligibleRecipients.length > 4" class="more">
              +{{ eligibleRecipients.length - 4 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Message preview + editor -->
      <div class="message-panel">
        <h4>Preview</h4>
        <div class="tg-frame">
          <div class="tg-bubble" :class="{ 'has-album': showAlbum }">
            <!-- Album preview: mirrors Telegram sendMediaGroup layout -->
            <div v-if="showAlbum" class="tg-album" :data-count="albumThumbs.length">
              <div
                v-for="(t, i) in albumThumbs"
                :key="t.id"
                class="tg-album__cell"
                :style="t.url ? { backgroundImage: `url(${t.url})` } : null"
              >
                <AppIcon v-if="!t.url" :name="t.kind === 'floorplan' ? 'building' : 'house'" :size="18" />
                <span v-if="i === albumThumbs.length - 1 && albumOverflow > 0" class="tg-album__more">
                  +{{ albumOverflow }}
                </span>
              </div>
            </div>

            <!-- Link-card placeholder: only shown when no album -->
            <div v-else class="card-preview">
              <div class="card-thumb"><AppIcon name="house" :size="16" /></div>
              <div class="card-meta">
                <span class="t">{{ property.address }}</span>
                <span class="s">
                  {{ property.priceGuide || 'Price on request' }}
                  <span v-if="property.bedrooms"> · {{ property.bedrooms }} bed</span>
                  <span v-if="property.bathrooms"> · {{ property.bathrooms }} bath</span>
                </span>
              </div>
            </div>

            <div class="body">{{ messageBody || '…' }}</div>
            <div class="meta">
              {{ nowLabel }}
              <AppIcon name="check" :size="11" class="ticks" />
            </div>
          </div>
        </div>

        <div class="tg-edit-label">
          <span>Message</span>
          <span class="count">{{ messageBody.length }} chars</span>
        </div>
        <textarea
          v-model="messageBody"
          class="tg-edit"
          placeholder="Write your broadcast…"
        />

        <!-- Media toggle: include property photos + floor plans -->
        <label class="bp-media-toggle" :class="{ 'is-disabled': !hasMedia }">
          <input
            type="checkbox"
            v-model="includeMedia"
            :disabled="!hasMedia"
          />
          <span class="lbl">
            <AppIcon name="house" :size="13" />
            Include photos &amp; floor plans
          </span>
          <span class="ct" :class="{ 'ct--empty': !hasMedia }">
            <template v-if="hasMedia">
              {{ photoCount }} photo{{ photoCount === 1 ? '' : 's' }}<template v-if="floorplanCount">, {{ floorplanCount }} plan{{ floorplanCount === 1 ? '' : 's' }}</template>
            </template>
            <template v-else>None on file</template>
          </span>
        </label>
      </div>
    </div>

    <!-- Footer -->
    <div class="modal-foot modal-foot--split">
      <span class="hint">
        <template v-if="sent">
          <AppIcon name="check" :size="14" class="hint-icon hint-icon--ok" />
          <span class="hint-text--ok">Sent to {{ lastSentCount }}</span>
        </template>
        <template v-else-if="sending">
          <AppIcon name="clock" :size="14" class="hint-icon" />
          Sending via Telegram…
        </template>
        <template v-else>
          <AppIcon name="chat" :size="12" class="hint-icon" />
          Delivered via Bold Vision bot
        </template>
      </span>
      <div class="actions">
        <button class="btn btn-ghost" :disabled="sending" @click="$emit('close')">Cancel</button>
        <button
          class="btn-send"
          :disabled="eligibleRecipients.length === 0 || !messageBody.trim() || sending || sent"
          @click="send"
        >
          <AppIcon name="chat" :size="14" />
          <template v-if="sent">Sent</template>
          <template v-else-if="sending">Sending…</template>
          <template v-else>
            Send <span class="ct">{{ eligibleRecipients.length }}</span>
          </template>
        </button>
      </div>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

defineOptions({ inheritAttrs: false })
defineEmits(['close'])
import { useCustomerStore } from '../../stores/customerStore'
import { createBroadcast } from '../../services/messagesService'
import { listPropertyMedia, getSignedUrl } from '../../services/mediaService'
import AppIcon from '../base/AppIcon.vue'

const ALBUM_PREVIEW_MAX = 4   // Telegram caps the album at 10; preview shows up to 4 thumbs + "+N"

const props = defineProps({
  property: { type: Object, required: true },
})

const customerStore = useCustomerStore()

const selectedAudience = ref('All')
const messageBody      = ref('')
const sending          = ref(false)
const sent             = ref(false)
const lastSentCount    = ref(0)

// Media: photos + floor plans available for this property.
const propertyMedia = ref([])
const thumbUrls     = ref({})     // { [storage_path]: signedUrl } — populated lazily on mount
const photoCount     = computed(() => propertyMedia.value.filter((m) => m.kind === 'photo').length)
const floorplanCount = computed(() => propertyMedia.value.filter((m) => m.kind === 'floorplan').length)
const hasMedia       = computed(() => propertyMedia.value.length > 0)
const includeMedia   = ref(true)  // default ON; auto-flips off in onMounted if no media exists

// Album preview: photos first, then floor plans, matching messagesService order.
const orderedMedia = computed(() =>
  [...propertyMedia.value].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'photo' ? -1 : 1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  }),
)
const showAlbum = computed(() => includeMedia.value && hasMedia.value)
const albumThumbs = computed(() =>
  orderedMedia.value.slice(0, ALBUM_PREVIEW_MAX).map((m) => ({
    id: m.id,
    kind: m.kind,
    url: thumbUrls.value[m.storage_path] ?? null,
  })),
)
const albumOverflow = computed(() => Math.max(0, orderedMedia.value.length - ALBUM_PREVIEW_MAX))

const snackbar = ref({ show: false, text: '', color: 'success' })

const audienceOptions = [
  { label: 'All',  value: 'All',  tone: 'all'  },
  { label: 'Hot',  value: 'Hot',  tone: 'hot'  },
  { label: 'Warm', value: 'Warm', tone: 'warm' },
  { label: 'Cold', value: 'Cold', tone: 'cold' },
]

const telegramCustomers = computed(() =>
  customerStore.customers.filter((c) => c.telegramChatId)
)

function audienceCount(filter) {
  if (filter === 'All') return telegramCustomers.value.length
  return telegramCustomers.value.filter((c) => c.category === filter).length
}

const eligibleRecipients = computed(() => {
  if (selectedAudience.value === 'All') return telegramCustomers.value
  return telegramCustomers.value.filter((c) => c.category === selectedAudience.value)
})

const nowLabel = computed(() =>
  new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
)

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function avatarColor(customer) {
  const palette = {
    Hot: 'var(--hot)',
    Warm: 'var(--warm)',
    Cold: 'var(--cold)',
  }
  return palette[customer.category] ?? 'var(--accent)'
}

function buildDefaultMessage() {
  const p = props.property
  const lines = [`New Listing: ${p.address}${p.suburb ? ', ' + p.suburb : ''}`]
  if (p.priceGuide)  lines.push(`Price: ${p.priceGuide}`)
  const details = []
  if (p.bedrooms)   details.push(`${p.bedrooms} bed`)
  if (p.bathrooms)  details.push(`${p.bathrooms} bath`)
  if (p.carSpaces)  details.push(`${p.carSpaces} car`)
  if (details.length) lines.push(details.join(' | '))
  if (p.description) lines.push('', p.description)
  lines.push('', 'Contact Bold Vision Properties for more information.')
  return lines.join('\n')
}

async function send() {
  if (eligibleRecipients.value.length === 0 || !messageBody.value.trim()) return
  sending.value = true
  try {
    const result = await createBroadcast({
      propertyId: props.property.id,
      body: messageBody.value,
      audienceFilter: selectedAudience.value,
      customers: eligibleRecipients.value,
      includeMedia: includeMedia.value && hasMedia.value,
    })
    lastSentCount.value = result.sent
    sent.value = true
    snackbar.value = {
      show: true,
      text: `Sent to ${result.sent} customer${result.sent === 1 ? '' : 's'}${result.failed ? ` (${result.failed} failed)` : ''}${result.includedMedia ? ' with media' : ''}.`,
      color: result.failed ? 'warning' : 'success',
    }
  } catch (e) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' }
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  messageBody.value = buildDefaultMessage()
  try {
    propertyMedia.value = await listPropertyMedia(props.property.id)
  } catch {
    propertyMedia.value = []
  }
  if (!hasMedia.value) {
    includeMedia.value = false
    return
  }
  // Fetch signed URLs for the thumbs we'll actually render. Failures are
  // non-fatal — the cell falls back to an icon placeholder.
  const top = orderedMedia.value.slice(0, ALBUM_PREVIEW_MAX)
  await Promise.all(
    top.map(async (m) => {
      try {
        thumbUrls.value[m.storage_path] = await getSignedUrl(m.storage_path, m.kind)
      } catch { /* leave unset → icon placeholder */ }
    }),
  )
})
</script>

<style scoped>
/* Modal-card chrome (head/foot) comes from styles/components/modals.css.
   Below: BroadcastPanel-specific layout (grid + audience + message + bubble). */

/* Make the broadcast modal taller than the default modal-card so the
   preview + editor have real room. Mobile fullscreen override below. */
.modal-card {
  min-height: 70vh;
}

/* ── Grid (audience + message) ──────────────────────────────── */
.modal-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 0;
  flex: 1;
}

/* Audience panel */
.audience-panel {
  padding: 20px 22px;
  border-right: 1px solid var(--border);
  background: var(--surface-2);
  display: flex; flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.audience-panel h4,
.message-panel h4 {
  margin: 0;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-faint);
}

.audience-options { display: flex; flex-direction: column; gap: 6px; }
.audience-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 13.5px; color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: border-color .12s, background .12s, transform .08s;
  position: relative;
}
.audience-opt:hover { border-color: var(--border-strong); }
.audience-opt .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.audience-opt[data-tone="all"]  .dot { background: var(--accent); }
.audience-opt[data-tone="hot"]  .dot { background: var(--hot); }
.audience-opt[data-tone="warm"] .dot { background: var(--warm); }
.audience-opt[data-tone="cold"] .dot { background: var(--cold); }
.audience-opt .lbl { flex: 1; }
.audience-opt .ct {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--surface-2);
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11.5px;
}
.audience-opt .tick {
  position: absolute; right: 10px;
  color: var(--accent);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity .12s, transform .12s;
  pointer-events: none;
}
.audience-opt[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.audience-opt[aria-pressed="true"] .ct {
  background: var(--accent);
  color: var(--text-on-accent);
}
.audience-opt[aria-pressed="true"] .tick {
  opacity: 1;
  transform: scale(1);
}
.audience-opt[aria-pressed="true"] .lbl { padding-right: 22px; }

/* Recipients preview */
.recipients-preview {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}
.recipients-preview .label {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.recipients-stack { display: flex; align-items: center; }
.recipients-stack .av {
  width: 26px; height: 26px;
  border-radius: 50%;
  margin-left: -6px;
  font-size: 10px; font-weight: 700;
  color: var(--text-on-accent);
  display: grid; place-items: center;
  box-shadow: 0 0 0 2px var(--surface-2);
}
.recipients-stack .av:first-child { margin-left: 0; }
.recipients-stack .more {
  margin-left: -6px;
  background: var(--surface-sunk);
  color: var(--text-muted);
  border-radius: 50%;
  width: 26px; height: 26px;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 600;
  box-shadow: 0 0 0 2px var(--surface-2);
}
.recipients-preview .empty {
  font-size: 12px;
  color: var(--text-faint);
  font-style: italic;
}

/* ── Message panel ──────────────────────────────────────────── */
.message-panel {
  padding: 20px 22px;
  display: flex; flex-direction: column; gap: 12px;
  overflow: hidden;
  min-width: 0;
}

/* Telegram-style preview */
.tg-frame {
  background:
    radial-gradient(circle at 20% 30%, oklch(55% 0.06 230 / 0.16) 0%, transparent 35%),
    radial-gradient(circle at 80% 70%, oklch(55% 0.07 60 / 0.14) 0%, transparent 35%),
    var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 16px 14px 14px;
  overflow-y: auto;
  flex: 1 1 0;
  min-height: 280px;
}
.tg-bubble {
  max-width: 92%;
  background: var(--surface);
  border-radius: 14px 14px 14px 4px;
  padding: 8px 10px 6px;
  box-shadow: 0 1px 2px oklch(20% 0.02 60 / 0.08);
  font-size: 13.5px; line-height: 1.45;
  color: var(--text);
  position: relative;
}
.tg-bubble .card-preview {
  display: flex; gap: 10px;
  background: var(--surface-2);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  border-left: 3px solid oklch(58% 0.14 240);
}

/* Album: photo grid that mimics Telegram's sendMediaGroup layout */
.tg-bubble.has-album { padding: 4px 4px 6px; max-width: 96%; }
.tg-album {
  display: grid;
  gap: 2px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 6px;
  background: var(--surface-sunk);
}
.tg-album[data-count="1"] { grid-template-columns: 1fr; }
.tg-album[data-count="2"] { grid-template-columns: 1fr 1fr; }
.tg-album[data-count="3"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.tg-album[data-count="3"] .tg-album__cell:first-child { grid-row: span 2; }
.tg-album[data-count="4"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.tg-album__cell {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: var(--surface-sunk);
  background-size: cover;
  background-position: center;
  display: grid; place-items: center;
  color: var(--text-faint);
}
.tg-album[data-count="1"] .tg-album__cell { aspect-ratio: 16 / 10; }
.tg-album__more {
  position: absolute;
  inset: 0;
  background: oklch(20% 0.02 60 / 0.55);
  color: oklch(100% 0 0);
  font-weight: 700;
  font-size: 16px;
  display: grid; place-items: center;
  letter-spacing: 0.02em;
}
.tg-bubble.has-album .body { padding: 0 6px; }
.tg-bubble.has-album .meta { padding: 0 6px; }
.tg-bubble .card-thumb {
  width: 44px; height: 44px;
  border-radius: 8px;
  background:
    repeating-linear-gradient(45deg, var(--surface) 0 6px, var(--surface-sunk) 6px 12px);
  display: grid; place-items: center;
  color: var(--text-faint);
  flex-shrink: 0;
}
.tg-bubble .card-meta { min-width: 0; flex: 1; }
.tg-bubble .card-meta .t {
  display: block;
  font-weight: 600; font-size: 13px;
  color: oklch(58% 0.14 240);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tg-bubble .card-meta .s {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
}
.tg-bubble .body {
  white-space: pre-wrap;
  word-break: break-word;
}
.tg-bubble .meta {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 4px; margin-top: 4px;
  font-size: 10.5px; color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
.tg-bubble .meta .ticks { color: oklch(58% 0.14 240); }

/* Edit area */
.tg-edit-label {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-faint);
}
.tg-edit-label .count {
  font-size: 11px; color: var(--text-faint);
  letter-spacing: 0; text-transform: none;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.tg-edit {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 12px 14px;
  font-family: inherit;
  font-size: 13.5px; line-height: 1.5;
  color: var(--text);
  resize: vertical;
  min-height: 100px;
  transition: border-color .12s, background .12s, box-shadow .12s;
}
.tg-edit:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

/* Media toggle */
.bp-media-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  transition: border-color .12s, background .12s;
}
.bp-media-toggle:hover { border-color: var(--border-strong); }
.bp-media-toggle.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.bp-media-toggle input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: inherit;
  flex-shrink: 0;
}
.bp-media-toggle .lbl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.bp-media-toggle .ct {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
}
.bp-media-toggle .ct--empty {
  color: var(--text-faint);
  font-style: italic;
}

/* ── Footer hint + Send button (footer chrome itself is shared) ── */
.hint-icon { color: var(--text-muted); }
.hint-icon--ok { color: var(--accent); }
.hint-text--ok { color: var(--accent); font-weight: 600; }

.modal-foot .btn-send {
  display: inline-flex; align-items: center; gap: 8px;
  height: 38px; padding: 0 16px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--text-on-accent);
  font-weight: 600; font-size: 13.5px;
  border: none; cursor: pointer;
  transition: background .12s, transform .08s;
}
.modal-foot .btn-send:hover:not(:disabled) { background: var(--accent-hover, var(--accent)); }
.modal-foot .btn-send:active:not(:disabled) { transform: translateY(1px); }
.modal-foot .btn-send:disabled {
  background: var(--surface-sunk);
  color: var(--text-faint);
  cursor: not-allowed;
}
.modal-foot .btn-send .ct {
  background: oklch(100% 0 0 / 0.18);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 720px) {
  /* Fullscreen on phone (driven by :fullscreen="mobile" on v-dialog) —
     remove desktop chrome so the card fills edge-to-edge. */
  .modal-card {
    min-height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }

  /* Tighter head so the title doesn't wrap "Broadcast via\nTelegram" */
  .modal-head { padding: 12px 14px; gap: 10px; }
  .modal-head .ico { width: 30px; height: 30px; border-radius: 8px; }
  .modal-head h2 { font-size: 15px; line-height: 1.2; }
  .modal-head .sub {
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Stack columns; let the page itself scroll */
  .modal-grid { grid-template-columns: 1fr; overflow-y: auto; }
  .audience-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: 14px 16px;
  }
  .message-panel { padding: 14px 16px; gap: 10px; }
  .tg-frame { min-height: 240px; flex: 0 0 auto; }

  /* Footer: hide the hint to keep buttons on a single tidy row */
  .modal-foot { padding: 10px 14px; gap: 8px; }
  .modal-foot .hint { display: none; }
  .modal-foot .actions { flex: 1; gap: 8px; }
  .modal-foot .btn-ghost,
  .modal-foot .btn-send { flex: 1; justify-content: center; }
}
</style>
