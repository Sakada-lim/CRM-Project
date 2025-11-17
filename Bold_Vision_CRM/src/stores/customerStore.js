import { defineStore } from 'pinia';

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: Array.from({ length: 50 }).map((_, i) => {
      const id = i + 1;

      const names = [
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
        'Kevin Ford',
        'Laura Chen',
        'Michael Scott',
        'Natalie Rhodes',
        'Oliver Grant',
        'Paula Kim',
        'Quentin Brooks',
        'Rachel Snow',
        'Sam Turner',
        'Tina Alvarez',
        'Uma Hill',
        'Victor Lane',
        'Wendy Porter',
        'Xavier Doyle',
        'Yvonne Gray',
        'Zach Miller',
        'Aaron Delta',
        'Becca Holt',
        'Calvin Reese',
        'Dana Ives',
        'Eli Norton',
        'Faith Quinn',
        'Gavin Holt',
        'Heidi Knox',
        'Isaac Bloom',
        'Jade Summers',
        'Kyle Fraser',
        'Lily Monroe',
        'Mason Trent',
        'Nina Calder',
        'Owen Pierce',
        'Piper Evans',
        'Reid Carson',
        'Sasha Moon',
        'Trent Willis',
        'Vera Hart',
        'Wyatt Cross',
        'Zoe Harper',
        'Jonas Pike',
        'Rina Storm',
      ];

      const name = names[i % names.length];

      const categoryPool = ['Cold', 'Warm', 'Hot'];
      const category = categoryPool[Math.floor(Math.random() * 3)];

      const followUp =
        category === 'Hot'
          ? 'Every 3 months'
          : category === 'Warm'
          ? 'Every 6 months'
          : 'Every 12 months';

      return {
        id,
        name,
        phone: `040${Math.floor(Math.random() * 800 + 200)} ${Math.floor(
          Math.random() * 900 + 100,
        )}`,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@demo.com`,
        channel: ['Call', 'SMS', 'Email'][Math.floor(Math.random() * 3)],
        category,
        notes: 'Auto-generated demo customer record.',
        interestedProperty: [
          'Townhouse in inner east',
          '2BR Apartment in CBD',
          'Family Home in suburbs',
          'Vacant Land lot',
        ][Math.floor(Math.random() * 4)],
        createdAt: new Date().toISOString(),
        followUpCadence: followUp,
        lastContactedAt: null,
        feedback: [],
      };
    }),
  }),


  actions: {
    addCustomer(payload) {
      const id = Date.now();
      const followUpCadence =
        payload.category === 'Hot'
          ? 'Every 3 months'
          : payload.category === 'Warm'
          ? 'Every 6 months'
          : 'Every 12 months';

      this.customers.push({
        id,
        createdAt: new Date().toISOString(),
        followUpCadence,
        ...payload,
        lastContactedAt: null,
        feedback: [], // [{ id, date, note }]
      });
    },
    updateCustomer(id, updates) {
      const index = this.customers.findIndex((c) => c.id === id);
      if (index === -1) return;
      this.customers[index] = {
        ...this.customers[index],
        ...updates,
      };
    },
    setLastContacted(id, dateIso) {
      const c = this.customers.find((c) => c.id === id);
      if (!c) return;
      c.lastContactedAt = dateIso;
    },
    addFeedback(id, note, dateIso = new Date().toISOString()) {
      const c = this.customers.find((c) => c.id === id);
      if (!c) return;
      if (!c.feedback) c.feedback = [];
      c.feedback.unshift({
        id: Date.now(),
        date: dateIso,
        note,
      });
    },
  },
});
