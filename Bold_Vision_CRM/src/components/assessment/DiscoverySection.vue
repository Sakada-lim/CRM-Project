<template>
  <section id="discovery" class="afm-section">
    <div class="head">
      <span class="num">6</span>
      <div style="flex:1;min-width:0">
        <h2>Discovery</h2>
        <div class="desc">Buying goals, concerns, and timing.</div>
      </div>
    </div>

    <div class="afm-discovery">
      <div v-for="q in QUESTIONS" :key="q.key" class="afm-q">
        <span class="qn">{{ q.n }}</span>
        <div class="body">
          <div class="q">{{ q.label }}</div>
          <div class="a">
            <!-- Yes / No -->
            <div v-if="q.kind === 'yesno'" class="seg-control">
              <button type="button"
                      :aria-pressed="getValue(q.key) === 'Yes'"
                      @click="setValue(q.key, 'Yes')">Yes</button>
              <button type="button"
                      :aria-pressed="getValue(q.key) === 'No'"
                      @click="setValue(q.key, 'No')">No</button>
            </div>

            <!-- Segmented options -->
            <div v-else-if="q.kind === 'seg'" class="seg-control">
              <button v-for="opt in q.options" :key="opt"
                      type="button"
                      :aria-pressed="getValue(q.key) === opt"
                      @click="setValue(q.key, opt)">{{ opt }}</button>
            </div>

            <!-- Budget min – max -->
            <div v-else-if="q.kind === 'range'" class="afm-q-range">
              <div class="input-affix">
                <span class="prefix">$</span>
                <input class="input has-prefix" type="text" placeholder="Min"
                       :value="getValue(q.minKey)"
                       @input="setValue(q.minKey, $event.target.value)" />
              </div>
              <span class="dash">–</span>
              <div class="input-affix">
                <span class="prefix">$</span>
                <input class="input has-prefix" type="text" placeholder="Max"
                       :value="getValue(q.maxKey)"
                       @input="setValue(q.maxKey, $event.target.value)" />
              </div>
            </div>

            <!-- Multi-line text -->
            <textarea v-else-if="q.kind === 'textarea'"
                      class="textarea"
                      :placeholder="q.placeholder"
                      style="min-height:70px"
                      :value="getValue(q.key)"
                      @input="setValue(q.key, $event.target.value)"></textarea>

            <!-- Single-line text (optionally with prefix) -->
            <div v-else-if="q.prefix" class="input-affix">
              <span class="prefix">
                <AppIcon v-if="q.prefix === 'pin'" name="pin" :size="13" />
                <template v-else>{{ q.prefix }}</template>
              </span>
              <input class="input has-prefix" type="text"
                     :placeholder="q.placeholder"
                     :value="getValue(q.key)"
                     @input="setValue(q.key, $event.target.value)" />
            </div>
            <input v-else
                   class="input" type="text"
                   :placeholder="q.placeholder"
                   :value="getValue(q.key)"
                   @input="setValue(q.key, $event.target.value)" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '../base/AppIcon.vue'

const QUESTIONS = [
  { n: 1,  key: 'q1_contactedBroker',     kind: 'yesno',
    label: 'Have you contacted with a broker or home loan specialist yet?' },
  { n: 2,  key: 'q2_lookingDuration',     kind: 'text',
    label: 'How long have you been looking for buying a property?', placeholder: 'e.g. 3 months' },
  { n: 3,  key: 'q3_buyTimeline',         kind: 'text',
    label: 'When do you want to buy a property?', placeholder: 'e.g. within 3 months' },
  { n: 4,  key: 'q4_talkedBuildersAgents', kind: 'yesno',
    label: 'Have you talked with any builders or real-estate agents?' },
  { n: 5,  key: 'q5_purpose',             kind: 'seg', options: ['Owner Occ', 'Investment'],
    label: "What's the purpose of your purchase?" },
  { n: 6,  key: 'q6_areaOfInterest',      kind: 'text', prefix: 'pin',
    label: 'Which area are you looking for?', placeholder: 'Suburbs of interest' },
  { n: 7,  kind: 'range', minKey: 'q7_budgetMin', maxKey: 'q7_budgetMax',
    label: "What's your budget?" },
  { n: 8,  key: 'q8_propertyType',        kind: 'text',
    label: 'What type of property are you looking for?', placeholder: 'House, townhouse, apartment…' },
  { n: 9,  key: 'q8b_minBedrooms',        kind: 'text',
    label: 'Minimum bedrooms?', placeholder: 'e.g. 3' },
  { n: 10, key: 'q9_requirements',        kind: 'textarea',
    label: 'What are your requirements for the property?',
    placeholder: 'Layout, features, school zone, etc.' },
  { n: 11, key: 'q10_landSize',           kind: 'text',
    label: 'What land size do you need?', placeholder: 'e.g. 400m²+' },
  { n: 12, key: 'q11_landTitledDate',     kind: 'text',
    label: 'Date for the land to be titled', placeholder: 'MM/YYYY' },
  { n: 13, key: 'q12_mostImportant',      kind: 'seg', options: ['Property', 'Location', 'Price'],
    label: "What's most important to you?" },
  { n: 14, key: 'q13_biggestConcern',     kind: 'textarea',
    label: "What's your biggest concern when buying a property?",
    placeholder: 'Their worries — finance, deposit, area, etc.' },
  { n: 15, key: 'q14_depositAmount',      kind: 'text', prefix: '$',
    label: 'How much deposit do you have?', placeholder: '0' },
]

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

function getValue(key) {
  return props.modelValue?.[key] ?? ''
}

function setValue(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style scoped>
.afm-q-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}
.afm-q-range .dash {
  font-size: 13px;
  color: var(--text-faint);
}
</style>
