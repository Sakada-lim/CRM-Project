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
import { useAuthStore } from '../stores/authStore'
import { usePropertyStore } from '../stores/propertyStore'
import { useCustomerStore } from '../stores/customerStore'

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
      path: '/customers/:id/assessment',
      name: 'customer-assessment',
      component: () => import('../views/CustomerAssessmentView.vue'),
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

// C12: store-first guard with getSession fallback.
//
// Fast path (99% of navigations): the auth store has a session from a
// prior init() or sign-in. Guard reads `authStore.session` synchronously,
// no network call, no localStorage read.
//
// Fallback path: the store is empty on the first request after hard-
// refresh. main.js's `await authStore.init()` calls getSession(), but
// the SDK can return null on the very first call (a known Supabase-JS
// startup race) — the real session lands via the onAuthChange
// INITIAL_SESSION event slightly later. Our fallback uses getSession()
// directly to verify against Supabase storage. If a session exists,
// heal the store AND kick off the same data fetches that init() would
// have triggered — otherwise the route renders with empty stores until
// onAuthChange catches up, flashing "no properties" / "no customers".
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const authStore = useAuthStore()
  if (authStore.session) return true
  const session = await getSession()
  if (!session) return { name: 'login', query: { redirect: to.fullPath } }
  authStore.session = session
  authStore.user = session.user ?? null
  // Same fetches as authStore.init() would do once it sees a session.
  // Safe if they were already triggered — both stores dedupe / re-populate.
  usePropertyStore().fetchProperties()
  useCustomerStore().fetchCustomers()
  return true
})

export default router
