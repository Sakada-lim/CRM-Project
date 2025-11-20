<template>
  <div class="filter-bar">
    <div class="chip-container">
      <template v-if="modelValue.length">
        <v-chip
          v-for="filter in modelValue"
          :key="filter.id"
          class="filter-chip"
          closable
          size="large"
          variant="tonal"
          color="primary"
          @click:close="removeFilter(filter.id)"
        >
          <template v-if="filter.labelParts">
            <span class="chip-field">{{ getFieldLabel(filter) }}</span>
            <span class="chip-operator">{{ getOperatorLabel(filter) }}</span>
            <span class="chip-value">{{ getValueLabel(filter) }}</span>
          </template>
          <template v-else>
            {{ filter.label }}
          </template>
        </v-chip>
      </template>

      <v-menu v-model="menu" :close-on-content-click="false" transition="fade-transition">
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            class="add-filter-btn"
            variant="tonal"
            color="primary"
            size="small"
            :disabled="!filterItems.length"
            @click="prepareMenu"
          >
            <v-icon size="18" class="mr-1">mdi-plus</v-icon>
            Add Filter
          </v-btn>
        </template>

        <v-card min-width="280">
          <v-card-text class="d-flex flex-column gap-3">
            <v-select
              v-model="draft.key"
              :items="filterItems"
              item-title="label"
              item-value="key"
              label="Filter type"
              density="comfortable"
            />

            <v-select
              v-if="operatorItems.length"
              v-model="draft.operator"
              :items="operatorItems"
              item-title="label"
              item-value="value"
              label="Condition"
              density="comfortable"
            />

            <v-select
              v-if="activeFilterDef?.type === 'select'"
              v-model="draft.value"
              :items="activeFilterDef?.options || []"
              item-title="title"
              item-value="value"
              label="Value"
              density="comfortable"
            />

            <v-text-field v-else v-model="draft.value" label="Value" density="comfortable" />
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn variant="text" class="text-capitalize" @click="closeMenu">Cancel</v-btn>
            <v-btn color="primary" class="text-capitalize" @click="addFilter">Apply</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  availableFilters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const menu = ref(false)

const selectedKeys = computed(() => props.modelValue.map((filter) => filter.key))

const filterItems = computed(() =>
  (props.availableFilters || []).filter(
    (filter) => filter.allowMultiple || !selectedKeys.value.includes(filter.key),
  ),
)
const draft = reactive({ key: '', operator: '', value: '' })

const activeFilterDef = computed(() => filterItems.value.find((item) => item.key === draft.key))
const operatorItems = computed(() => activeFilterDef.value?.operators ?? [])

watch(
  filterItems,
  (items) => {
    if (!items.length) {
      draft.key = ''
      draft.operator = ''
      draft.value = ''
      return
    }
    if (!items.find((item) => item.key === draft.key)) {
      draft.key = items[0].key
      draft.operator = ''
      draft.value = ''
    }
  },
  { immediate: true },
)

watch(
  operatorItems,
  (ops) => {
    if (!ops.length) {
      draft.operator = ''
      return
    }
    if (!ops.find((op) => op.value === draft.operator)) {
      draft.operator = ops[0].value
    }
  },
  { immediate: true },
)

watch(
  activeFilterDef,
  (def) => {
    if (!def) {
      draft.value = ''
      return
    }
    if (def.type === 'select') {
      const firstOption = def.options?.[0]
      if (firstOption && !def.options.some((opt) => opt.value === draft.value)) {
        draft.value = firstOption.value
      }
    }
  },
  { immediate: true },
)

function prepareMenu() {
  if (!filterItems.value.length) {
    menu.value = false
    return
  }
  if (!draft.key) {
    draft.key = filterItems.value[0].key
  }
  if (!draft.operator && operatorItems.value.length) {
    draft.operator = operatorItems.value[0].value
  }
  menu.value = true
}

function closeMenu() {
  menu.value = false
}

function addFilter() {
  const def = activeFilterDef.value
  if (!def) return

  if (operatorItems.value.length && !draft.operator) {
    return
  }

  if (def.type === 'select' && !draft.value) {
    return
  }

  if (!def.allowMultiple && props.modelValue.some((filter) => filter.key === def.key)) {
    menu.value = false
    return
  }

  const duplicate = props.modelValue.some(
    (filter) =>
      filter.key === def.key &&
      filter.value === draft.value &&
      filter.operator === (draft.operator || 'is'),
  )
  if (duplicate) {
    menu.value = false
    return
  }

  const optionLabel =
    def.type === 'select'
      ? (def.options?.find((opt) => opt.value === draft.value)?.title ?? draft.value)
      : draft.value

  if (!optionLabel) {
    return
  }

  const operatorValue = operatorItems.value.length ? draft.operator : 'is'
  const operatorLabel =
    operatorItems.value.find((op) => op.value === operatorValue)?.label || operatorValue || 'is'

  const labelParts = {
    field: def.label,
    operator: operatorLabel,
    value: optionLabel,
  }

  const newFilter = {
    id: `${def.key}-${operatorValue}-${draft.value}-${Date.now()}`,
    key: def.key,
    operator: operatorValue,
    value: draft.value,
    label: `${def.label} ${operatorLabel} ${optionLabel}`,
    labelParts,
  }

  emit('update:modelValue', [...props.modelValue, newFilter])
  menu.value = false
}

function removeFilter(id) {
  emit(
    'update:modelValue',
    props.modelValue.filter((filter) => filter.id !== id),
  )
}

function getFieldLabel(filter) {
  return filter.labelParts?.field || filter.label
}

function getOperatorLabel(filter) {
  return filter.labelParts?.operator || ''
}

function getValueLabel(filter) {
  return filter.labelParts?.value || filter.value || ''
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-chip {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary)) !important;
  padding-inline: 16px;
  height: 44px;
}

.chip-field,
.chip-value {
  color: rgb(var(--v-theme-primary));
}

.chip-operator {
  color: #94a3b8;
  margin-inline: 6px;
}

.add-filter-btn {
  height: 36px;
}
</style>
