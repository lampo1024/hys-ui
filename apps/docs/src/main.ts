import {createApp} from 'vue'
import App from './App.vue'
import {router} from './router'
import 'hys-ui/style.css'
import './style.css'
createApp(App).use(router).mount('#app')
