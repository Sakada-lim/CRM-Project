<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>Bold Vision CRM</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer app permanent width="220" color="grey-lighten-3">
      <v-list nav dense>
        <v-list-item
          :to="{ name: 'customers' }"
          link
          prepend-icon="mdi-account-group"
          title="Customers"
        />
        <v-list-item
          :to="{ name: 'properties' }"
          link
          prepend-icon="mdi-home-city"
          title="Properties"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container class="py-6" >
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// no script needed yet
</script>
