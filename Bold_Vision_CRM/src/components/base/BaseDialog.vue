<template>
  <v-dialog
    v-model="internalModel"
    :max-width="maxWidth"
    :persistent="persistent"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6">{{ title }}</span>

        <v-btn icon variant="text" @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- form / content goes here -->
        <slot />
      </v-card-text>
      
      <v-card-actions class="justify-end mb-4 mr-4">
        <!-- allow overriding actions if needed -->
        <slot name="actions">
          <v-btn
            variant="outlined"
            color="grey-darken-1"
            class="mr-2"
            @click="onCancel"
          >
            {{ cancelText }}
          </v-btn>

          <v-btn :color="confirmColor" variant="flat" @click="onConfirm">
            {{ confirmText }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  maxWidth: { type: [Number, String], default: 640 },
  persistent: { type: Boolean, default: false },
  cancelText: { type: String, default: 'Cancel' },
  confirmText: { type: String, default: 'Save' },
  confirmColor: { type: String, default: 'primary' },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const internalModel = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    internalModel.value = val;
  },
);

watch(internalModel, (val) => {
  emit('update:modelValue', val);
});

function onCancel() {
  internalModel.value = false;
  emit('cancel');
}

function onConfirm() {
  emit('confirm');
}
</script>
