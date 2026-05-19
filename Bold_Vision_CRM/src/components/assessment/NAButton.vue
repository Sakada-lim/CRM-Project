<template>
  <button
    type="button"
    class="afm-na-btn"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    :title="active ? 'Marked Not Applicable — click to undo' : 'Mark not applicable'"
    @click.stop="$emit('toggle')"
  >N/A</button>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
})
defineEmits(['toggle'])
</script>
