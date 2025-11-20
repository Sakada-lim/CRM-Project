import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import CustomersView from '../views/CustomersView.vue'
import CustomerDetailView from '../views/CustomerDetailView.vue'

import PropertiesView from '../views/PropertiesView.vue'
import PropertyDetailsView from '../views/PropertyDetailsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersView,
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
