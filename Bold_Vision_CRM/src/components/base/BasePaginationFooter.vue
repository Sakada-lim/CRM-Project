<template>
  <div class="bv-pagination" v-bind="$attrs">
    <span class="meta">{{ label }}</span>
    <div class="pages">
      <button
        class="bv-page-btn"
        :disabled="internalPage <= 1"
        aria-label="Previous page"
        @click="internalPage--"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        v-for="n in visiblePages"
        :key="n"
        class="bv-page-btn"
        :class="{ active: n === internalPage }"
        @click="internalPage = n"
      >
        {{ n }}
      </button>

      <button
        class="bv-page-btn"
        :disabled="internalPage >= length"
        aria-label="Next page"
        @click="internalPage++"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  length:     { type: Number, required: true },
  label:      { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const clamp = (v) => Math.min(Math.max(Number(v) || 1, 1), Math.max(props.length || 1, 1))

const internalPage = computed({
  get: () => clamp(props.modelValue),
  set: (v) => emit('update:modelValue', clamp(v)),
})

watch(() => props.length, () => {
  const c = clamp(props.modelValue)
  if (c !== props.modelValue) emit('update:modelValue', c)
})

const visiblePages = computed(() => {
  const total = Math.max(props.length || 1, 1)
  const cur   = internalPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  // Always show first, last, current ±1, and ellipsis placeholders
  const pages = new Set([1, total, cur, cur - 1, cur + 1].filter((n) => n >= 1 && n <= total))
  return [...pages].sort((a, b) => a - b)
})
</script>
