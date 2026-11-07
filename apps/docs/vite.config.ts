import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath,URL} from 'node:url'
export default defineConfig(({command})=>({
 root:fileURLToPath(new URL('.',import.meta.url)),plugins:[vue()],
 resolve:{dedupe:['vue'],alias:command==='serve'?[
 {find:'hys-ui/style.css',replacement:fileURLToPath(new URL('../../packages/ui/src/styles/index.css',import.meta.url))},
 {find:'hys-ui',replacement:fileURLToPath(new URL('../../packages/ui/src/index.ts',import.meta.url))}
 ]:[]},
 server:{host:'127.0.0.1',port:5174,strictPort:true},build:{outDir:'dist',emptyOutDir:true}
}))
