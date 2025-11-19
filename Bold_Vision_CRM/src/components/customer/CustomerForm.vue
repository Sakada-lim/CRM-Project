<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-text-field v-model="form.name" label="Customer name" required />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field v-model="form.phone" label="Phone" required />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field v-model="form.email" label="Email" />
    </v-col>

    <v-col cols="12" md="4">
      <v-select
        v-model="form.channel"
        :items="['Call', 'SMS']"
        label="Enquiry channel"
        required
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-select
        v-model="form.category"
        :items="['Cold', 'Warm', 'Hot']"
        label="Willingness to buy"
        required
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="form.interestedProperty"
        label="Property of interest"
        hint="e.g. 123 Smith St, or general area"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="form.notes"
        label="Notes from call/SMS"
        rows="2"
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

    // bridge prop <-> v-model in this component
    const form = computed({
    get() {
        return props.modelValue;
    },
    set(val) {
        emit('update:modelValue', val);
    },
    });
</script>
