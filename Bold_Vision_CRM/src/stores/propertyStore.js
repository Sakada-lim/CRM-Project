import { defineStore } from 'pinia'

const DAY_MS = 24 * 60 * 60 * 1000

const heroPhotos = [
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
  'https://images.pexels.com/photos/358636/pexels-photo-358636.jpeg',
  'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
  'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg',
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg',
  'https://images.pexels.com/photos/259950/pexels-photo-259950.jpeg',
  'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg',
]

const streetPool = [
  'Oxford St',
  'Smith Rd',
  'Victoria Ave',
  'Pacific Hwy',
  'Bridge St',
  'George St',
  'Queen Rd',
  'Park Lane',
  'Highland Dr',
  'Grove Rd',
]

const suburbPool = [
  'Blacktown',
  'Parramatta',
  'Surry Hills',
  'Cammeray',
  'Chatswood',
  'Randwick',
  'Newtown',
  'Leichhardt',
  'Wollongong',
  'Bondi',
]

const descriptionPool = [
  'Sunlit interiors with seamless indoor/outdoor connection and leafy outlooks.',
  'Designer finishes throughout with flexible floor plan and private courtyard.',
  'Low maintenance lifestyle moments from cafes, transport, and coastal walks.',
  'Family-friendly proportions with multiple living zones and a rear garden.',
]

const highlightPool = [
  'North-facing living zone',
  'Engineered oak floors',
  'Stone island kitchen',
  'Ducted air conditioning',
  'Oversized alfresco terrace',
  'Custom joinery and storage',
]

const customerNamePool = [
  'Alice Buyer',
  'Bob Watcher',
  'Charlie Stone',
  'Diana Rivers',
  'Ethan Vale',
  'Fiona Bright',
  'George Clive',
  'Hannah Frost',
  'Ian Hunter',
  'Jasmine Lee',
]

const heatOrder = { Hot: 0, Warm: 1, Cold: 2 }
const statusOptions = ['On Market', 'On Market', 'Under Offer', 'Sold']

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function computeBadge(listedAtIso, status) {
  if (status === 'Sold') {
    return { type: 'sold', label: 'Sold', color: 'grey-darken-1' }
  }

  if (status === 'Under Offer') {
    return { type: 'under_offer', label: 'Under offer', color: 'amber-darken-2' }
  }

  const listedAt = new Date(listedAtIso)
  const isNew = Date.now() - listedAt.getTime() <= 5 * DAY_MS
  return isNew ? { type: 'new', label: 'New', color: 'green-darken-2' } : null
}

function generateInterestedCustomers() {
  const total = randomInt(1, 4)
  const interestPool = ['Hot', 'Warm', 'Cold']
  const entries = Array.from({ length: total }).map(() => {
    const level = pickRandom(interestPool)
    const customerId = randomInt(1, 70)
    return {
      customerId,
      name: customerNamePool[customerId % customerNamePool.length],
      interestLevel: level,
      lastUpdated: new Date(Date.now() - randomInt(0, 30) * DAY_MS).toISOString(),
    }
  })
  return entries.sort((a, b) => heatOrder[a.interestLevel] - heatOrder[b.interestLevel])
}

function buildGallery(mainPhoto) {
  const shuffled = [...heroPhotos].sort(() => 0.5 - Math.random())
  const images = [mainPhoto, ...shuffled].filter((src, index, arr) => arr.indexOf(src) === index)
  return images.slice(0, 5)
}

