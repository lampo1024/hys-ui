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
fs.writeFileSync(path.join(dir,'autocomplete-types.ts'),`import {h,ref} from 'vue'
import {HysAutocomplete,type HysAutocompleteProps,type HysAutocompleteOption,type HysAutocompleteItem,type HysAutocompleteDataOption,type HysAutocompleteGroup,type HysAutocompleteContext,type HysAutocompleteCallback,type HysAutocompleteFetch,type HysAutocompleteInstance} from 'hys-ui'
const option:HysAutocompleteOption={value:'Vue',label:'Vue Framework'},group:HysAutocompleteGroup={label:'Tools',options:[option]},options:HysAutocompleteDataOption[]=[group,'Vite']
const provider:HysAutocompleteFetch=async(query:string,callback:HysAutocompleteCallback,context:HysAutocompleteContext)=>context.signal.aborted?[]:options
const props:HysAutocompleteProps={options,fetchSuggestions:provider,filterOption:(query,item)=>typeof item==='string'?item.includes(query):true,inputProps:{type:'search',clearable:true},popupMatchWidth:false}
export const autocompleteTypeChecks=h(HysAutocomplete,{...props,ref:ref<HysAutocompleteInstance>(),onSelect:(item:HysAutocompleteItem,value:string)=>void [item,value]})
export function actualAutocomplete(actual:InstanceType<typeof HysAutocomplete>):HysAutocompleteInstance{return actual}
export async function operateAutocomplete(api:HysAutocompleteInstance){api.focus();await api.open();api.highlight(0);await api.select(option);await api.getData();api.close();api.clear()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {autocompleteTypeChecks} from './autocomplete-types'\nvoid autocompleteTypeChecks\n")
fs.writeFileSync(path.join(dir,'choice-types.ts'),`import {h,ref} from 'vue'
import {HysCheckbox,HysCheckboxGroup,HysRadio,HysRadioGroup,HysSwitch,type HysChoiceValue,type HysChoiceDataOption,type HysChoiceFieldNames,type HysCheckboxInstance,type HysCheckboxGroupInstance,type HysRadioInstance,type HysRadioGroupInstance,type HysSwitchInstance,type HysSwitchGuardContext} from 'hys-ui'
const options:HysChoiceDataOption[]=[0,'0',false,{label:'A',value:'a'}],fields:HysChoiceFieldNames={label:'title',value:'id'},value:HysChoiceValue=0
export const choiceTypeChecks=[h(HysCheckbox<boolean>,{modelValue:false,onChange:(next:boolean)=>void next}),h(HysCheckboxGroup,{options,fieldNames:fields,modelValue:[value],ref:ref<HysCheckboxGroupInstance>()}),h(HysRadio,{value:0,modelValue:null,ref:ref<HysRadioInstance>()}),h(HysRadioGroup<string>,{modelValue:'a',options:['a','b'],onChange:(next:string)=>void next}),h(HysSwitch<string>,{modelValue:'off',activeValue:'on',inactiveValue:'off',beforeChange:async(next:string,current:string,{signal}:HysSwitchGuardContext)=>!signal.aborted&&next!==current,ref:ref<HysSwitchInstance>()})]
export async function operateChoices(checkbox:HysCheckboxInstance,group:HysCheckboxGroupInstance,radio:HysRadioInstance,radios:HysRadioGroupInstance,switchControl:HysSwitchInstance){const accepted:boolean=await group.toggle(0);await group.checkAll();await group.clear();checkbox.focus();await checkbox.toggle();radio.focus();await radio.select();await radios.select('a');await switchControl.toggle();return accepted}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {choiceTypeChecks} from './choice-types'\nvoid choiceTypeChecks\n")
fs.writeFileSync(path.join(dir,'rating-segmented-types.ts'),`import {h,ref} from 'vue'
import {HysRating,HysSegmented,type HysRatingLevels,type HysRatingIcon,type HysRatingInstance,type HysSegmentedInstance,type HysSegmentedOption} from 'hys-ui'
const colors:HysRatingLevels<string>={2:'red',4:{value:'orange',excluded:true},5:'green'},icons:HysRatingLevels<HysRatingIcon>=['span','strong','b'],options:HysSegmentedOption<number>[]=[{label:'One',value:1},{label:'Two',value:2,style:{color:'green'}}]
export const ratingSegmentedChecks=[h(HysRating,{ref:ref<HysRatingInstance>(),modelValue:2.5,colors,icons,allowHalf:true,onChange:(value:number)=>void value,onHoverChange:(value:number|null)=>void value}),h(HysSegmented<number>,{ref:ref<HysSegmentedInstance>(),modelValue:1,options,direction:'vertical',onChange:(value:number)=>void value}),h(HysSegmented<string|number|boolean>,{modelValue:false,options:[false,0,'0']})]
export async function operateRatingAndSegmented(rating:HysRatingInstance,segmented:HysSegmentedInstance){rating.setCurrentValue(4);rating.resetCurrentValue();const accepted:boolean=await rating.setValue(3);await rating.clear();segmented.focus(1);await segmented.select(2);return accepted}
export function actualRating(actual:InstanceType<typeof HysRating>):HysRatingInstance{return actual}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {ratingSegmentedChecks} from './rating-segmented-types'\nvoid ratingSegmentedChecks\n")
fs.writeFileSync(path.join(dir,'gantt-types.ts'),`import {h} from 'vue'
import {HysGantt,type GanttItem,type HysGanttInstance,type HysGanttDependencyChange,type HysGanttDependencyMove,type HysGanttDependencyInvalid,type HysGanttHistoryEntry,type HysGanttHistoryState,type HysGanttConflict} from 'hys-ui'
const items:GanttItem[]=[{id:1,title:'Task',start:'2026-11-01',end:'2026-11-03'}]
export const ganttChecks=[h(HysGantt,{items,height:420,maxHeight:'70vh',rowHeight:48,labelWidth:220,labelResizable:true,minLabelWidth:120,maxLabelWidth:480,onLabelResize:(width:number)=>void width,history:true,historyLimit:50,historyKeyboard:true,showHistoryControls:true,showConflicts:true,onUndo:(entry:HysGanttHistoryEntry)=>void entry.taskIds,onHistoryChange:(state:HysGanttHistoryState)=>void state.canRedo,onConflictChange:(issues:HysGanttConflict[])=>void issues[0]?.type,virtual:true,overscan:8}),h(HysGantt,{items,maxHeight:false}),h(HysGantt,{items,height:'calc(100vh - 220px)',dependencyEditable:true,showDependencies:true,onChange:(item:GanttItem)=>void item.end,onDependencyAdd:(info:HysGanttDependencyChange,item:GanttItem)=>void [info,item],onDependencyMove:(info:HysGanttDependencyMove,item:GanttItem,previous:GanttItem)=>void [info.previousTargetId,item,previous],onDependencyInvalid:(info:HysGanttDependencyInvalid)=>void info.reason})]
export async function operateGantt(api:HysGanttInstance){await api.scrollToTask(1,{block:'center',horizontal:true});api.scrollToTop();await api.addDependency(1,2);await api.removeDependency(1,2);await api.moveDependency(1,2,3);api.cancelDependency();await api.undo();await api.redo();api.clearHistory();void [api.canUndo,api.canRedo,api.historyState,api.conflicts]}
export function actualGantt(actual:InstanceType<typeof HysGantt>):HysGanttInstance{return actual}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {ganttChecks} from './gantt-types'\nvoid ganttChecks\n")
fs.writeFileSync(path.join(dir,'calendar-types.ts'),`import {h} from 'vue'
import {HysCalendar,type CalendarEvent,type HysCalendarInstance,type HysCalendarSelectInfo,type HysCalendarCell,type HysCalendarMode} from 'hys-ui'
const events:CalendarEvent[]=[{id:'meeting',date:'2026-11-09',end:'2026-11-11',title:'Meeting',time:'10:00',color:'purple'}]
export const calendarChecks=[h(HysCalendar<string>,{modelValue:'2026-11-09',events,mode:'month',controllerType:'select',firstDayOfWeek:1,validRange:['2026-11-01','2026-12-31'],onSelect:(date:string,info:HysCalendarSelectInfo)=>void [date,info.source],onEvent:(id:string,event:CalendarEvent,date:string)=>void [id,event,date]}),h(HysCalendar<Date>,{modelValue:new Date(),valueType:'date',onChange:(date:Date)=>void date.getFullYear()})]
export async function operateCalendar(calendar:HysCalendarInstance<string>){const accepted:boolean=await calendar.pickDay('2026-11-10');calendar.selectDate('next-year');calendar.showMonth('2028-02-29');calendar.setMode('year');await calendar.focus();const mode:HysCalendarMode=calendar.currentMode;void [calendar.visibleRange,calendar.selectedDay,mode];return accepted}
export function readCell(cell:HysCalendarCell){return [cell.date.getDate(),cell.day,cell.type,cell.events]}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {calendarChecks} from './calendar-types'\nvoid calendarChecks\n")
fs.writeFileSync(path.join(dir,'table-types.ts'),`import {h,ref} from 'vue'
import {HysTable,type HysTableColumn,type HysTableInstance,type HysTableCellContext,type HysTableQuery,type HysTableLoadContext,type HysTableKey} from 'hys-ui'
interface Person {id:number;name:string;amount:number;children?:Person[];hasChildren?:boolean}
const rows:Person[]=[{id:1,name:'A',amount:20}],columns:HysTableColumn<Person>[]=[{key:'name',label:'Name',fixed:'left',width:150,filterable:true},{key:'amount',label:'Amount',sortable:true,summary:'sum',sorter:(a,b)=>a.amount-b.amount,formatter:(row,col,value)=>String(value),tooltipFormatter:(ctx:HysTableCellContext<Person>)=>ctx.row.name}]
export const tableChecks=[h(HysTable<Person>,{ref:ref<HysTableInstance<Person>>(),rows,columns,selectable:(row,index)=>row.id!==0,pagination:{pageSize:5},treeMode:true,loadChildren:async(row:Person,ctx:HysTableLoadContext)=>{void ctx.signal;return []},onQueryChange:(query:HysTableQuery<Person>)=>void query.filters,onSelectionChange:(rows:Person[],keys:HysTableKey[])=>void [rows,keys],onRowClick:(row:Person)=>void row.name,resizable:true})]
export async function operateTable(api:HysTableInstance<Person>){await api.toggleRowSelection(1,true);api.setSort({key:'amount',direction:'desc'});api.setFilter('name',['A']);api.clearFilter();api.setPage(2);await api.setCurrentRow();api.resizeColumn('name',200);api.resetColumnWidths();await api.doLayout();return api.getSelectionRows()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {tableChecks} from './table-types'\nvoid tableChecks\n")
fs.writeFileSync(path.join(dir,'surfaces-types.ts'),`import {h} from 'vue'
import {HysBadge,HysCard,HysDivider,HysSkeleton,type HysCardTab,type HysSkeletonVariant} from 'hys-ui'
const tabs:HysCardTab[]=[{label:'Overview',value:0},{label:'Activity',value:'activity',disabled:true}],variant:HysSkeletonVariant='image'
export const surfacesChecks=[h(HysCard,{tabs,activeTab:0,headerStyle:{padding:16},bodyStyle:{padding:24},onTabChange:(value:string|number)=>void value}),h(HysBadge,{checkable:true,checked:true,offset:[2,'3px'],badgeStyle:{fontWeight:600},onChange:(checked:boolean,event:MouseEvent)=>void [checked,event]}),h(HysSkeleton,{variant,delay:100,minDuration:250,width:140,height:'100px',onVisibilityChange:(visible:boolean)=>void visible}),h(HysDivider,{orientation:'start',borderStyle:'double',orientationMargin:0})]
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {surfacesChecks} from './surfaces-types'\nvoid surfacesChecks\n")
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
