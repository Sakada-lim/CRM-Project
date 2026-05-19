// Centralized filter configurations reused across views.
// Property option values derive from src/constants/enums.js — single source of truth.

import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../constants/enums'

const toOption = (v) => ({ title: v, value: v })

export const propertyFilterDefinitions = [
  {
    key: 'status',
    label: 'Status',
    allLabel: 'All statuses',
    type: 'select',
    allowMultiple: false,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: PROPERTY_STATUSES.map(toOption),
  },
  {
    key: 'type',
    label: 'Type',
    allLabel: 'All types',
    type: 'select',
    allowMultiple: true,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: PROPERTY_TYPES.map(toOption),
  },
]

export const customerFilterDefinitions = [
  {
    key: 'category',
    label: 'Category',
    allLabel: 'All categories',
    type: 'select',
    allowMultiple: true,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: [
      { title: 'Hot', value: 'Hot' },
      { title: 'Warm', value: 'Warm' },
      { title: 'Cold', value: 'Cold' },
    ],
  },
  {
    key: 'channel',
    label: 'Channel',
    allLabel: 'All channels',
    type: 'select',
    allowMultiple: true,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: [
      { title: 'Call', value: 'Call' },
      { title: 'Telegram', value: 'Telegram' },
      { title: 'SMS', value: 'SMS' },
      { title: 'Email', value: 'Email' },
    ],
  },
]
