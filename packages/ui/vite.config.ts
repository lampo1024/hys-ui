import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
 plugins:[vue()],
 build:{lib:{entry:{index:'src/index.ts','pro-grid/conditional-format':'src/components/HysProGrid/conditionalFormat.ts','pro-grid/clipboard':'src/components/HysProGrid/clipboard/clipboard.ts'},formats:['es'],cssFileName:'style'},rollupOptions:{external:['vue','lucide-vue-next','async-validator','pinyin-pro','dompurify','fflate','saxes'],output:{preserveModules:true,preserveModulesRoot:'src',entryFileNames:'[name].js'}}}
})
