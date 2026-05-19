const DAY_MS = 24 * 60 * 60 * 1000

export const heatOrder = { Hot: 0, Warm: 1, Cold: 2 }

export function computeBadge(listedAtIso, status) {
  if (status === 'Sold')               return { type: 'sold',               label: 'Sold',               color: 'grey-darken-1' }
  if (status === 'Under Contract')     return { type: 'under_contract',     label: 'Under contract',     color: 'amber-darken-2' }
  if (status === 'Off Market')         return { type: 'off_market',         label: 'Off market',         color: 'grey' }
  if (status === 'Withdrawn')          return { type: 'withdrawn',          label: 'Withdrawn',          color: 'red-darken-2' }
  if (status === 'Coming Soon')        return { type: 'coming_soon',        label: 'Coming soon',        color: 'orange-darken-1' }
  if (status === 'Under Construction') return { type: 'under_construction', label: 'Under construction', color: 'orange-darken-1' }
  if (status === 'Ready Built')        return { type: 'ready_built',        label: 'Ready built',        color: 'green-darken-2' }
  // On Market — show NEW badge if listed within last 7 days
  const listedAt = new Date(listedAtIso)
  const isNew = Date.now() - listedAt.getTime() <= 7 * DAY_MS
  return isNew ? { type: 'new', label: 'New', color: 'green-darken-2' } : null
}

export function statusToClass(status) {
  const map = {
    'On Market':          'on-market',
    'Coming Soon':        'coming-soon',
    'Under Construction': 'under-construction',
    'Ready Built':        'ready-built',
    'Under Contract':     'under-contract',
    'Sold':               'sold',
    'Off Market':         'off-market',
    'Withdrawn':          'withdrawn',
  }
  return map[status] ?? 'off-market'
}

export function sortByInterestLevel(list) {
  return [...list].sort((a, b) => heatOrder[a.interestLevel] - heatOrder[b.interestLevel])
}
