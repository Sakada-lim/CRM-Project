<template>
  <v-app>
    <!-- Auth loading -->
    <v-main v-if="authStore.loading" class="bv-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-main>

    <!-- Login page — no sidebar -->
    <template v-else-if="isLoginPage">
      <v-main><router-view /></v-main>
    </template>

    <!-- Authenticated shell -->
    <template v-else>
      <!-- Desktop sidebar drawer (hidden on mobile — mobile uses a top-bar + dropdown instead) -->
      <v-navigation-drawer
        v-if="!mobile"
        v-model="drawerOpen"
        class="bv-sidebar"
        :class="{ 'bv-sidebar--collapsed': collapsed }"
        :width="240"
        :rail="collapsed"
        :rail-width="68"
        :scrim="true"
        floating
        elevation="0"
      >
        <div class="bv-sidebar__inner">
          <!-- Brand mark doubles as the collapse toggle on desktop -->
          <div class="bv-sidebar__brand">
            <button
              type="button"
              class="bv-brand-mark"
              :title="brandTitle"
              :aria-label="brandTitle"
              @click="onBrandClick"
            >
              <AppIcon name="house" :size="18" />
            </button>
            <span v-if="!collapsed" class="bv-brand-name">Bold Vision</span>
          </div>

          <!-- Section label -->
          <div v-if="!collapsed" class="bv-sidebar__section-label">Workspace</div>

          <!-- Nav -->
          <nav class="bv-sidebar__nav">
            <router-link
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="bv-nav-item"
              :class="{ active: route.name === item.name }"
              :title="collapsed ? item.label : undefined"
            >
              <AppIcon :name="item.icon" :size="17" />
              <span v-if="!collapsed" class="bv-nav-item__label">{{ item.label }}</span>
              <span
                v-if="item.badge"
                class="bv-nav-item__badge"
                :class="item.badgeTone && `is-${item.badgeTone}`"
              >{{ item.badge }}</span>
            </router-link>
          </nav>

          <!-- Footer -->
          <div class="bv-sidebar__footer">
            <div class="bv-user">
              <div class="bv-avatar">{{ userInitials }}</div>
              <span v-if="!collapsed" class="bv-user-email">{{ userEmail }}</span>
            </div>
            <div v-if="!collapsed" class="bv-footer-actions">
              <button class="bv-icon-btn" :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'" @click="toggleTheme">
                <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
              </button>
              <button class="bv-icon-btn" title="Sign out" @click="handleSignOut">
                <AppIcon name="logout" :size="16" />
              </button>
            </div>
          </div>
        </div>
      </v-navigation-drawer>

      <v-main class="bv-main">
        <!-- Mobile top bar with dropdown menu -->
        <template v-if="mobile">
          <header class="bv-mobile-bar">
            <span class="bv-mobile-bar__brand">
              <span class="bv-brand-mark bv-brand-mark--static">
                <AppIcon name="house" :size="16" />
              </span>
              Bold Vision
            </span>
            <button
              type="button"
              class="bv-icon-btn bv-mobile-bar__toggle"
              :aria-expanded="mobileMenuOpen"
              :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <AppIcon :name="mobileMenuOpen ? 'x' : 'menu'" :size="20" />
            </button>
          </header>

          <!-- Scrim closes the dropdown on tap-outside -->
          <Transition name="bv-scrim">
            <div
              v-if="mobileMenuOpen"
              class="bv-mobile-scrim"
              @click="mobileMenuOpen = false"
            />
          </Transition>

          <!-- Dropdown panel — slides down from below the top bar -->
          <Transition name="bv-drop">
            <div v-if="mobileMenuOpen" class="bv-mobile-drop">
              <div class="bv-sidebar__section-label">Workspace</div>
              <nav class="bv-mobile-drop__nav">
                <router-link
                  v-for="item in navItems"
                  :key="item.name"
                  :to="{ name: item.name }"
                  class="bv-nav-item"
                  :class="{ active: route.name === item.name }"
                  @click="mobileMenuOpen = false"
                >
                  <AppIcon :name="item.icon" :size="17" />
                  <span class="bv-nav-item__label">{{ item.label }}</span>
                  <span
                    v-if="item.badge"
                    class="bv-nav-item__badge"
                    :class="item.badgeTone && `is-${item.badgeTone}`"
                  >{{ item.badge }}</span>
                </router-link>
              </nav>

              <div class="bv-mobile-drop__foot">
                <div class="bv-user">
                  <div class="bv-avatar">{{ userInitials }}</div>
                  <span class="bv-user-email">{{ userEmail }}</span>
                </div>
                <div class="bv-footer-actions">
                  <button class="bv-icon-btn" :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'" @click="toggleTheme">
                    <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
                  </button>
                  <button class="bv-icon-btn" title="Sign out" @click="handleSignOut">
                    <AppIcon name="logout" :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <router-view />
      </v-main>
    </template>

    <!-- Global toast — driven by useFeedback() composable -->
    <AppSnackbar />
  </v-app>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from './stores/authStore'
