import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import './styles/tokens.css'
import './styles/typography.css'
import './styles/components/modals.css'
import './styles/components/tabs.css'
import './styles/components/assessment-form.css'
import './styles/components/followups.css'
import './assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// C12: Await auth init BEFORE mount. Without this, the router guard could
// fire while the store is still empty — protected routes would briefly flash
// the login page even for legitimate logged-in users (and worse on slow
// connections, could render a protected view with no data for a frame).
//
// authStore.init() never throws — errors are captured into authStore.initError
// and the user is shown a connection-error alert on the login page.
import { useAuthStore } from './stores/authStore'
await useAuthStore().init()

app.mount('#app')
