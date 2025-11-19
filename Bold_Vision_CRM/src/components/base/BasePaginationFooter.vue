<template>
  <div class="pagination-footer" v-bind="$attrs">
    <span v-if="label" class="pagination-label">{{ label }}</span>
    <v-pagination
      v-model="internalPage"
      :length="length"
      :total-visible="totalVisible"
      :density="density"
      class="pagination-control"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  length: {
    type: Number,
    required: true,
  },
  totalVisible: {
    type: Number,
    default: 5,
  },
  density: {
    type: String,
    default: 'comfortable',
  },
  label: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const clampValue = (value) => {
  const parsed = Number(value) || 1
  const upperBound = Math.max(props.length || 1, 1)
  if (parsed < 1) return 1
  if (parsed > upperBound) return upperBound
  return parsed
}

const internalPage = computed({
  get() {
    return clampValue(props.modelValue)
  },
  set(value) {
    emit('update:modelValue', clampValue(value))
  },
})

watch(
  () => props.length,
  () => {
    const clamped = clampValue(props.modelValue)
    if (clamped !== props.modelValue) {
      emit('update:modelValue', clamped)
    }
  },
)
</script>

<style scoped>
.pagination-footer {
  --pagination-padding: 0 clamp(16px, 4vw, 40px);
  --pagination-gap: 12px;
  --pagination-margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--pagination-gap);
  padding: var(--pagination-padding);
  margin-top: var(--pagination-margin-top);
}

.pagination-label {
  font-size: 0.9rem;
  color: rgba(15, 23, 42, 0.7);
}

.pagination-control {
  margin-left: auto;
}

.pagination-control :deep(.v-pagination__item) {
  background-color: #ede9fe;
  color: #5b21b6;
  border-radius: 10px;
}

.pagination-control :deep(.v-pagination__item--active) {
  background-color: #5b21b6;
  color: white;
}

@media (max-width: 640px) {
  .pagination-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-control {
    margin-left: 0;
  }
}
</style>
