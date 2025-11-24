<template>
  <v-app class="bv-app-shell">
    <v-navigation-drawer
      v-model="drawerOpen"
      class="bv-drawer"
      :width="drawerWidth"
      :scrim="false"
      floating
      elevation="0"
    >
      <div class="bv-drawer__body">
        <div class="bv-drawer__brand">
          <div class="brand-mark">BV</div>
          <div class="brand-text">
            <p class="brand-name">Bold Vision</p>
            <p class="brand-tagline">Customer Hub</p>
          </div>
          <v-btn icon variant="text" color="primary" class="brand-toggle" @click="toggleDrawer">
            <v-icon>{{ drawerOpen ? 'mdi-chevron-double-left' : 'mdi-menu-open' }}</v-icon>
          </v-btn>
        </div>

        <v-divider class="my-6" />

        <v-list nav density="comfortable" class="bv-drawer__list">
          <v-list-item
            :to="{ name: 'customers' }"
            prepend-icon="mdi-account-group"
            title="Customers"
            rounded="lg"
          />
          <v-list-item
            :to="{ name: 'properties' }"
            prepend-icon="mdi-home-city"
            title="Properties"
            rounded="lg"
          />
        </v-list>
      </div>
    </v-navigation-drawer>

    <v-main class="bv-main">
      <div class="bv-content">
        <div class="bv-content__header">
          <div class="bv-content__left">
            <v-btn
              v-if="!drawerOpen"
              icon="mdi-menu"
              variant="tonal"
              color="primary"
              class="collapse-toggle"
              @click="toggleDrawer"
            />
          </div>
          <div class="bv-content__actions">
            <v-btn icon variant="tonal" color="primary" class="lang-btn">
              <v-icon>mdi-earth</v-icon>
            </v-btn>
            <v-avatar size="44" class="profile-chip" color="primary" variant="tonal">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </div>
        </div>
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref } from 'vue'

const drawerOpen = ref(true)
const drawerWidth = computed(() => 320)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}
</script>


