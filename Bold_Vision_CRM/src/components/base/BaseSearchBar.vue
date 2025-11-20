<template>
  <v-text-field
    :model-value="modelValue"
    :placeholder="inputPlaceholder"
    :hide-details="hideDetails"
    :autofocus="autofocus"
    density="comfortable"
    variant="outlined"
    clearable
    color="primary"
    class="SearchBar-control"
    prepend-inner-icon="mdi-magnify"
    @update:model-value="handleInput"
    @click:clear="handleClear"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Search',
  },
  placeholder: {
    type: String,
    default: 'Search by keyword',
  },
  hideDetails: {
    type: [Boolean, String],
    default: 'auto',
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const inputPlaceholder = computed(() => props.placeholder || props.label)

function handleInput(value) {
  emit('update:modelValue', value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.SearchBar-control :deep(.v-field) {
  border: none;
  box-shadow: none;
}

.SearchBar-control :deep(.v-field__outline) {
  display: none;
}

.SearchBar-control :deep(.v-field__input),
.SearchBar-control :deep(.v-field-label) {
  font-size: 1.125rem; /* roughly +2px */
}

.SearchBar-control :deep(.v-field__input) {
  padding-top: 13px;
  padding-bottom: 13px;
}

.SearchBar-control :deep(.v-field__prepend-inner .v-icon) {
  font-size: 26px;
}
</style>
