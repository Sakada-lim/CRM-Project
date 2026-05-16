export function createEmptyPropertyDraft() {
  const today = new Date().toISOString().slice(0, 10)

  return {
    address: '',
    suburb: '',
    state: 'VIC',
    postcode: '',
    type: 'House',
    status: 'On Market',
    priceMin: null,
    priceMax: null,
    priceGuide: '',
    listedAt: today,
    bedrooms: null,
    bathrooms: null,
    carSpaces: 1,
    carparkSpaces: 1,
    carparkType: 'Single garage',
    landSizeSqm: null,
    landSize: '',
    houseSizeSqm: null,
    houseSize: '',
    mainPhoto: '',
    gallery: [],
    highlights: [],
    amenities: [],
    description: '',
    notes: '',
  }
}
