import { defineStore } from 'pinia';

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: [
      {
        id: 1,
        name: 'Alice Buyer',
        phone: '0400 111 222',
        email: 'alice@example.com',
        channel: 'Call',
        category: 'Hot',
        notes: 'Very keen on 123 Smith St.',
        interestedProperty: '123 Smith St',
        createdAt: new Date().toISOString(),
        followUpCadence: 'Every 3 months',
      },
      {
        id: 2,
        name: 'Bob Watcher',
        phone: '0400 333 444',
        email: 'bob@example.com',
        channel: 'SMS',
        category: 'Warm',
        notes: 'Looking in 6–12 month range.',
        interestedProperty: 'Any 2BR apartment in CBD',
        createdAt: new Date().toISOString(),
        followUpCadence: 'Every 6 months',
      },
    ],
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
      });
    },
  },
});
