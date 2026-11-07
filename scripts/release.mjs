import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {npm,registry} from './npm.mjs'
const root=fileURLToPath(new URL('..',import.meta.url))
npm(['run','check:release'],{cwd:root,stdio:'inherit'})
const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/package.json'),'utf8'))
const hash=createHash('sha256').update(fs.readFileSync(manifest.file)).digest('hex')
if(hash!==manifest.sha256)throw Error('The tested archive has changed; rebuild and verify it before publishing')
const account=npm(['whoami','--registry',registry],{cwd:root}).trim()
let existing
try{existing=JSON.parse(npm(['view',manifest.name,'--json','--registry',registry],{cwd:root,stdio:['ignore','pipe','pipe']}))}catch(error){if(!String(error.stderr).includes('E404'))throw error}
if(existing&&(!existing.maintainers?.some(x=>x.name===account)||existing.versions?.includes(manifest.version)))throw Error('Package name or version is unavailable for this account')
npm(['publish',manifest.file,'--access','public','--tag','latest','--registry',registry],{cwd:root,stdio:'inherit'})
console.log(npm(['view',`${manifest.name}@${manifest.version}`,'version','dist.integrity','--registry',registry],{cwd:root}))
