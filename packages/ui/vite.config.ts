import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
 plugins:[vue()],
 build:{lib:{entry:{index:'src/index.ts',icons:'src/components/HysIcon/svgIcons.ts','pro-grid/conditional-format':'src/components/HysProGrid/conditionalFormat.ts','pro-grid/clipboard':'src/components/HysProGrid/clipboard/clipboard.ts'},formats:['es'],cssFileName:'style'},rollupOptions:{external:['vue','async-validator','pinyin-pro','dompurify','fflate','saxes','jsonrepair','yaml','@cfworker/json-schema',/^@codemirror\//,'@lezer/highlight','@lezer/markdown','unified','remark-parse','remark-gfm','remark-rehype','rehype-sanitize','github-slugger'],output:{preserveModules:true,preserveModulesRoot:'src',entryFileNames:'[name].js'}}}
})
