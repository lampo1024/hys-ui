import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath,URL} from 'node:url'
import exampleSourcePlugin from './source-plugin.mjs'
import componentApiPlugin from './api-plugin.mjs'
const docsBase=process.env.DOCS_BASE_PATH||'/'
export default defineConfig(({command})=>({
 base:docsBase.endsWith('/')?docsBase:docsBase+'/',
 root:fileURLToPath(new URL('.',import.meta.url)),plugins:[exampleSourcePlugin(),componentApiPlugin(),vue()],
 resolve:{dedupe:['vue'],alias:command==='serve'?[
 {find:'hys-ui/pro-grid/clipboard.css',replacement:fileURLToPath(new URL('../../packages/ui/src/components/HysProGrid/clipboard/clipboard.css',import.meta.url))},
 {find:'hys-ui/pro-grid/clipboard',replacement:fileURLToPath(new URL('../../packages/ui/src/components/HysProGrid/clipboard/clipboard.ts',import.meta.url))},
 {find:'hys-ui/pro-grid/conditional-format.css',replacement:fileURLToPath(new URL('../../packages/ui/src/components/HysProGrid/conditional-format.css',import.meta.url))},
 {find:'hys-ui/pro-grid/conditional-format',replacement:fileURLToPath(new URL('../../packages/ui/src/components/HysProGrid/conditionalFormat.ts',import.meta.url))},
 {find:'hys-ui/pro-grid.css',replacement:fileURLToPath(new URL('../../packages/ui/src/components/HysProGrid/pro-grid.css',import.meta.url))},
 {find:'hys-ui/style.css',replacement:fileURLToPath(new URL('../../packages/ui/src/styles/index.css',import.meta.url))},
 {find:'hys-ui',replacement:fileURLToPath(new URL('../../packages/ui/src/index.ts',import.meta.url))}
 ]:[]},
 server:{host:'127.0.0.1',port:5174,strictPort:true,watch:{usePolling:process.platform==='win32',interval:300}},build:{outDir:'dist',emptyOutDir:true}
}))
