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
import {HysTable,type HysTableColumn,type HysTableInstance,type HysTableCellContext,type HysTableQuery,type HysTableLoadContext,type HysTableSelectionProps,type HysTableFilterConfirmOptions,type HysTableKey,type HysTableElementAttrs,type HysTablePaginationPosition} from 'hys-ui'
interface Person {id:number;name:string;amount:number;children?:Person[];hasChildren?:boolean}
const rows:Person[]=[{id:1,name:'A',amount:20}],columns:HysTableColumn<Person>[]=[{key:'name',label:'Name',fixed:'left',width:150,filterable:true},{key:'amount',label:'Amount',sortable:true,summary:'sum',sorter:(a,b)=>a.amount-b.amount,formatter:(row,col,value)=>String(value),tooltipFormatter:(ctx:HysTableCellContext<Person>)=>ctx.row.name}]
export const tableChecks=[h(HysTable<Person>,{ref:ref<HysTableInstance<Person>>(),rows,columns,selectable:(row,index)=>row.id!==0,pagination:{pageSize:5},treeMode:true,loadChildren:async(row:Person,ctx:HysTableLoadContext)=>{void ctx.signal;return []},onQueryChange:(query:HysTableQuery<Person>)=>void query.filters,onSelectionChange:(rows:Person[],keys:HysTableKey[])=>void [rows,keys],onRowClick:(row:Person)=>void row.name,resizable:true})]
const customSelection:HysTableSelectionProps={disabled:false,label:'Pick'};const confirmOptions:HysTableFilterConfirmOptions={closeDropdown:false};void confirmOptions;
export const tableExtras=h(HysTable<Person>,{rows,columns:[{...columns[0],sortBy:['name',row=>row.id],defaultSortOrder:'asc'}],tableLayout:'auto',selectionColumn:{fixed:'right',width:90},getSelectionProps:()=>customSelection,headerRowStyle:(_columns,level)=>({opacity:level?0.9:1}),filterColumnKey:null,showExpandColumn:false,allowDragLastColumn:false,onFilterOpenChange:key=>void key});
const position:HysTablePaginationPosition='top-right';const attrs:HysTableElementAttrs={'data-example':'member','aria-label':'Member'}
export const enhancedTable=h(HysTable<Person>,{rows,columns:[{...columns[0],rowScope:'row',filterMode:'tree',filterSearch:(query,option)=>option.label.includes(query),filters:[{label:'Group',value:'group',children:[{label:'A',value:'A'}]}],sortPriority:2,customCell:context=>({...attrs,onClick:()=>void context.row.name})}],rangeSelection:true,selectionActions:true,customRow:row=>({'data-row':row.id}),pagination:{position:[position,'bottom-center']},onSelectRange:(rows:Person[],range:Person[],checked:boolean)=>void [rows,range,checked]})
export async function operateTable(api:HysTableInstance<Person>){await api.toggleRowSelection(1,true,true);await api.invertSelection();api.setSort({key:'amount',direction:'desc'});api.setFilter('name',['A']);api.clearFilter();api.setPage(2);await api.setCurrentRow();api.resizeColumn('name',200);api.resetColumnWidths();await api.updateKeyChildren(1,[]);await api.showFilter('name');await api.hideFilter();api.setScrollLeft(10);api.setScrollTop(20);await api.scrollToRow(1,{block:'center'});void api.columns;await api.doLayout();return api.getSelectionRows()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {tableChecks} from './table-types'\nvoid tableChecks\n")
fs.writeFileSync(path.join(dir,'surfaces-types.ts'),`import {h} from 'vue'
import {HysBadge,HysCard,HysDivider,HysSkeleton,type HysCardTab,type HysSkeletonVariant} from 'hys-ui'
const tabs:HysCardTab[]=[{label:'Overview',value:0},{label:'Activity',value:'activity',disabled:true}],variant:HysSkeletonVariant='image'
export const surfacesChecks=[h(HysCard,{tabs,activeTab:0,headerStyle:{padding:16},bodyStyle:{padding:24},onTabChange:(value:string|number)=>void value}),h(HysBadge,{checkable:true,checked:true,offset:[2,'3px'],badgeStyle:{fontWeight:600},onChange:(checked:boolean,event:MouseEvent)=>void [checked,event]}),h(HysSkeleton,{variant,delay:100,minDuration:250,width:140,height:'100px',onVisibilityChange:(visible:boolean)=>void visible}),h(HysDivider,{orientation:'start',borderStyle:'double',orientationMargin:0})]
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {surfacesChecks} from './surfaces-types'\nvoid surfacesChecks\n")
fs.writeFileSync(path.join(dir,'transfer-types.ts'),`import {h,ref} from 'vue'
import {HysTransfer,type HysTransferInstance,type HysTransferSide,type HysTransferPanelContext,type HysTransferSlots,type HysTransferOption} from 'hys-ui'
interface Member {id:string;name:string;locked?:boolean}
const options:Member[]=[{id:'a',name:'A'}],api=ref<HysTransferInstance<Member,string>>()
export const transferChecks=[h(HysTransfer<Member,string>,{ref:api,options,modelValue:['a'],checkedKeys:[],fieldNames:{value:'id',label:'name',disabled:'locked'},filterMethod:(query,item,side)=>item.name.includes(query)&&side==='left',pagination:{pageSize:6,showSizeChanger:true},virtual:true,moveAnimation:'flight',moveOnDoubleClick:true,moveDuration:240,maxAnimatedItems:6,highlightOnArrival:true,listStyle:{height:250},onChange:(keys:string[],side:HysTransferSide,moved:string[])=>void [keys,side,moved],onCheckChange:(side:HysTransferSide,keys:string[])=>void keys}),h(HysTransfer<HysTransferOption<number>,number>,{options:[{value:0,label:'Zero'}],defaultValue:[0]})]
export const panel:HysTransferSlots<Member,string>['panel']=(scope:HysTransferPanelContext<Member,string>)=>h('p',scope.items.map(item=>item.name).join(','))
export async function operateTransfer(instance:HysTransferInstance<Member,string>){await instance.setCheckedKeys(['a']);await instance.checkAll('left',true,'filtered');await instance.invertSelection('right');instance.setSearch('left','A');instance.clearSearch();instance.setPageSize('left',5);instance.setPage('left',2);await instance.scrollTo('left',{key:'a'});instance.focus('right');return [await instance.move('right',['a']),instance.getTargetItems(),instance.getCheckedKeys()]}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {transferChecks} from './transfer-types'\nvoid transferChecks\n")
fs.writeFileSync(path.join(dir,'tree-types.ts'),`import {h,ref} from 'vue'
import {HysTree,type TreeNode,type HysTreeProps,type HysTreeInstance,type HysTreeKey,type HysTreeDropInfo,type HysTreeLoadContext} from 'hys-ui'
interface Department {code:number;meta:{title:string};teams?:Department[]}
const api=ref<HysTreeInstance<Department>>(),nodes:Department[]=[{code:0,meta:{title:'Root'}}]
export const treeChecks=[h(HysTree<number|null,Department>,{ref:api,nodes,modelValue:0,nodeKey:'code',fieldNames:{label:'meta.title',children:'teams'},loadChildren:async(node:Department,ctx:HysTreeLoadContext)=>ctx.signal.aborted?[]:[{code:node.code+1,meta:{title:'Child'}}]}),h(HysTree<string,TreeNode>,{nodes:[{id:'a',label:'A'}],'onNode-drop':(info:HysTreeDropInfo<TreeNode,string>)=>void info.dragId})]
export const props:HysTreeProps<Department>={nodes,defaultValue:0,defaultCheckedKeys:[0],virtual:true,filterNode:(query,item)=>item.meta.title.includes(query)}
export async function editTree(instance:HysTreeInstance<Department>){await instance.setCheckedKeys([0]);await instance.setCurrentKey(0);await instance.scrollTo({key:0});await instance.focus(0);return [await instance.append({code:1,meta:{title:'Added'}},0),instance.getHalfCheckedNodes(),instance.getCurrentNode()]}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {treeChecks} from './tree-types'\nvoid treeChecks\n")
fs.writeFileSync(path.join(dir,'tree-select-types.ts'),`import {h,ref} from 'vue'
import {HysTreeSelect,type HysTreeSelectNode,type HysTreeSelectInstance,type HysTreeSelectLabelValue,type HysTreeSelectChange,type HysTreeSelectProps} from 'hys-ui'
interface Team {code:number;meta:{name:string};members?:Team[]}
const api=ref<HysTreeSelectInstance<Team>>(),nodes:Team[]=[{code:0,meta:{name:'Main'}}]
export const treeSelectChecks=[h(HysTreeSelect<number|null,Team>,{ref:api,nodes,modelValue:0,fieldNames:{value:'code',label:'meta.name',children:'members'},virtual:true,popupMatchWidth:false,onChange:(value:number|null,info:HysTreeSelectChange<Team>)=>void [value,info.items],loadChildren:async(node,ctx)=>ctx.signal.aborted?[]:[{code:node.code+1,meta:{name:'Child'}}]}),h(HysTreeSelect<string,HysTreeSelectNode>,{nodes:[{value:'a',label:'A'}],modelValue:'a'}),h(HysTreeSelect<HysTreeSelectLabelValue|null,Team>,{nodes,labelInValue:true,modelValue:{value:0,label:'Main'}})]
export const props:HysTreeSelectProps<Team>={nodes,defaultValue:0,remote:true,remoteMethod:async(query,{signal})=>signal.aborted?[]:nodes.filter(node=>node.meta.name.includes(query))}
export async function useTreeSelect(instance:HysTreeSelectInstance<Team>){await instance.show();await instance.setValue(0);await instance.scrollTo({key:0});const selected=instance.getSelectedItems();await instance.removeTag(0);instance.hide(true);return selected}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {treeSelectChecks} from './tree-select-types'\nvoid treeSelectChecks\n")
fs.writeFileSync(path.join(dir,'cascader-types.ts'),`import {h,ref} from 'vue'
import {HysCascader,type HysCascaderNode,type HysCascaderDataNode,type HysCascaderPath,type HysCascaderValue,type HysCascaderProps,type HysCascaderInstance,type HysCascaderItem,type HysCascaderOptionContext,type HysCascaderChange} from 'hys-ui'
interface Department {code:number;meta:{name:string};teams?:Department[];leaf?:boolean}
const options:Department[]=[{code:0,meta:{name:'Head office'}}],api=ref<HysCascaderInstance<Department>>()
export const cascaderChecks=[h(HysCascader<number|null,Department>,{ref:api,options,modelValue:0,emitPath:false,checkStrictly:true,fieldNames:{value:'code',label:'meta.name',children:'teams',leaf:'leaf'},loadChildren:async(node,ctx)=>ctx.signal.aborted?[]:[{code:node.code+1,meta:{name:'Team'},leaf:true}],onChange:(value:number|null,info:HysCascaderChange<Department>)=>void [value,info.items],displayRender:(item:HysCascaderItem<Department>)=>item.labels.join(' / ')}),h(HysCascader<string[],HysCascaderNode>,{options:[{value:'a',label:'A'}],modelValue:['a']}),h(HysCascader<readonly HysCascaderPath[],HysCascaderDataNode>,{options:[{value:0,label:'Zero'}],modelValue:[[0]],multiple:true,inline:true,virtual:true})]
export const cascaderProps:HysCascaderProps<Department>={options,defaultValue:0,emitPath:false,beforeFilter:async(query,{signal})=>!signal.aborted&&query.length>1,loadRoot:async({signal})=>signal.aborted?[]:options}
export async function operateCascader(instance:HysCascaderInstance<Department>){const value:HysCascaderValue=[0,1];await instance.setValue(value);await instance.setExpandedPath([0]);await instance.scrollTo([0,1]);await instance.reloadNode([0]);await instance.clearCheckedNodes();return instance.getCheckedNodes(true)}
export function readOption(option:HysCascaderOptionContext<Department>){return [option.node.code,option.path,option.labels,option.level,option.checked]}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {cascaderChecks} from './cascader-types'\nvoid cascaderChecks\n")
fs.writeFileSync(path.join(dir,'date-picker-types.ts'),`import {h,ref} from 'vue'
import {HysDatePicker,HysDateRangePicker,type HysDatePickerWeek,type HysDatePickerProps,type HysDateRangePickerProps,type HysDatePickerInstance,type HysDateRangePickerInstance,type HysDatePickerChange,type HysDatePickerCell,type HysDateShortcut} from 'hys-ui'
const date=ref<HysDatePickerInstance<Date|null>>(),range=ref<HysDateRangePickerInstance<readonly [number|null,number|null]|null>>()
export const dateChecks=[h(HysDatePicker<Date|null>,{ref:date,defaultValue:null,valueType:'date',disabledTime:(date,context)=>({hours:context.range==='start'?[0,1]:[],minutes:hour=>hour===9?[0]:[]}),onChange:(value:Date|null,info:HysDatePickerChange)=>void [value,info.formatted]}),h(HysDateRangePicker<readonly [number|null,number|null]|null>,{ref:range,modelValue:[0,null],valueType:'timestamp',allowEmpty:[false,true],disabled:[true,false],singlePanel:false}),h(HysDatePicker<readonly string[]>,{defaultValue:['2026-11-03'],type:'dates',maxDates:3})]
export const scalarProps:HysDatePickerProps<Date|null>={defaultValue:new Date(),valueType:'date',cellClassName:cell=>cell.inRange?'in-range':''}
export const rangeProps:HysDateRangePickerProps={modelValue:['2026-11-03',null],showTime:true,allowEmpty:[false,true],shortcuts:[{label:'Now',value:()=>[new Date(),new Date()]}]}
export const shortcut:HysDateShortcut={label:'Today',value:()=>new Date()}
export function readCell(cell:HysDatePickerCell){return [cell.date.getUTCDate(),cell.iso,cell.type,cell.selected]}
export const weeklyDate=h(HysDatePicker<readonly string[]>,{type:'weeks',modelValue:['2026-11-02'],firstWeekContainsDate:4,weekValidation:'full',disabledWeek:(week:HysDatePickerWeek)=>week.week===1,onChange:(_value,info)=>void info.weeks});
export async function operateDate(api:HysDatePickerInstance<Date|null>){await api.setValue(new Date());await api.showMonth('2026-11-01');api.setMode('month');await api.confirm();api.cancel();return api.draft}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {dateChecks} from './date-picker-types'\nvoid dateChecks\n")
fs.writeFileSync(path.join(dir,'modal-types.ts'),`import {h,ref} from 'vue'
import {HysModal,createHysModal,useHysModal,type HysModalProps,type HysModalInstance,type HysModalActionContext,type HysModalOptions,type HysModalResult,type HysModalSlotContext} from 'hys-ui'
const instance=ref<HysModalInstance>()
export const modalChecks=h(HysModal,{ref:instance,defaultOpen:true,footer:true,draggable:true,resizable:true,confirmOnCtrlEnter:true,initialFocus:'cancel',beforeConfirm:async({signal}:HysModalActionContext)=>!signal.aborted,beforeClose:(reason:'mask'|'escape'|'button')=>reason!=='mask',onOk:(context:HysModalActionContext)=>void context.signal,onDragEnd:(position,info)=>void [position.x,info.cancelled]},{footer:({confirm,busy}:HysModalSlotContext)=>h('button',{disabled:busy,onClick:confirm},'Save')})
export const modalProps:HysModalProps={modelValue:true,dragEffect:'glow',size:'2xl',headerSize:'sm',footerSize:'lg',opacity:.95,maskOpacity:.4,transition:{name:'fade'},bodyStyle:{padding:'24px'},okButtonProps:{variant:'danger'},beforeClose:async(reason,context)=>reason==='confirm'||!context.signal.aborted}
export function actualModal(actual:InstanceType<typeof HysModal>):HysModalInstance{return actual}
export async function operateModal(api:HysModalInstance){api.resetPosition();api.setPosition({x:10,y:20});api.setSize({width:600,height:400});await api.setFullscreen(true);await api.confirm();return api.dimensions}
export function scopedDialogs(){const dialogs=useHysModal(),options:HysModalOptions={title:'Confirm',content:()=>h('p','Content'),onOk:async({signal})=>!signal.aborted};return dialogs.confirm(options)}
export async function standaloneDialogs(){const dialogs=createHysModal({theme:'blue',motion:'off',defaults:{width:600}}),item=dialogs.info('Ready');item.update({content:'Done'});item.destroy();const result:HysModalResult=await item.closed;dialogs.dispose();return result.action}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {modalChecks} from './modal-types'\nvoid modalChecks\n")
fs.writeFileSync(path.join(dir,'popup-motion-types.ts'),`import {h} from 'vue'
import {HysSelect,HysAutocomplete,HysDatePicker,HysDateRangePicker,HysTooltip,HysPopover,HysAvatarGroup,HysTable,HysGantt,HysTreeSelect,HysCascader,type HysPopupMotionProps,type HysPopupTransition} from 'hys-ui'
const transition:HysPopupTransition='slide-fade'
const motion:HysPopupMotionProps={popupTransition:transition,popupTransitionDuration:240}
export const popupChecks=[h(HysSelect,{options:[],...motion}),h(HysAutocomplete,{...motion}),h(HysDatePicker,{...motion}),h(HysDateRangePicker,{...motion}),h(HysTooltip,{text:'Help',...motion}),h(HysPopover,{...motion}),h(HysAvatarGroup,{options:[],...motion}),h(HysTable,{rows:[],columns:[],...motion}),h(HysGantt,{items:[],...motion}),h(HysTreeSelect,{nodes:[],...motion}),h(HysCascader,{options:[],...motion})]
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {popupChecks} from './popup-motion-types'\nvoid popupChecks\n")
fs.writeFileSync(path.join(dir,'select-bulk-types.ts'),`import {h} from 'vue'
import {HysSelect,type HysSelectInstance,type HysSelectOption} from 'hys-ui'
export const batchCheck=h(HysSelect<string[]>,{modelValue:[],options:[],multiple:true,showSelectAll:true,selectAllScope:'filtered',selectAllText:'选择全部',deselectAllText:'取消全部',onSelectAll:(value:string[],added:HysSelectOption[])=>[value,added],onDeselectAll:(value:string[],removed:HysSelectOption[])=>[value,removed]})
export function batchMethods(api:HysSelectInstance):number{return api.selectAll()+api.deselectAll()}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {batchCheck} from './select-bulk-types'\nvoid batchCheck\n")
fs.writeFileSync(path.join(dir,'menu-types.ts'),`import {h,ref} from 'vue'
import {HysContextMenu,HysBreadcrumb,type HysContextMenuItem,type HysMenuKey,type HysMenuSelectInfo,type HysContextMenuProps,type HysContextMenuInstance,type HysBreadcrumbItem,type HysBreadcrumbSelectInfo} from 'hys-ui'
const items:HysContextMenuItem[]=[{label:'Export',value:1,children:[{label:'CSV',value:2}]},{label:'Check',value:'check',type:'checkbox'}]
const menuProps:HysContextMenuProps={items,trigger:['click','contextmenu'],defaultOpenPath:[1],checkedKeys:['check'],maxHeight:240,popupTransition:'fade'}
export const menuChecks=[h(HysContextMenu<HysContextMenuItem>,{...menuProps,ref:ref<HysContextMenuInstance>(),onSelect:(value:HysMenuKey,info:HysMenuSelectInfo)=>void [value,info.path]}),h(HysContextMenu<{code:number;name:string}>,{items:[{code:3,name:'Raw'}],fieldNames:{value:'code',label:'name'},onSelect:(value:HysMenuKey,info:HysMenuSelectInfo<{code:number;name:string}>)=>void [value,info.item.code]})]
type ActualMenu=Parameters<NonNullable<Parameters<typeof HysContextMenu<HysContextMenuItem>>[2]>>[0]
export function actualMenu(actual:ActualMenu):HysContextMenuInstance{return actual}
export async function operateMenu(api:HysContextMenuInstance){await api.showAt(10,10);await api.openSubmenu(1);await api.focusItem(2);await api.setCheckedKeys(['check']);await api.setSelectedKeys([1]);await api.closeSubmenus();await api.hide(true);return api.getItems()}
const crumbs:readonly HysBreadcrumbItem[]=[{label:'Home',to:{path:'/'},children:[{label:'Sibling',href:'/sibling'}]},{label:'Current'}]
export const crumbChecks=h(HysBreadcrumb,{items:crumbs,maxItems:4,maxItemWidth:180,size:'sm',popupTransition:'slide',onDropdownSelect:(item:HysBreadcrumbItem,info:HysBreadcrumbSelectInfo)=>void [item.label,info.source]})
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {menuChecks,crumbChecks} from './menu-types'\nvoid menuChecks\nvoid crumbChecks\n")
fs.writeFileSync(path.join(dir,'menu-fixture.vue'),`<script setup lang="ts">
import {ref} from 'vue'
import {HysContextMenu,HysButton,type HysMenuSelectInfo,type HysMenuKey,type HysContextMenuInstance} from 'hys-ui'
const items=[{label:'Open',value:'open'}],raw=[{code:1,title:'Raw'}],menu=ref<HysContextMenuInstance<{label:string;value:string}>>()
function selected(value:string,info:HysMenuSelectInfo<{label:string;value:string}>){void [value,info.item.label]}
function mapped(value:HysMenuKey,info:HysMenuSelectInfo<{code:number;title:string}>){void [value,info.item.code]}
</script><template><HysContextMenu ref="menu" :items="items" @select="selected"><HysButton>Actions</HysButton></HysContextMenu><HysContextMenu :items="raw" :field-names="{value:'code',label:'title'}" @select="mapped"><HysButton>Mapped actions</HysButton></HysContextMenu></template>`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport MenuFixture from './menu-fixture.vue'\nvoid MenuFixture\n")
fs.writeFileSync(path.join(dir,'drawer-types.ts'),`import {h,ref} from 'vue'
import {HysDrawer,type HysDrawerProps,type HysDrawerInstance,type HysDrawerPlacement,type HysDrawerBeforeClose,type HysDrawerActionContext,type HysDrawerResizeInfo} from 'hys-ui'
const placement:HysDrawerPlacement='left',guard:HysDrawerBeforeClose=(reason:'mask'|'escape'|'button')=>reason!=='escape'
const props:HysDrawerProps={placement,size:'lg',width:560,footer:true,contained:true,appendTo:false,resizable:{minSize:'25%',maxSize:800,step:10},push:{distance:120},transition:'slide-fade',beforeClose:guard,beforeConfirm:async(context:HysDrawerActionContext)=>!context.signal.aborted}
export const drawerChecks=h(HysDrawer,{...props,ref:ref<HysDrawerInstance>(),onResizeEnd:(size:number,info:HysDrawerResizeInfo)=>void [size,info.accepted],onClose:()=>{}})
export function actualDrawer(instance:InstanceType<typeof HysDrawer>):HysDrawerInstance{return instance}
export async function operateDrawer(instance:HysDrawerInstance){await instance.show();await instance.resizeTo('65%');await instance.resetSize();await instance.toggleFullscreen();await instance.setFullscreen(false);await instance.close('api');return instance.body}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {drawerChecks} from './drawer-types'\nvoid drawerChecks\n")
fs.writeFileSync(path.join(dir,'surface-types.ts'),`import {h,ref} from 'vue'
import {HysTooltip,HysPopover,type HysTooltipProps,type HysPopoverProps,type HysPopupPlacement,type HysPopupTrigger,type HysPopupSurfaceInstance,type HysPopupSurfaceContext,type HysPopupVirtualReference} from 'hys-ui'
const placement:HysPopupPlacement='left-end',triggers:readonly HysPopupTrigger[]=['hover','focus'],reference:HysPopupVirtualReference={getBoundingClientRect:()=>new DOMRect(100,100,20,20)}
const props:HysTooltipProps={placement,trigger:triggers,reference,defaultOpen:false,enterable:true,showArrow:true,autoClose:1000,width:240,maxHeight:200,appendTo:false}
const popover:HysPopoverProps={modelValue:false,title:'Details',content:'Content',width:'20rem',effect:'light',closeOnOutside:false,destroyOnHide:false}
export const surfaceChecks=[h(HysTooltip,{...props,ref:ref<HysPopupSurfaceInstance>()},{content:({close}:HysPopupSurfaceContext)=>h('span',String(close))}),h(HysPopover,{...popover,onOpenChange:(open:boolean)=>void open})]
export function actualTooltip(instance:InstanceType<typeof HysTooltip>):HysPopupSurfaceInstance{return instance}
export function actualPopover(instance:InstanceType<typeof HysPopover>):HysPopupSurfaceInstance{return instance}
export async function operateSurface(instance:HysPopupSurfaceInstance){await instance.show();await instance.toggle();instance.updatePosition();instance.focus();await instance.close();return instance.placement}
`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport {surfaceChecks} from './surface-types'\nvoid surfaceChecks\n")
fs.writeFileSync(path.join(dir,'upload-fixture.vue'),`<script setup lang="ts">
import {ref} from 'vue'
import {HysUpload,HysButton,type HysUploadFile,type HysUploadItem,type HysUploadProps,type HysUploadInstance,type HysUploadRequestOptions,type HysUploadChange} from 'hys-ui'
const local=ref<HysUploadFile[]>([]),remote=ref<HysUploadItem[]>([{uid:'saved',name:'saved.pdf',url:'/saved.pdf'}]),api=ref<HysUploadInstance>()
const props:HysUploadProps={action:async(file,context)=>{const raw:File=file.raw;void [raw,context.signal];return '/upload'},data:async()=>({tags:['a','b'],id:1}),beforeUpload:async(raw,context)=>context.signal.aborted?false:new Blob([raw]),customRequest(options:HysUploadRequestOptions){const original:File=options.file.raw;options.onProgress(50);void original;return{abort(){},promise:Promise.resolve({ok:true})}}}
function changed(files:HysUploadFile[]){files.forEach(file=>{const raw:File=file.raw;void raw})}
function detailed(info:HysUploadChange){const name:string=info.changed[0]?.name??'';void name}
interface BusinessFile extends HysUploadFile {documentId:string}
const business=ref<BusinessFile[]>([])
function createFile(raw:File,uid:string):BusinessFile{return{uid,name:raw.name,size:raw.size,raw,documentId:uid}}
// @ts-expect-error The legacy local-file type still requires raw.
const invalid:HysUploadFile={uid:'x',name:'x',size:0}
void invalid
async function methods(instance:HysUploadInstance){await instance.addFiles([new File(['x'],'x.txt')]);await instance.submit();instance.abort();await instance.retry('x');await instance.remove('x');await instance.clearFiles(['success']);const raw:File|undefined=instance.files[0]?.raw;void raw}
void methods
async function transformUpload(raw:File){return new File([await raw.text()," converted"],"converted.txt",{type:"text/plain"})}
</script><template><HysUpload ref="api" v-model:file-list="local" v-bind="props" @change="changed" @file-change="detailed"><template #trigger="{disabled,open}"><HysButton :disabled="disabled" @click.stop="open">Choose</HysButton></template><template #item="{file,actions}"><HysButton @click="actions.remove()">{{file.raw.name}}</HysButton></template></HysUpload><HysUpload v-model:file-list="remote" :before-remove="file=>file.uid!=='locked'"/><HysUpload v-model:file-list="business" :create-file="createFile"><template #file="{file}">{{file.documentId}}</template></HysUpload><HysUpload aria-label="Protocol upload" action="/upload-protocol" method="PUT" name="attachment" :headers="{'X-Upload-Test':'consumer'}" :data="{tags:['one','two'],document:7}" :before-upload="transformUpload" /></template>`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport UploadFixture from './upload-fixture.vue'\nconst uploadHost=document.createElement('section');uploadHost.id='upload-fixture';document.body.append(uploadHost);createApp(UploadFixture).mount(uploadHost)\n")
fs.writeFileSync(path.join(dir,'progress-fixture.vue'),`<script setup lang="ts">
import {h,ref} from 'vue'
import {HysProgress,HysButton,provideHysConfig,type HysProgressProps,type HysProgressInstance,type HysProgressColor,type HysProgressGradient,type HysProgressColorStop,type HysProgressLabelContext,type HysMotion} from 'hys-ui'
const value=ref(42),motion=ref<HysMotion>('subtle'),api=ref<HysProgressInstance>()
provideHysConfig({theme:'green',motion})
const gradient:HysProgressGradient={from:'#06b6d4',to:'#8b5cf6',direction:90,stops:[{offset:50,color:'#3867f5'}]}
const thresholds:readonly HysProgressColorStop[]=[{value:30,color:'red'},{value:100,color:'green'}]
const strategy:HysProgressColor=(value:number)=>value>50?'green':'orange'
const config:HysProgressProps={value:50,type:'dashboard',success:{value:20,color:gradient},gapPosition:'left',steps:12,strokeLinecap:'butt',ariaValueText:(context:HysProgressLabelContext)=>context.value+' percent',format:(value,success)=>h('strong',success+' of '+value)}
function actual(instance:InstanceType<typeof HysProgress>):HysProgressInstance{return instance}
void [thresholds,strategy,config,actual]
</script><template><div style="display:grid;gap:20px;max-width:500px;padding:20px"><HysButton @click="value=value===42?78:42">Update progress</HysButton><HysButton @click="motion=motion==='off'?'subtle':'off'">Toggle progress motion</HysButton><HysProgress ref="api" :value="value" :success="{value:20}" :color="gradient" aria-label="Installed line"/><HysProgress :value="value" type="circle" :color="gradient" aria-label="Installed circle"><template #default="{value,successValue}">{{value.toFixed(0)}} / {{successValue}}</template></HysProgress><HysProgress :value="value" type="dashboard" :steps="12" aria-label="Installed dashboard"/><HysProgress :value="0" indeterminate aria-label="Installed waiting" :format="()=>'Working'"/></div></template>`)
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport ProgressFixture from './progress-fixture.vue'\nconst progressHost=document.createElement('section');progressHost.id='progress-fixture';document.body.append(progressHost);createApp(ProgressFixture).mount(progressHost)\n")
fs.copyFileSync(path.join(root,'scripts/consumer-feedback.vue'),path.join(dir,'feedback-fixture.vue'))
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport FeedbackFixture from './feedback-fixture.vue'\nconst feedbackHost=document.createElement('section');feedbackHost.id='feedback-fixture';document.body.append(feedbackHost);createApp(FeedbackFixture).mount(feedbackHost)\n")
fs.copyFileSync(path.join(root,'scripts/consumer-tag-color.vue'),path.join(dir,'tag-color-fixture.vue'))
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport TagColorFixture from './tag-color-fixture.vue'\nconst tagColorHost=document.createElement('section');tagColorHost.id='tag-color-fixture';document.body.append(tagColorHost);createApp(TagColorFixture).mount(tagColorHost)\n")
fs.copyFileSync(path.join(root,'scripts/consumer-virtual-table.vue'),path.join(dir,'virtual-table-fixture.vue'))
fs.appendFileSync(path.join(dir,'main.ts'),"\nimport VirtualTableFixture from './virtual-table-fixture.vue'\nconst virtualTableHost=document.createElement('section');virtualTableHost.id='virtual-table-fixture';document.body.append(virtualTableHost);createApp(VirtualTableFixture).mount(virtualTableHost)\n")
fs.appendFileSync(path.join(dir,'main.ts'),`\nimport type {GridColumn,HysDataGridInstance,HysDataGridLoader,HysDataGridProps} from 'hys-ui'
type Invoice = {id: number; amount: number}
const gridColumn: GridColumn<Invoice> = {key:'amount',label:'Amount',sortMethod:(a,b)=>a.amount-b.amount}
const gridLoader: HysDataGridLoader<Invoice> = (query,{signal}) => {
  signal.throwIfAborted()
  return {rows:[{id:query.page,amount:1}],total:1}
}
const gridProps: HysDataGridProps<Invoice> = {rows:[],columns:[gridColumn],loadRows:gridLoader,rowKey:row=>row.id}
function gridSelection(grid: HysDataGridInstance) { return grid.getSelection() }
void [gridProps,gridSelection]
`)
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
