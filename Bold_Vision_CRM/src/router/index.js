import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CustomersView from '../views/CustomersView.vue'
import CustomerDetailView from '../views/CustomerDetailView.vue'
import PropertiesView from '../views/PropertiesView.vue'
import PropertyDetailsView from '../views/PropertyDetailsView.vue'
import FollowUpsView from '../views/FollowUpsView.vue'
import MessageHistoryView from '../views/MessageHistoryView.vue'
import LoginView from '../views/LoginView.vue'
import { getSession } from '../services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/properties',
      name: 'properties',
      component: PropertiesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/:id',
      name: 'property-details',
      component: PropertyDetailsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/:id',
      name: 'customer-details',
      component: CustomerDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/follow-ups',
      name: 'follow-ups',
      component: FollowUpsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: MessageHistoryView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const session = await getSession()
  if (!session) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
