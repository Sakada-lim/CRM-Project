import { defineStore } from 'pinia';

export const usePropertyStore = defineStore('properties', {
  state: () => ({
    properties: [
      {
        id: 1,
        code: 'PROP-001',
        address: '123 Smith St, Melbourne',
        type: 'House',
        status: 'New',
        priceGuide: '$850k–$900k',
        notes: 'Great family area, near park.',
        gallery: [
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
          'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        code: 'PROP-002',
        address: '45 King Rd, Box Hill',
        type: 'Unit',
        status: 'On Market',
        priceGuide: '$600k–$650k',
        notes: 'Good rental yield.',
        gallery: [
          'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
          'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'
        ],
        createdAt: new Date().toISOString(),
      },
    ],
  }),

  actions: {
    addProperty(payload) {
      const id = Date.now();
      this.properties.push({
        id,
        createdAt: new Date().toISOString(),
        gallery: [],
        ...payload,
      });
    },
    updateProperty(id, updates) {
      const index = this.properties.findIndex((p) => p.id === id);
      if (index === -1) return;
      this.properties[index] = {
        ...this.properties[index],
        ...updates,
        gallery: updates.gallery ?? this.properties[index].gallery ?? [],
      };
    },
  },
  
});
