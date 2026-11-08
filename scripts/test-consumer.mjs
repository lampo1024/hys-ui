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
fs.writeFileSync(path.join(dir,'main.ts'),`import {createApp,h,ref,onBeforeUnmount} from 'vue'\nimport {HysButton,HysSelect,HysModal,HysPopover,HysAlert,HysMention,useHysToast,createHysToast,type HysToastHandle,type HysToastPosition,provideHysConfig,type HysTheme,type HysButtonVariant} from 'hys-ui'\nimport 'hys-ui/style.css'\nimport './host.css'\nconst variant:HysButtonVariant='primary'\ncreateApp({setup(){const theme=ref<HysTheme>('green'),value=ref('a'),open=ref(false),mention=ref('');provideHysConfig({theme,motion:'off'});const placement:HysToastPosition='top-center',toast=useHysToast({position:placement,duration:0}),external=createHysToast({theme,motion:'off',duration:0});onBeforeUnmount(()=>external.dispose());return()=>h('main',{},[h(HysButton,{variant,onClick:()=>open.value=true},()=> 'Open modal'),h(HysButton,{onClick:()=>theme.value=theme.value==='green'?'dark':'green'},()=> 'Change theme'),h(HysButton,{onClick:()=>{const handle:HysToastHandle=toast.info('Standalone toast');void handle.closed}},()=> 'Show toast'),h(HysButton,{onClick:()=>external.success('External toast message')},()=> 'External toast'),h(HysSelect<string>,{modelValue:value.value,options:[{label:'One',value:'a'},{label:'Two',value:'b'}],'onUpdate:modelValue':(v:string|string[])=>{value.value=Array.isArray(v)?v[0]||'':v}}),h(HysAlert,{title:'Default alert'}),h(HysPopover,{title:'Independent popover'},{trigger:()=>h('button','Popover trigger'),default:()=>h('p','Standalone popover')}),h(HysMention,{modelValue:mention.value,users:[{id:'a',name:'Alice'}],'onUpdate:modelValue':(v:string)=>mention.value=v}),h(HysModal,{open:open.value,title:'Independent modal',onClose:()=>open.value=false},()=>h('p','Standalone Vue consumer'))])}}).mount('#app')\n`)
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
import {HysForm,HysFormItem,HysInput,type HysFormRules,type HysFormPath,type HysFormValidationContext,type HysFormValidationResult,type HysFormCol,type HysFormGridValue,type HysFormFieldData,useHysFormItemContext} from 'hys-ui'
const path:HysFormPath=['profile','email']
const rules:HysFormRules={'profile.email':[{type:'email',required:true},{validator:async(_value,_model,context:HysFormValidationContext)=>context.signal.aborted?false:true}]}
const labelCol:HysFormCol={span:6,sm:{span:8,offset:1}},columns:HysFormGridValue={xs:1,md:2}
export const fieldData:HysFormFieldData={name:path,errors:['Required']}
export const controlAdapter=()=>useHysFormItemContext()
export const formTypeChecks=h(HysForm,{columns,labelCol,feedbackIcon:true,inlineFeedback:true,validateFirst:false,model:{profile:{email:''}},rules,size:'sm',validateTrigger:['change','blur'],scrollToError:{block:'center'},onInvalid:(result:HysFormValidationResult)=>void result.errors},()=>h(HysFormItem,{prop:path,dependencies:[['profile','name']],feedbackIcon:true},()=>h(HysInput,{modelValue:''})))
export async function validateEmail(form:InstanceType<typeof HysForm>){const result:HysFormValidationResult=await form.validateResult([path]);form.resetFields([path]);form.captureInitialValues();form.focusField(path);form.setFieldValue(path,null);form.setFieldsValue({profile:{email:'user@example.com'}});form.setFields([fieldData]);form.setInitialValues({profile:{email:''}});await form.validate(async(valid,details)=>{void valid;void details.errorMessages});return result.cancelled}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {formTypeChecks} from './form-types'\nvoid formTypeChecks\n")
fs.writeFileSync(path.join(dir,'select-types.ts'),`import {h,ref} from 'vue'
import {HysSelect,type HysSelectModelValue,type HysSelectOption,type HysSelectGroup,type HysSelectDataOption,type HysSelectInstance,type HysSelectFieldNames,type HysSelectSearchContext} from 'hys-ui'
const value:HysSelectModelValue={id:1},instance=ref<HysSelectInstance>()
const group:HysSelectGroup={label:'Group',options:[{label:'Zero',value:0},{label:'False',value:false}]}
const options:HysSelectDataOption[]=[group,{label:'Object',value:{id:1}}],fields:HysSelectFieldNames={label:'name',value:'id',options:'children'}
export const selectTypeChecks=h(HysSelect,{ref:instance,modelValue:value,options,valueKey:'id',maxTagCount:2,multipleLimit:3,popupWidth:320,appendTo:false,fieldNames:fields,clearValue:null,remoteMethod:async(query:string,{signal}:HysSelectSearchContext)=>signal.aborted?[]:[{label:query,value:query}],onSelect:(_value,option:HysSelectOption)=>void option.label})
type ActualSelect=Parameters<NonNullable<Parameters<typeof HysSelect>[2]>>[0]
export function verifyActualSelectInstance(actual:ActualSelect):HysSelectInstance{return actual}
export async function inspectSelect(api:HysSelectInstance){await api.open();api.scrollTo(0);api.focus();api.close();api.retry();return api.selected}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {selectTypeChecks} from './select-types'\nvoid selectTypeChecks\n")
fs.writeFileSync(path.join(dir,'number-types.ts'),`import {h,ref} from 'vue'
import {HysNumberInput,type HysNumberInputValue,type HysNumberInputInstance,type HysNumberInputFormatInfo,type HysNumberInputStepInfo,type HysNumberInputInvalidInfo} from 'hys-ui'
const instance=ref<HysNumberInputInstance>(),empty:HysNumberInputValue=null
export const numberTypeChecks=[h(HysNumberInput<number|null>,{ref:instance,modelValue:empty,step:.25,precision:2,controlsPosition:'right',clearable:true,updateOnInput:true,autocomplete:'off',formatter:(value:HysNumberInputValue,info:HysNumberInputFormatInfo)=>info.userTyping?info.input:String(value??''),parser:text=>text,onChange:(value:number|null)=>void value,onInvalid:(info:HysNumberInputInvalidInfo)=>void info.reason}),h(HysNumberInput<string|null>,{modelValue:'9007199254740993.1',step:'0.00000001',stringMode:true,min:'0',valueOnClear:'min',keyboard:{ArrowDown:false},onStep:(value:string|null,info:HysNumberInputStepInfo)=>{void value;void info.offset}})]
type ActualNumber=Parameters<NonNullable<Parameters<typeof HysNumberInput>[2]>>[0]
export function verifyNumberInstance(actual:ActualNumber):HysNumberInputInstance{return actual}
export const genericNumber=h(HysNumberInput,{onChange:(value:HysNumberInputValue)=>void value})
export function operateNumber(api:HysNumberInputInstance){api.focus({preventScroll:true});api.select();api.increase(2);api.decrease();api.clear();return api.commit()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {numberTypeChecks} from './number-types'\nvoid numberTypeChecks\n")
fs.writeFileSync(path.join(dir,'text-types.ts'),`import {h,ref} from 'vue'
import {HysInput,HysTextarea,type HysInputInstance,type HysTextareaInstance,type HysInputProps,type HysTextareaProps,type HysInputFormatInfo,type HysInputCountInfo,type HysInputCountStrategy} from 'hys-ui'
const entry=ref<HysInputInstance>(),note=ref<HysTextareaInstance>(),counter:HysInputCountStrategy=true
const inputProps:HysInputProps={defaultValue:'Text',countGraphemes:counter,maxlength:12,formatter:(value:string,_info:HysInputFormatInfo)=>value,parser:value=>value,showCount:{formatter:(info:HysInputCountInfo)=>String(info.count)},inputProps:{spellcheck:false,style:{fontFamily:'sans-serif'}},showPasswordOn:'mousedown'}
const textProps:HysTextareaProps={autosize:{minRows:2,maxRows:5},clearable:true,countPosition:'outside',showWordLimit:true}
export const textTypeChecks=[h(HysInput,{...inputProps,ref:entry}),h(HysTextarea,{...textProps,ref:note})]
export function actualInput(actual:InstanceType<typeof HysInput>):HysInputInstance{return actual}
export function actualTextarea(actual:InstanceType<typeof HysTextarea>):HysTextareaInstance{return actual}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {textTypeChecks} from './text-types'\nvoid textTypeChecks\n")
fs.writeFileSync(path.join(dir,'slider-types.ts'),`import {h,ref} from 'vue'
import {HysSlider,type HysSliderValue,type HysSliderStep,type HysSliderMarks,type HysSliderDragInfo,type HysSliderInstance} from 'hys-ui'
const instance=ref<HysSliderInstance>(),step:HysSliderStep='mark',marks:HysSliderMarks={0:'Off',40:{label:'Normal',style:{color:'blue'}},100:'Full'}
export const sliderTypeChecks=[h(HysSlider<number>,{ref:instance,modelValue:40,step,marks,vertical:true,showInput:true,onChange:(value:number)=>void value,onDragEnd:(_value:number,info:HysSliderDragInfo)=>void info.cancelled}),h(HysSlider<[number,number]>,{modelValue:[20,70],draggableTrack:true,onChange:(value:[number,number])=>void value[0]})]
type ActualSlider=Parameters<NonNullable<Parameters<typeof HysSlider>[2]>>[0]
export function verifySliderInstance(actual:ActualSlider):HysSliderInstance{return actual}
export function operateSlider(api:HysSliderInstance,value:HysSliderValue){api.setValue(value);api.focus(1);api.cancel();return api.values}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {sliderTypeChecks} from './slider-types'\nvoid sliderTypeChecks\n")
fs.writeFileSync(path.join(dir,'avatar-types.ts'),`import {h,ref} from 'vue'
import {HysAvatar,HysAvatarGroup,type HysAvatarProps,type HysAvatarSize,type HysAvatarBreakpoint,type HysAvatarFit,type HysAvatarLoadInfo,type HysAvatarOption,type HysAvatarInstance,type HysAvatarGroupProps,type HysAvatarGroupInstance} from 'hys-ui'
const breakpoint:HysAvatarBreakpoint='md',size:HysAvatarSize={[breakpoint]:48,xs:24},fit:HysAvatarFit='scale-down',avatar=ref<HysAvatarInstance>(),group=ref<HysAvatarGroupInstance>()
const props:HysAvatarProps={size,fit,srcset:'photo.png 1x',crossOrigin:'anonymous',fallbackSrc:'backup.png',loadError:()=>false,imgProps:{referrerpolicy:'no-referrer'}}
const options:HysAvatarOption[]=[{key:1,name:'Alex',...props}],groupProps:HysAvatarGroupProps={options,size,maxCount:2,trigger:'focus',gap:-8}
export const avatarTypeChecks=[h(HysAvatar,{...props,ref:avatar,onLoad:(_event:Event,info:HysAvatarLoadInfo)=>void info.fallback}),h(HysAvatarGroup,{...groupProps,ref:group})]
export function actualAvatar(actual:InstanceType<typeof HysAvatar>):HysAvatarInstance{return actual}
export function actualAvatarGroup(actual:InstanceType<typeof HysAvatarGroup>):HysAvatarGroupInstance{return actual}
export async function operateGroup(api:HysAvatarGroupInstance){await api.open();api.close()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {avatarTypeChecks} from './avatar-types'\nvoid avatarTypeChecks\n")
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
