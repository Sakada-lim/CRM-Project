// Single source of truth for property + customer enums.
// Order matters — UI components render values in this order.

export const PROPERTY_TYPES = [
  'House',
  'Townhouse',
  'Apartment',
  'Villa',
  'Unit',
  'Duplex',
  'Studio',
  'Penthouse',
  'Land',
  'Acreage / Rural',
  'Granny Flat',
  'Retirement Living',
  'NDIS SDA Home',
  'Off-the-Plan',
  'House and Land Package',
  '10/90 One-Part Contract',
]

export const PROPERTY_STATUSES = [
  'On Market',
  'Coming Soon',
  'Under Construction',
  'Ready Built',
  'Under Contract',
  'Sold',
  'Off Market',
  'Withdrawn',
]

export const CUSTOMER_CATEGORIES = ['Cold', 'Warm', 'Hot']
export const CUSTOMER_CHANNELS = ['Call', 'Telegram', 'SMS', 'Email']
export const INTEREST_LEVELS = ['Cold', 'Warm', 'Hot']
