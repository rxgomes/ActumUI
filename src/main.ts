import { createPinia } from 'pinia'
import { Dialog, Notify, Quasar } from 'quasar'
import quasarLang from 'quasar/lang/pt-BR'
import { createApp } from 'vue'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'
import { router } from './router'

createApp(App)
  .use(Quasar, {
    plugins: { Dialog, Notify },
    lang: quasarLang,
  })
  .use(createPinia())
  .use(router)
  .mount('#app')
