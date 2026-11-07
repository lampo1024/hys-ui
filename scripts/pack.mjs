import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {npm} from './npm.mjs'
export const root=fileURLToPath(new URL('..',import.meta.url))
const artifacts=path.join(root,'artifacts');fs.mkdirSync(artifacts,{recursive:true})
const [result]=JSON.parse(npm(['pack','--workspace','hys-ui','--json','--pack-destination',artifacts],{cwd:root}))
if(result.files.some(file=>!['package.json','README.md','LICENSE','CHANGELOG.md'].includes(file.path)&&!file.path.startsWith('dist/')))throw Error('Unexpected file in publication archive')
const file=path.join(artifacts,result.filename),sha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex')
fs.writeFileSync(path.join(artifacts,'package.json'),JSON.stringify({name:result.name,version:result.version,file,sha256,files:result.files.map(f=>f.path)},null,2))
console.log(`Packed ${result.name}@${result.version}: ${file}\nSHA256 ${sha256}`)
