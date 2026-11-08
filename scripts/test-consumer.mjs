import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {npm} from './npm.mjs'
const root=fileURLToPath(new URL('..',import.meta.url)),archive=JSON.parse(fs.readFileSync(path.join(root,'artifacts/package.json'),'utf8'))
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hys-ui-consumer-'))
fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'hys-ui-independent-consumer',private:true,type:'module',dependencies:{vue:'^3.5.13','hys-ui':'file:'+archive.file.replaceAll('\\','/')}}))
fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="host"><h1>Host heading</h1><button class="btn">Host button</button></div><div id="app"></div><script type="module" src="/main.ts"></script></body></html>')
fs.writeFileSync(path.join(dir,'main.ts'),`import {createApp,h,ref,onBeforeUnmount} from 'vue'\nimport {HysButton,HysSelect,HysModal,HysPopover,HysAlert,HysMention,useHysToast,createHysToast,type HysToastHandle,type HysToastPosition,provideHysConfig,type HysTheme,type HysButtonVariant} from 'hys-ui'\nimport 'hys-ui/style.css'\nimport './host.css'\nconst variant:HysButtonVariant='primary'\ncreateApp({setup(){const theme=ref<HysTheme>('green'),value=ref('a'),open=ref(false),mention=ref('');provideHysConfig({theme,motion:'off'});const placement:HysToastPosition='top-center',toast=useHysToast({position:placement,duration:0}),external=createHysToast({theme,motion:'off',duration:0});onBeforeUnmount(()=>external.dispose());return()=>h('main',{},[h(HysButton,{variant,onClick:()=>open.value=true},()=> 'Open modal'),h(HysButton,{onClick:()=>theme.value=theme.value==='green'?'dark':'green'},()=> 'Change theme'),h(HysButton,{onClick:()=>{const handle:HysToastHandle=toast.info('Standalone toast');void handle.closed}},()=> 'Show toast'),h(HysButton,{onClick:()=>external.success('External toast message')},()=> 'External toast'),h(HysSelect,{modelValue:value.value,options:[{label:'One',value:'a'},{label:'Two',value:'b'}],'onUpdate:modelValue':(v:string|string[])=>{value.value=Array.isArray(v)?v[0]||'':v}}),h(HysAlert,{title:'Default alert'}),h(HysPopover,{title:'Independent popover'},{trigger:()=>h('button','Popover trigger'),default:()=>h('p','Standalone popover')}),h(HysMention,{modelValue:mention.value,users:[{id:'a',name:'Alice'}],'onUpdate:modelValue':(v:string)=>mention.value=v}),h(HysModal,{open:open.value,title:'Independent modal',onClose:()=>open.value=false},()=>h('p','Standalone Vue consumer'))])}}).mount('#app')\n`)
fs.writeFileSync(path.join(dir,'host.css'),'body{font-family:serif;background:rgb(250,248,245);--primary:hotpink}.btn{background:rgb(110,25,70);padding:17px}h1{font-size:31px;margin:19px}#app{padding:25px}#app>main{display:grid;gap:20px;max-width:500px}')
fs.writeFileSync(path.join(dir,'navigation-types.ts'),`import {h} from 'vue'
import {HysTabs,HysAccordion,HysSteps,HysBreadcrumb,type HysTabValue,type HysTabItem,type HysAccordionKey,type HysAccordionItem,type HysStepStatus,type HysStepItem,type HysBreadcrumbItem} from 'hys-ui'
const value:HysTabValue=0,tabItems:HysTabItem[]=[{value,label:'First',content:'First panel',closable:false}]
const key:HysAccordionKey='settings',accordionItems:HysAccordionItem[]=[{id:key,title:'Settings',forceRender:true}]
const status:HysStepStatus='process',stepItems:HysStepItem[]=[{title:'Review',status,subtitle:'Pending'}]
const crumbs:HysBreadcrumbItem[]=[{label:'Home',href:'#home',target:'_blank'},{label:'Settings',separator:'>',disabled:true}]
export const navigationTypeChecks=[h(HysTabs,{items:tabItems,modelValue:value,placement:'left',activation:'manual',destroyOnHide:false,beforeLeave:async(next:HysTabValue,current:HysTabValue)=>next!==current}),h(HysAccordion,{items:accordionItems,modelValue:[key],trigger:'icon',beforeToggle:async(_key:HysAccordionKey,expanded:boolean)=>expanded}),h(HysSteps,{items:stepItems,current:0,labelPlacement:'bottom',progressDot:true}),h(HysBreadcrumb,{items:crumbs,separator:'/'})]
type TabInstance=InstanceType<typeof HysTabs>
export function focusNumericTab(tabs:TabInstance){tabs.focus(0);tabs.scrollToActiveTab()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {navigationTypeChecks} from './navigation-types'\nvoid navigationTypeChecks\n")
fs.writeFileSync(path.join(dir,'form-types.ts'),`import {h} from 'vue'
import {HysForm,HysFormItem,HysInput,type HysFormRules,type HysFormPath,type HysFormValidationContext,type HysFormValidationResult} from 'hys-ui'
const path:HysFormPath=['profile','email']
const rules:HysFormRules={'profile.email':[{type:'email',required:true},{validator:async(_value,_model,context:HysFormValidationContext)=>context.signal.aborted?false:true}]}
export const formTypeChecks=h(HysForm,{model:{profile:{email:''}},rules,size:'sm',validateTrigger:['change','blur'],scrollToError:{block:'center'},onInvalid:(result:HysFormValidationResult)=>void result.errors},()=>h(HysFormItem,{prop:path,dependencies:[['profile','name']],feedbackIcon:true},()=>h(HysInput,{modelValue:''})))
export async function validateEmail(form:InstanceType<typeof HysForm>){const result:HysFormValidationResult=await form.validateResult([path]);form.resetFields([path]);form.captureInitialValues();form.focusField(path);return result.cancelled}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {formTypeChecks} from './form-types'\nvoid formTypeChecks\n")
fs.writeFileSync(path.join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,skipLibCheck:true,lib:['ES2022','DOM']},include:['main.ts']}))
npm(['install','--no-audit','--no-fund'],{cwd:dir,stdio:'inherit'})
execFileSync(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit','-p',path.join(dir,'tsconfig.json')],{cwd:dir,stdio:'inherit'})
execFileSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build',dir,'--config',path.join(root,'scripts/consumer.vite.ts')],{cwd:dir,stdio:'inherit'})
assert(!fs.existsSync(path.join(dir,'node_modules/vue-router')))
assert(!fs.existsSync(path.join(dir,'node_modules/hys-ui/node_modules/vue')))
const scripts=fs.readdirSync(path.join(dir,'dist/assets')).filter(p=>p.endsWith('.js')).map(p=>fs.readFileSync(path.join(dir,'dist/assets',p),'utf8')).join('\n')
assert(!scripts.includes('hys-ui-pf-grid-toolbar'),'Unused data grid was bundled')
fs.writeFileSync(path.join(root,'artifacts/consumer-dir.txt'),dir)
console.log('PASS: external tarball consumer, public types, single Vue, no router, tree shaking. Fixture: '+dir)
