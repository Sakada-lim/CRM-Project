import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

import NewCustomersView from '../views/NewCustomersView.vue';
import ExistingCustomersView from '../views/ExistingCustomersView.vue';
import CustomerDetailView from '../views/CustomerDetailView.vue';

import PropertiesView from '../views/PropertiesView.vue';
import PropertyDetailsView from '../views/PropertyDetailsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/new-customers',
      name: 'new-customers',
      component: NewCustomersView,
    },
    {
      path: '/existing-customers',
      name: 'existing-customers',
      component: ExistingCustomersView,
    },
    {
      path: '/properties',
      name: 'properties',
      component: PropertiesView,
    },
    {
      path: '/properties/:id',
      name: 'property-details',
      component: PropertyDetailsView,
    },
    {
      path: '/customers/:id',
      name: 'customer-details',
      component: CustomerDetailView,
    },
  ],
})

export default router
