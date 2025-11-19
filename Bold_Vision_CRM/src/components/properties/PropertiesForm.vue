<template>
  <v-row dense>
    <v-col cols="12" md="8">
      <v-text-field
        v-model="form.address"
        label="Address"
        required
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="form.code"
        label="Internal code"
        hint="e.g. PROP-001"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-select
        v-model="form.type"
        :items="['House', 'Unit', 'Townhouse', 'Land']"
        label="Type"
        required
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-select
        v-model="form.status"
        :items="['New', 'On Market', 'Sold']"
        label="Status"
        required
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="form.priceGuide"
        label="Price guide"
        hint="e.g. $850k–$900k"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="form.description"
        label="Public description"
        rows="3"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="form.notes"
        label="Internal notes"
        rows="3"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const form = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});
</script>
