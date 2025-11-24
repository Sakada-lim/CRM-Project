// Centralized filter configurations reused across views
export const propertyFilterDefinitions = [
  {
    key: 'status',
    label: 'Status',
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
