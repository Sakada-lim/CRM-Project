<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const ICONS = {
  phone:    ['M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L9 11a16 16 0 0 0 6 6l1.37-1.25a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92Z'],
  mail:     ['M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z', 'm3.5 6.5 8.5 6 8.5-6'],
  chat:     ['M21 12a8 8 0 0 1-12.4 6.7L3 20l1.3-5A8 8 0 1 1 21 12Z'],
  calendar: ['M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z', 'M4 9h16', 'M9 3.5v3', 'M15 3.5v3'],
  clock:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2'],
  house:    ['M3 11.5 12 4l9 7.5', 'M5 10v9.5A.5.5 0 0 0 5.5 20h13a.5.5 0 0 0 .5-.5V10'],
  pin:      ['M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z', 'M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
  check:    ['M5 12.5 9.5 17 19 7.5'],
  plus:     ['M12 5v14', 'M5 12h14'],
  x:        ['M6 6l12 12', 'M18 6 6 18'],
  chevron:  ['m9 6 6 6-6 6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  edit:     ['M4 20h4l10-10-4-4L4 16v4Z', 'm13.5 6.5 4 4'],
  sparkle:  ['M12 3.5 13.5 9 19 10.5 13.5 12 12 17.5 10.5 12 5 10.5 10.5 9 12 3.5Z'],
  sun:      ['M12 4V2', 'M12 22v-2', 'm4.9 4.9 1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm6.3 17.7-1.4 1.4', 'm19.1 4.9-1.4 1.4', 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z'],
  moon:     ['M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z'],
  bed:      ['M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7', 'M3 14h18', 'M7 9V7'],
  bath:     ['M4 12h16', 'M5 12v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4', 'M7 12V6a2 2 0 0 1 2-2'],
  car:      ['M5 17h14', 'M3 17v-4l2-5h14l2 5v4', 'M7 17v2', 'M17 17v2'],
  filter:   ['M3 5h18l-7 9v5l-4 2v-7L3 5Z'],
  more:     ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],
  eye:      ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  star:     ['m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6L12 17.3 6.6 20l1-6L3.3 9.9l6-.9L12 3.5Z'],
  globe:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M3 12h18', 'M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9Z'],
  user:     ['M4 20a8 8 0 1 1 16 0', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  menu:     ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  'arrow-right': ['M5 12h14', 'm13 6 6 6-6 6'],
  'arrow-left':  ['M19 12H5', 'm11 18-6-6 6-6'],
  users:    ['M16 20a6 6 0 1 0-12 0', 'M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M20 19a5 5 0 0 0-4-5', 'M15 4a4 4 0 0 1 0 8'],
  bell:     ['M6 8a6 6 0 1 1 12 0c0 4 1.5 6 2 7H4c.5-1 2-3 2-7Z', 'M10 19a2 2 0 0 0 4 0'],
  logout:   ['M10 18H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5', 'm16 16 4-4-4-4', 'M20 12H10'],
  search:   ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
  grid:     ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
}

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 1.6 },
})

const paths = computed(() => ICONS[props.name] ?? ['M12 12h.01'])
</script>
