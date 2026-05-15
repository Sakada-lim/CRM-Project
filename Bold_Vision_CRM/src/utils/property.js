const DAY_MS = 24 * 60 * 60 * 1000

export const heatOrder = { Hot: 0, Warm: 1, Cold: 2 }

export function computeBadge(listedAtIso, status) {
  if (status === 'Sold') return { type: 'sold', label: 'Sold', color: 'grey-darken-1' }
  if (status === 'Under Offer')
    return { type: 'under_offer', label: 'Under offer', color: 'amber-darken-2' }
  const listedAt = new Date(listedAtIso)
  const isNew = Date.now() - listedAt.getTime() <= 5 * DAY_MS
  return isNew ? { type: 'new', label: 'New', color: 'green-darken-2' } : null
}

export function sortByInterestLevel(list) {
  return [...list].sort((a, b) => heatOrder[a.interestLevel] - heatOrder[b.interestLevel])
}
