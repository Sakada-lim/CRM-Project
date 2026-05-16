<template>
  <v-dialog
    v-model="internalModel"
    :max-width="maxWidth"
    :persistent="persistent"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="filter-dialog-card">
      <header class="dialog-header">
        <h2 class="dialog-title">{{ title }}</h2>
        <v-btn icon variant="text" density="comfortable" class="dialog-close" @click="onCancel">
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </header>

      <div class="dialog-body" tabindex="-1">
        <slot />
      </div>

      <footer class="dialog-footer">
        <slot name="actions">
          <div style="flex:1" />
          <button class="btn btn-ghost" @click="onCancel">{{ cancelText }}</button>
          <button class="btn btn-primary" @click="onConfirm">{{ confirmText }}</button>
        </slot>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue:   { type: Boolean, required: true },
  title:        { type: String,  default: '' },
  maxWidth:     { type: [Number, String], default: 600 },
  persistent:   { type: Boolean, default: false },
  cancelText:   { type: String,  default: 'Cancel' },
  confirmText:  { type: String,  default: 'Save' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const internalModel = ref(props.modelValue)
watch(() => props.modelValue, (val) => { internalModel.value = val })
watch(internalModel, (val) => { emit('update:modelValue', val) })

function onCancel()  { internalModel.value = false; emit('cancel') }
function onConfirm() { emit('confirm') }
</script>

<style scoped src="../../assets/styles/components/filterDialog.css"></style>
