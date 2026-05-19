<template>
  <v-snackbar
    v-model="state.show"
    :color="state.color"
    :timeout="state.timeout"
    location="top"
    multi-line
  >
    {{ state.text }}
    <template #actions>
      <button type="button" class="app-snackbar__close" @click="dismiss" aria-label="Dismiss">
        <AppIcon name="x" :size="14" />
      </button>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useFeedback } from '../../composables/useFeedback'
import AppIcon from './AppIcon.vue'

const { state, dismiss } = useFeedback()
</script>

<style scoped>
.app-snackbar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  border: none;
  cursor: pointer;
  opacity: 0.85;
  transition: background 0.12s, opacity 0.12s;
}
.app-snackbar__close:hover {
  background: oklch(100% 0 0 / 0.15);
  opacity: 1;
}
</style>