import { useCustomerStore } from './stores/customerStore'
import { useTheme } from './composables/useTheme'
import { isOverdue } from './utils/followUp'
import AppIcon from './components/base/AppIcon.vue'
import AppSnackbar from './components/base/AppSnackbar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const customerStore = useCustomerStore()
const { mobile } = useDisplay()

const { theme, toggleTheme } = useTheme()

// ── Drawer (desktop) + mobile menu ──────────────────────────────────────────
const drawerOpen = ref(!mobile.value)
const mobileMenuOpen = ref(false)
watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile
  if (!isMobile) mobileMenuOpen.value = false
})
// Close mobile menu on any route change
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })

// ── Collapsed (desktop rail) ────────────────────────────────────────────────
// Persisted to localStorage so it survives navigation + refresh.
const SIDEBAR_COLLAPSED_KEY = 'bv.sidebar.collapsed'
const collapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
watch(collapsed, (v) => {
  try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? '1' : '0') } catch { /* ignore */ }
})

const isLoginPage = computed(() => route.name === 'login')

const brandTitle = computed(() => {
  if (mobile.value) return 'Bold Vision'
  return collapsed.value ? 'Expand sidebar' : 'Collapse sidebar'
})

function onBrandClick() {
  if (mobile.value) return         // logo is decorative on mobile (drawer toggles via burger)
  collapsed.value = !collapsed.value
}

// ── Overdue count (drives the Follow-ups badge) ─────────────────────────────
// Make sure customers are loaded so the badge is accurate everywhere.
onMounted(() => {
  if (authStore.user && !customerStore.loaded) customerStore.fetchCustomers()
})
watch(() => authStore.user, (u) => {
  if (u && !customerStore.loaded) customerStore.fetchCustomers()
})

const overdueCount = computed(() => {
  const today = new Date()
  return customerStore.customers.filter((c) => isOverdue(c, today)).length
})

const navItems = computed(() => [
  { name: 'home',       label: 'Dashboard',  icon: 'grid' },
  { name: 'properties', label: 'Properties', icon: 'house' },
  { name: 'customers',  label: 'Customers',  icon: 'users' },
  {
    name: 'follow-ups', label: 'Follow-ups', icon: 'calendar',
    badge: overdueCount.value > 0 ? overdueCount.value : null,
    badgeTone: 'hot',
  },
])

const userEmail = computed(() => authStore.user?.email ?? '')
const userInitials = computed(() => {
  const e = userEmail.value
  if (!e) return '?'
  const parts = e.split('@')[0].split(/[._-]/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : e.slice(0, 2).toUpperCase()
})

async function handleSignOut() {
  await authStore.signOut()
  router.push({ name: 'login' })
}
</script>

<style>
/* Sidebar shell */
.bv-sidebar .v-navigation-drawer__content { overflow: hidden; }

.bv-sidebar__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

/* Brand */
.bv-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  min-height: 70px;
}
.bv-brand-mark {
  width: 34px; height: 34px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--text-on-accent);
  display: grid; place-items: center;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  transition: transform .12s, box-shadow .12s, background .12s;
}
.bv-brand-mark:hover {
  background: var(--accent-hover, var(--accent));
  transform: scale(1.05);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.bv-brand-mark:active { transform: scale(0.98); }
.bv-brand-name {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--text);
  flex: 1;
  min-width: 0;
}

