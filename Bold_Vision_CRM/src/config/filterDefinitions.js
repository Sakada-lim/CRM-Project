// Centralized filter configurations reused across views
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
    options: [
      { title: 'On Market', value: 'On Market' },
      { title: 'Under Offer', value: 'Under Offer' },
      { title: 'Sold', value: 'Sold' },
    ],
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
    options: [
      { title: 'House', value: 'House' },
      { title: 'Townhouse', value: 'Townhouse' },
      { title: 'Apartment', value: 'Apartment' },
      { title: 'Villa', value: 'Villa' },
    ],
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
      { title: 'SMS', value: 'SMS' },
      { title: 'Email', value: 'Email' },
    ],
  },
]
