import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/utilities.css'
import './assets/styles/components/layout.css'
import './assets/styles/components/cards.css'
import './assets/styles/components/forms.css'
import './assets/styles/components/toolbars.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

import { useAuthStore } from './stores/authStore'
useAuthStore().init()

app.mount('#app')
