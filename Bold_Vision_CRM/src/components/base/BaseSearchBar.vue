<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :hide-details="hideDetails"
    :autofocus="autofocus"
    density="comfortable"
    variant="outlined"
    clearable
    color="primary"
    prepend-inner-icon="mdi-magnify"
    @update:model-value="handleInput"
    @click:clear="handleClear"
  />
</template>

<script setup>
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

function handleInput(value) {
  emit('update:modelValue', value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>
