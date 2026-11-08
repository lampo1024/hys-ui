import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {fileURLToPath} from 'node:url'
import postcss from 'postcss'
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const dir='packages/ui/src/components',names=fs.readdirSync(path.join(root,dir)).sort(),api=JSON.parse(read('apps/docs/src/generated/api.json'))
assert(names.length>0,'Component source is empty')
assert.deepEqual(Object.keys(api).sort(),names)
const routes=read('apps/docs/src/router.ts'),entry=read('packages/ui/src/index.ts')
for(const name of names){
 assert(name.startsWith('Hys'))
 const s=read(`${dir}/${name}/${name}.vue`)
 assert(!/\bUi[A-Z]/.test(s),name+' contains an old component name')
 assert(!/from ['"][^'"]*(vue-router|\/data\/|\/pages\/|\/types['"])/.test(s),name+' has an application dependency')
 assert(entry.includes(`default as ${name}`),name+' is not exported')
 assert(routes.includes(`name:'${name}'`),name+' has no dedicated route')
 assert(fs.existsSync(path.join(root,`apps/docs/src/pages/${name}Page.vue`)))
 const examples=fs.readdirSync(path.join(root,'apps/docs/src/examples',name)).filter(x=>x.endsWith('.vue'))
 assert(examples.length>=2,name+' needs at least two concrete scenarios')
 assert(examples.some(file=>read(`apps/docs/src/examples/${name}/${file}`).includes(`<${name}`)))
}
for(const p of ['packages/ui/src/config.ts','packages/ui/src/motion/useMotion.ts'])assert(!/localStorage|documentElement/.test(read(p)),p+' writes global preferences')
postcss.parse(read('packages/ui/src/styles/index.css')).walkRules(rule=>{if(rule.parent?.name==='keyframes')return;assert(!/(^|[,\s])(?:body|html|:root)(?:$|[,\s:{])/.test(rule.selector),'Global selector: '+rule.selector)})
const pkg=JSON.parse(read('packages/ui/package.json'))
assert.equal(JSON.parse(read('apps/docs/package.json')).dependencies['hys-ui'],'file:../../packages/ui','Docs must resolve the local workspace package')
assert.deepEqual(Object.keys(JSON.parse(read('apps/docs/src/component-capabilities.json'))).sort(),names)
assert.equal(pkg.name,'hys-ui');assert.equal(pkg.license,'MIT');assert.equal(pkg.publishConfig.access,'public')
assert(!pkg.dependencies.vue&&!pkg.dependencies['vue-router'])
for(const name of ['HysModal','HysDrawer','HysPopover','HysTooltip'])assert(read(`${dir}/${name}/${name}.vue`).includes('Teleport'))
console.log('PASS: component exports, dedicated pages, scenario coverage, source-backed API, style isolation and package contracts')
