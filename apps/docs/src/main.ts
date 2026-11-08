import {createApp} from 'vue'
import App from './App.vue'
import {router} from './router'
import {installExamplePasswordGuard} from './examplePasswords'
import 'hys-ui/style.css'
import './style.css'
const disposePasswords=installExamplePasswordGuard()
const app=createApp(App)
app.onUnmount(disposePasswords)
import.meta.hot?.dispose(disposePasswords)
app.use(router).mount('#app')