/* Section label */
.bv-sidebar__section-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 8px 16px 4px;
}

/* Nav */
.bv-sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 10px 12px;
  overflow-y: auto;
}
.bv-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--r-md);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  position: relative;
  transition: background .1s, color .1s;
}
.bv-nav-item:hover { background: var(--surface-2); color: var(--text); }
.bv-nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: 600;
}
.bv-nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}
.bv-nav-item__label {
  flex: 1;
  min-width: 0;
}
.bv-nav-item__badge {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--surface-sunk);
  color: var(--text-muted);
}
.bv-nav-item__badge.is-hot {
  background: var(--hot);
  color: var(--text-on-accent, white);
}
.bv-nav-item.active .bv-nav-item__badge.is-hot {
  /* Already-active item keeps the hot tone — stands out against accent bg */
}

/* Collapsed (rail) state — center icons, hide labels (handled by v-if) */
.bv-sidebar--collapsed .bv-sidebar__brand {
  justify-content: center;
  padding: 20px 8px 16px;
}
.bv-sidebar--collapsed .bv-sidebar__nav {
  padding: 4px 8px 12px;
}
.bv-sidebar--collapsed .bv-nav-item {
  justify-content: center;
  padding: 0;
  gap: 0;
}
.bv-sidebar--collapsed .bv-nav-item.active::before {
  display: none;   /* rail shows active via background only */
}
.bv-sidebar--collapsed .bv-nav-item__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 9.5px;
  border: 2px solid var(--surface);
}
.bv-sidebar--collapsed .bv-sidebar__footer {
  justify-content: center;
  padding: 12px 8px 16px;
}

/* Footer */
.bv-sidebar__footer {
  padding: 12px 14px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}
.bv-user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.bv-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-ink);
  display: grid; place-items: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.bv-user-email {
  font-size: 11.5px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bv-footer-actions { display: flex; gap: 4px; }
.bv-icon-btn {
  display: inline-grid; place-items: center;
  width: 30px; height: 30px;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background .1s, color .1s;
}
.bv-icon-btn:hover { background: var(--surface-2); color: var(--text); }

/* Main content */
.bv-main { background: var(--bg); }
.bv-main .v-main__wrap { display: flex; flex-direction: column; }

/* Mobile top bar + dropdown ──────────────────────────────
   Replaces the slide-out drawer on phone viewports. The bar sits
   sticky at the top; tapping the toggle slides the menu panel
   down from below the bar with a scrim behind. */
.bv-mobile-bar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.bv-mobile-bar__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--text);
}
.bv-brand-mark--static {
  width: 30px; height: 30px;
  cursor: default;
}
.bv-brand-mark--static:hover {
  transform: none;
  box-shadow: none;
  background: var(--accent);
}
.bv-mobile-bar__toggle { width: 36px; height: 36px; }

.bv-mobile-scrim {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--bg) 60%, black);
  opacity: 0.55;
  z-index: 10;
}

.bv-mobile-drop {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  z-index: 11;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  padding: 8px 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(100vh - 56px);
  overflow-y: auto;
}
.bv-mobile-drop__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 0 8px;
}
.bv-mobile-drop__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 8px 4px;
  border-top: 1px solid var(--border);
  margin-top: 6px;
}

/* Slide-down transition */
.bv-drop-enter-active, .bv-drop-leave-active {
  transition: transform .22s cubic-bezier(.2,.7,.2,1), opacity .15s;
}
.bv-drop-enter-from, .bv-drop-leave-to {
  transform: translateY(-12px);
  opacity: 0;
}

.bv-scrim-enter-active, .bv-scrim-leave-active { transition: opacity .15s; }
.bv-scrim-enter-from, .bv-scrim-leave-to { opacity: 0; }

/* Loading */
.bv-loading {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
</style>
