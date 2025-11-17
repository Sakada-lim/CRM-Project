<template>
    <div>
        <v-row class="mb-4" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <h2>Customer Enquiries</h2>
        <p class="text-body-2">
          Log new callers/SMS enquiries and classify them as Cold, Warm, or Hot.
          Follow-up cadence is determined automatically.
        </p>
      </v-col>
    </v-row>

    <!-- New customer form -->
    <v-card class="mb-6" elevation="2">
      <v-card-title>New Enquiry</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
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

          <v-btn type="submit" color="primary" class="mt-3">
            Add enquiry
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    </div>
</template>
<script setup>
    import { ref } from 'vue';
    import { useCustomerStore } from '../stores/customerStore';

    const store = useCustomerStore();

    const form = ref({
        name: '',
        phone: '',
        email: '',
        channel: 'Call',
        category: 'Cold',
        interestedProperty: '',
        notes: '',
    });
    
    function handleSubmit() {
        if (!form.value.name || !form.value.phone || !form.value.category) {
            alert('Please fill in at least name, phone, and category.');
            return;
        }

        store.addCustomer({ ...form.value });

        form.value = {
            name: '',
            phone: '',
            email: '',
            channel: 'Call',
            category: 'Cold',
            interestedProperty: '',
            notes: '',
        };
    }
</script>