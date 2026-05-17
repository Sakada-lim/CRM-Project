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
import './assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

import { useAuthStore } from './stores/authStore'
useAuthStore().init()

app.mount('#app')
