<template>
  <v-container fluid class="py-4">
    <!-- Breadcrumbs -->
    <v-breadcrumbs
      :items="breadcrumbs"
      class="mb-4"
    />

    <!-- Profile header -->
    <v-card
      class="mb-4"
      elevation="4"
      variant="outlined"
    >
      <v-card-text>
        <v-row class="align-center" no-gutters>
          <v-col cols="auto">
            <v-avatar size="56" color="primary">
              <span class="text-h5">
                {{ initials }}
              </span>
            </v-avatar>
          </v-col>

          <v-col class="pl-4">
            <div class="d-flex align-center flex-wrap">
              <h2 class="mr-3 mb-1">
                {{ editable.name || 'Customer details' }}
              </h2>
              <v-chip
                v-if="editable.category"
                :color="categoryColor(editable.category)"
                text-color="white"
                size="small"
                class="mr-2"
              >
                {{ editable.category }}
              </v-chip>
            </div>

            <div class="text-body-2 text-medium-emphasis">
              Last contact:
              <strong>{{ lastContactedLabel }}</strong>
              · Preferred:
              <strong>{{ editable.channel || 'N/A' }}</strong>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main layout -->
    <v-row>
      <!-- Left side: basic info + feedback log -->
      <v-col cols="12" md="8">
        <!-- Basic info card -->
        <v-card
          elevation="4"
          variant="outlined"
          class="mb-4"
        >
          <v-card-title>Basic information</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editable.name"
                  label="Name"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editable.phone"
                  label="Phone"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editable.email"
                  label="Email"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="editable.channel"
                  :items="['Call', 'SMS', 'Email', 'Telegram', 'WhatsApp']"
                  label="Preferred channel"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="editable.category"
                  :items="['Cold', 'Warm', 'Hot']"
                  label="Category"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editable.notes"
                  label="Internal notes"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              @click="saveChanges"
            >
              Save changes
            </v-btn>
            <v-btn
              variant="outlined"
              @click="resetChanges"
            >
              Reset
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Feedback / interaction timeline -->
        <v-card
          elevation="4"
          variant="outlined"
        >
          <v-card-title class="justify-space-between align-center">
            <span>Interaction history</span>
            <v-btn
              size="small"
              color="primary"
              variant="outlined"
              @click="addFeedback"
            >
              Add feedback
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- New feedback input (skeleton only) -->
            <v-textarea
              v-model="newFeedback"
              label="New feedback note"
              rows="2"
              class="mb-3"
              auto-grow
            />

            <v-divider class="mb-3" />

            <div v-if="feedbackEntries.length">
              <div
                v-for="entry in feedbackEntries"
                :key="entry.id"
                class="mb-3"
              >
                <div class="text-body-2 font-weight-medium">
                  {{ formatDate(entry.date) }}
                </div>
                <div class="text-body-2">
                  {{ entry.note }}
                </div>
                <v-divider class="mt-2" />
              </div>
            </div>
            <p
              v-else
              class="text-body-2 text-medium-emphasis"
            >
              No feedback recorded yet. Use “Add feedback” to log calls and notes.
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right side: follow-up / summary -->
      <v-col cols="12" md="4">
        <!-- Follow-up scheduler -->
        <v-card
          elevation="2"
          variant="outlined"
          class="mb-4"
        >
          <v-card-title>Follow-up schedule</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="editable.lastContactedAt"
              label="Last contacted (ISO or date string)"
              hint="Will be replaced with date picker later"
            />
            <v-btn
              size="small"
              variant="outlined"
              class="mb-4"
              @click="setLastContactToToday"
            >
              Set to today
            </v-btn>

            <v-select
              v-model="editable.followUpCadence"
              :items="[
                'Every 3 months (Hot)',
                'Every 6 months (Warm)',
                'Every 12 months (Cold)',
              ]"
              label="Follow-up cadence"
            />

            <p class="text-body-2 mt-3">
              In the full system this section will calculate the next contact
              date and feed into the “Customers to contact today” view.
            </p>
          </v-card-text>
        </v-card>

        <!-- Quick summary card -->
        <v-card
          elevation="2"
          variant="outlined"
        >
          <v-card-title>Quick summary</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-1">
              Category:
              <v-chip
                v-if="editable.category"
                :color="categoryColor(editable.category)"
                text-color="white"
                size="small"
              >
                {{ editable.category }}
              </v-chip>
            </p>

            <p class="text-body-2 mb-1">
              Last contacted:
              <strong>{{ lastContactedLabel }}</strong>
            </p>

            <p class="text-body-2 mb-1">
              Preferred channel:
              <strong>{{ editable.channel || 'N/A' }}</strong>
            </p>

            <p class="text-body-2">
              This summary will be used later to generate contact schedules and
              alerts for the team.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerStore } from '../stores/customerStore';

// routing + store
const route = useRoute();
const router = useRouter();
const store = useCustomerStore();

const id = Number(route.params.id);

// locate customer from store
const original = computed(() =>
  store.customers.find((c) => c.id === id),
);
const customerFound = computed(() => !!original.value);

// local editable copy (skeleton fields; adjust to match your store)
const editable = ref({
  id,
  name: '',
  phone: '',
  email: '',
  category: 'Cold',
  channel: 'Call',
  notes: '',
  lastContactedAt: '',
  followUpCadence: '',
});

// initialise from store if found
if (original.value) {
  editable.value = {
    ...editable.value,
    ...original.value,
  };
} else {
  // optional: redirect or show not-found later
}

// breadcrumbs
const breadcrumbs = computed(() => [
  { title: 'Existing customers', to: { name: 'customers-existing' } },
  { title: editable.value.name || 'Customer details', disabled: true },
]);

// profile initials
const initials = computed(() => {
  if (!editable.value.name) return '?';
  return editable.value.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
});

function categoryColor(category) {
  switch (category) {
    case 'Hot':
      return 'red';
    case 'Warm':
      return 'orange';
    default:
      return 'blue';
  }
}

function formatDate(isoOrString) {
  if (!isoOrString) return 'N/A';
  const d = new Date(isoOrString);
  if (Number.isNaN(d.getTime())) return isoOrString;
  return d.toLocaleDateString();
}

const lastContactedLabel = computed(() =>
  editable.value.lastContactedAt
    ? formatDate(editable.value.lastContactedAt)
    : 'Not set',
);

// simple skeleton feedback state
const feedbackEntries = ref([
  // TODO: later load from store; this is just demo data
  // { id: 1, date: '2025-11-14', note: 'Requested inspection this weekend.' },
]);

const newFeedback = ref('');

function addFeedback() {
  if (!newFeedback.value.trim()) return;
  feedbackEntries.value.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    note: newFeedback.value.trim(),
  });
  newFeedback.value = '';
}

function setLastContactToToday() {
  editable.value.lastContactedAt = new Date().toISOString();
}

function saveChanges() {
  if (!customerFound.value) return;
  // TODO: update your Pinia store here
  // store.updateCustomer(id, { ...editable.value });
  console.log('Saving (demo only):', editable.value);
}

function resetChanges() {
  if (!original.value) return;
  editable.value = {
    ...editable.value,
    ...original.value,
  };
}
</script>