function createProperty(index) {
  const id = index + 1
  const listedAtDate = new Date(Date.now() - randomInt(0, 30) * DAY_MS)
  let status = pickRandom(statusOptions)
  if (Date.now() - listedAtDate.getTime() <= 5 * DAY_MS) {
    status = 'On Market'
  }

  const bedrooms = randomInt(1, 5)
  const bathrooms = randomInt(1, Math.max(1, bedrooms - 1))
  const carSpaces = randomInt(0, 3)
  const suburb = pickRandom(suburbPool)
  const mainPhoto = heroPhotos[index % heroPhotos.length]
  const highlights = Array.from({ length: 3 }).map((_, idx) => highlightPool[(index + idx) % highlightPool.length])
  const minPrice = randomInt(55, 130) * 10
  const maxPrice = minPrice + randomInt(5, 20) * 10

  const timeline = {
    listedAt: listedAtDate.toISOString(),
    offerReceivedAt: null,
    soldAt: null,
  }

  if (status !== 'On Market') {
    const offerDate = new Date(listedAtDate.getTime() + randomInt(5, 20) * DAY_MS)
    timeline.offerReceivedAt = new Date(Math.min(Date.now(), offerDate.getTime())).toISOString()
    if (status === 'Sold') {
      const soldDate = new Date(offerDate.getTime() + randomInt(5, 25) * DAY_MS)
      timeline.soldAt = new Date(Math.min(Date.now(), soldDate.getTime())).toISOString()
    }
  }

  const statusUpdatedAtIso =
    status === 'Sold'
      ? timeline.soldAt ?? timeline.offerReceivedAt ?? timeline.listedAt
      : status === 'Under Offer'
        ? timeline.offerReceivedAt ?? timeline.listedAt
        : timeline.listedAt

  const property = {
    id,
    code: `PROP-${String(id).padStart(3, '0')}`,
    address: `${randomInt(12, 450)} ${pickRandom(streetPool)}, ${suburb}`,
    suburb,
    state: 'NSW',
    postcode: randomInt(2000, 2999),
    type: pickRandom(['House', 'Townhouse', 'Apartment', 'Villa']),
    priceGuide: `$${minPrice}k-$${maxPrice}k`,
    status,
    statusBadge: null,
    bedrooms,
    bathrooms,
    carSpaces,
    carparkSpaces: carSpaces,
    carparkType: carSpaces ? pickRandom(['Single garage', 'Double garage', 'Basement parking']) : 'Street parking',
    landSize: `${randomInt(120, 820)} sqm`,
    mainPhoto,
    gallery: buildGallery(mainPhoto),
    description: pickRandom(descriptionPool),
    highlights,
    amenities: ['Heating', 'Cooling', 'Dishwasher', 'Intercom'].slice(0, randomInt(2, 4)),
    createdAt: listedAtDate.toISOString(),
    listedAt: listedAtDate.toISOString(),
    statusUpdatedAt: statusUpdatedAtIso,
    statusTimeline: timeline,
    daysOnMarket: Math.max(
      1,
      Math.round(
        ((timeline.soldAt ? new Date(timeline.soldAt).getTime() : Date.now()) - listedAtDate.getTime()) /
          DAY_MS,
      ),
    ),
    interestedCustomers: generateInterestedCustomers(),
    notes: 'Auto-generated sample property.',
  }

  property.statusBadge = computeBadge(property.listedAt, property.status)
  return property
}

export const usePropertyStore = defineStore('properties', {
  state: () => ({
    properties: Array.from({ length: 30 }).map((_, idx) => createProperty(idx)),
  }),

  actions: {
    addProperty(payload = {}) {
      const id = Date.now()
      const listedAt = payload.listedAt ?? new Date().toISOString()
      const status = payload.status ?? 'On Market'
      const mainPhoto = payload.mainPhoto ?? heroPhotos[id % heroPhotos.length]
      const gallery = payload.gallery && payload.gallery.length ? payload.gallery : buildGallery(mainPhoto)

      this.properties.unshift({
        id,
        code: payload.code ?? `PROP-${id}`,
        createdAt: payload.createdAt ?? listedAt,
        listedAt,
        statusUpdatedAt: payload.statusUpdatedAt ?? listedAt,
        statusBadge: computeBadge(listedAt, status),
        mainPhoto,
        gallery,
        carSpaces: payload.carSpaces ?? 1,
        carparkSpaces: payload.carparkSpaces ?? payload.carSpaces ?? 1,
        interestedCustomers: payload.interestedCustomers ?? [],
        amenities: payload.amenities ?? [],
        highlights: payload.highlights ?? [],
        ...payload,
        status,
      })
    },
    updateProperty(id, updates) {
      const index = this.properties.findIndex((p) => p.id === id)
      if (index === -1) return

      const current = this.properties[index]
      const merged = {
        ...current,
        ...updates,
      }

      const listedAt = merged.listedAt ?? merged.createdAt
      merged.statusBadge = computeBadge(listedAt, merged.status)
      merged.gallery = updates.gallery ?? current.gallery ?? []
      merged.interestedCustomers = updates.interestedCustomers ?? current.interestedCustomers ?? []

      this.properties[index] = merged
    },
  },
})
