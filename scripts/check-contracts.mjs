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
const scenarioTitles=JSON.parse(read('apps/docs/src/scenario-titles.json'))
const nativeControl=/<(?:button|input|select|textarea|details|summary|datalist|meter|progress)\b(?=[\s/>])|\b(?:h|createElement)\(\s*['"](?:button|input|select|textarea|details|summary|datalist|meter|progress)['"]/i
for(const folder of ['apps/docs/src',`${dir}/HysSpreadsheet`, `${dir}/HysIcon/IconPickerPanel`, `${dir}/HysNotificationCenter`, `${dir}/HysTabs/TabsMore`, `${dir}/HysFileManager`, `${dir}/HysResult`, `${dir}/HysSteps`]){
 for(const file of fs.readdirSync(path.join(root,folder),{recursive:true}).filter(file=>/\.(vue|tsx?|jsx?)$/.test(file)&&!file.startsWith(`generated${path.sep}`))){
  const source=path.join(folder,file),control=read(source).match(nativeControl)
  assert(!control,`${source} should use a HYS UI component for ${control?.[0]}`)
 }
}
for(const name of names){
 assert(name.startsWith('Hys'))
 const s=read(`${dir}/${name}/${name}.vue`)
 assert(!/\bUi[A-Z]/.test(s),name+' contains an old component name')
 assert(!/from ['"][^'"]*(vue-router|\/data\/|\/pages\/|\/types['"])/.test(s),name+' has an application dependency')
 assert(entry.includes(`default as ${name}`),name+' is not exported')
 for(const [section,rows] of Object.entries(api[name]))for(const row of rows)
  assert(row.description?.trim()&&!row.description.includes('详见类型签名'),`${name}.${section}.${row.name} needs a concrete API description`)
 assert(routes.includes(`name:'${name}'`),name+' has no dedicated route')
 assert(fs.existsSync(path.join(root,`apps/docs/src/pages/${name}Page.vue`)))
 const examples=fs.readdirSync(path.join(root,'apps/docs/src/examples',name)).filter(x=>x.endsWith('.vue'))
 for(const example of examples){
  const scene=path.basename(example,'.vue'),title=scenarioTitles.components[name]?.[scene]??scenarioTitles.common[scene]
  assert(title?.trim()&&!title.includes('进阶用法'),`${name}/${example} needs a descriptive usage title`)
 }
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
for(const name of ['HysModal','HysDrawer'])assert(read(`${dir}/${name}/${name}.vue`).includes('Teleport'))
for(const name of ['HysPopover','HysTooltip','HysPopconfirm']){const source=read(`${dir}/${name}/${name}.vue`);assert(source.includes('internal/PopupSurfacePanel.vue')&&source.includes('<PopupSurfacePanel'),name+' must use the shared portal boundary')}
assert(read('packages/ui/src/internal/PopupSurfacePanel.vue').includes('<Teleport'),'Shared popup boundary must render a portal')
for(const name of ["HysSelect","HysAutocomplete","HysTreeSelect","HysCascader","HysDatePicker","HysDateRangePicker","HysColorPicker","HysMention","HysPopconfirm","HysPopover","HysTooltip","HysContextMenu","HysBreadcrumb","HysAvatarGroup","HysCalendar","HysGantt","HysTable","HysDataGrid","HysTree","HysSlider","HysCommandPalette","HysTour"]){const props=api[name].props.map(p=>p.name);assert(props.includes('popupTransition')&&props.includes('popupTransitionDuration'),name+' missing popup motion API');assert(fs.existsSync(path.join(root,'apps/docs/src/examples',name,'PopupMotion.vue')),name+' missing popup motion example')}
console.log('PASS: component exports, dedicated pages, scenario coverage, source-backed API, style isolation and package contracts')
