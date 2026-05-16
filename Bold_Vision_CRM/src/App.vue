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
      <v-navigation-drawer
        v-model="drawerOpen"
        class="bv-sidebar"
        :width="240"
        :scrim="true"
        floating
        elevation="0"
      >
        <div class="bv-sidebar__inner">
          <!-- Brand -->
          <div class="bv-sidebar__brand">
            <div class="bv-brand-mark">
              <AppIcon name="house" :size="18" />
            </div>
            <span class="bv-brand-name">Bold Vision</span>
          </div>

          <!-- Nav -->
          <nav class="bv-sidebar__nav">
            <router-link
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="bv-nav-item"
              :class="{ active: route.name === item.name }"
            >
              <AppIcon :name="item.icon" :size="17" />
              <span>{{ item.label }}</span>
            </router-link>
          </nav>

          <!-- Footer -->
          <div class="bv-sidebar__footer">
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
      </v-navigation-drawer>

      <v-main class="bv-main">
        <!-- Mobile top bar — visible when drawer is closed -->
        <div v-if="!drawerOpen" class="bv-topbar">
          <button class="bv-icon-btn" @click="drawerOpen = true">
            <AppIcon name="menu" :size="20" />
          </button>
          <span class="bv-topbar-brand">Bold Vision</span>
        </div>
        <router-view />
      </v-main>
    </template>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from './stores/authStore'
import { useTheme } from './composables/useTheme'
import AppIcon from './components/base/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { mobile } = useDisplay()

const { theme, toggleTheme } = useTheme()

const drawerOpen = ref(!mobile.value)

// Auto-open sidebar when viewport grows to desktop; auto-close on mobile
watch(mobile, (isMobile) => { drawerOpen.value = !isMobile })
const isLoginPage = computed(() => route.name === 'login')

const navItems = [
  { name: 'home',       label: 'Dashboard',  icon: 'grid' },
  { name: 'properties', label: 'Properties', icon: 'house' },
  { name: 'customers',  label: 'Customers',  icon: 'users' },
  { name: 'follow-ups', label: 'Follow-ups', icon: 'calendar' },
]

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
}
.bv-brand-mark {
  width: 34px; height: 34px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--text-on-accent);
  display: grid; place-items: center;
  flex-shrink: 0;
}
.bv-brand-name {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--text);
}

/* Nav */
.bv-sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px;
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

/* Mobile topbar */
.bv-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.bv-topbar-brand {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--text);
}

/* Loading */
.bv-loading {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
</style>
