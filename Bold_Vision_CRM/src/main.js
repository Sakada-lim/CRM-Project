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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
