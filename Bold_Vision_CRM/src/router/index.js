import { createRouter, createWebHistory } from 'vue-router';
import NewCustomersView from '../views/NewCustomersView.vue';
import ExistingCustomersView from '../views/ExistingCustomersView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import HomeView from '../views/HomeView.vue';
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
      path: '/Newcustomers',
      name: 'new-customers',
      component: NewCustomersView,
    },
    {
      path: '/Existingcustomers',
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
  ],
})

export default router
