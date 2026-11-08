import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=fileURLToPath(new URL('..',import.meta.url)),output=path.join(root,'apps/docs/dist')
const html=fs.readFileSync(path.join(output,'index.html'),'utf8')
const router=fs.readFileSync(path.join(root,'apps/docs/src/router.ts'),'utf8')
const routes=[...new Set([...router.matchAll(/\bpath\s*:\s*(['"])(\/components\/[^'"]+)\1/g)].map(match=>match[2]))]
if(!routes.length)throw Error('No component routes found for static documentation')
for(const route of routes){
 if(!/^\/components\/hys-[a-z0-9-]+$/.test(route))throw Error('Invalid component route: '+route)
 const directory=path.join(output,route.slice(1))
 fs.mkdirSync(directory,{recursive:true})
 fs.writeFileSync(path.join(directory,'index.html'),html)
}
fs.writeFileSync(path.join(output,'404.html'),html)
fs.writeFileSync(path.join(output,'.nojekyll'),'')
console.log('Prepared static documentation routes for direct access and refresh')
