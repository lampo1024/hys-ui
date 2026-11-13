<script setup lang="ts">
import {computed,defineAsyncComponent,onActivated,onDeactivated,onBeforeUnmount,ref,shallowRef,watch} from 'vue'
import {HysButton,HysBadge,HysTabs} from 'hys-ui'
import {ArrowDown,ChevronDown,RotateCcw,Code2} from 'lucide-vue-next'
import scenarioTitles from './scenario-titles.json'
import apiLoaders from 'virtual:hys-docs-api'
import type {ComponentApi} from './apiTypes'
import ExampleSource from './ExampleSource.vue'
import FormRuleReference from './FormRuleReference.vue'
import SelectReference from './SelectReference.vue'
import NumberInputReference from './NumberInputReference.vue'
import InputReference from './InputReference.vue'
import SliderReference from './SliderReference.vue'
import AvatarReference from './AvatarReference.vue'
import AutocompleteReference from './AutocompleteReference.vue'
import ChoiceReference from './ChoiceReference.vue'
import RatingSegmentedReference from './RatingSegmentedReference.vue'
import GanttReference from './GanttReference.vue'
import CalendarReference from './CalendarReference.vue'
import TableReference from './TableReference.vue'
import MentionReference from './MentionReference.vue'
import TransferReference from './TransferReference.vue'
import TreeReference from './TreeReference.vue'
import TreeSelectReference from './TreeSelectReference.vue'
import CascaderReference from './CascaderReference.vue'
import DatePickerReference from './DatePickerReference.vue'
import ModalReference from './ModalReference.vue'
import UploadReference from './UploadReference.vue'
import ProgressReference from './ProgressReference.vue'
import FeedbackTimelineReference from './FeedbackTimelineReference.vue'
import TagColorReference from './TagColorReference.vue'
import VirtualTableReference from './VirtualTableReference.vue'
import AnimatedNumberReference from './components/AnimatedNumberReference/AnimatedNumberReference.vue'
import SortableListReference from './components/SortableListReference/SortableListReference.vue'
import ToastReference from './components/ToastReference/ToastReference.vue'
import SpinReference from './components/SpinReference/SpinReference.vue'
import IconReference from './components/IconReference/IconReference.vue'
import PopconfirmReference from './components/PopconfirmReference/PopconfirmReference.vue'
import DescriptionsReference from './components/DescriptionsReference/DescriptionsReference.vue'
import TabsReference from './components/TabsReference/TabsReference.vue'
import {useDocToc} from './useDocToc'
import type {ExampleSourceData} from './sourceTypes'
import {catalog} from './catalog'
import capabilities from './component-capabilities.json'
import {clearExamplePasswords} from './examplePasswords'
const props=defineProps<{name:string}>()
const active=ref(true)
onActivated(()=>active.value=true)
onDeactivated(()=>active.value=false)
const metadata=shallowRef<ComponentApi>({props:[],events:[],slots:[],exposed:[]}),apiPending=ref(false),apiError=ref('')
let apiRequest=0
async function loadApi(name=props.name){const request=++apiRequest;apiPending.value=true;apiError.value='';try{const load=apiLoaders[name];if(!load)throw Error('Missing component API');const result=await load();if(request===apiRequest)metadata.value=result.default}catch{if(request===apiRequest)apiError.value='接口信息暂时无法加载'}finally{if(request===apiRequest)apiPending.value=false}}
watch(()=>props.name,name=>{void loadApi(name)},{immediate:true})
onBeforeUnmount(()=>apiRequest++)
const entry=computed(()=>catalog.find(x=>x.name===props.name)!)
const capability=computed(()=>capabilities[props.name as keyof typeof capabilities])
const modules=import.meta.glob('./examples/*/*.vue')
const sources=import.meta.glob('./examples/*/*.vue',{query:'?example-source&raw',import:'default'})
const order:Record<string,number>={Basic:0,Configure:1,Features:2,Rules:2,Width:3,ManyOptions:3.5,Bulk:3.6,Search:4,Remote:5,Dynamic:5,Custom:6,Keyboard:7,Lifecycle:8,Nested:8,Dependencies:9,Guard:9,Overflow:10,Methods:10,Feedback:11,Registration:2,Inline:3,Alignment:4,Layout:4,Number:6,Policy:12,Data:13,Accessibility:14,Presentation:7,Conditional:8,ControlAdapter:9,Groups:3,Values:4,Limits:5,Create:6,AsyncSearch:7,Virtual:8,Control:9,Infinite:10,Nullable:2,Precision:3,Format:4,StringMode:5,Controls:6,Timing:7,Events:8,Form:9,States:98,Disabled:99}
const tagColorOrder:Record<string,string[]>={HysTagInput:["Basic","Configure","Trigger","Tokens","Limits","Async","Collapse","Appearance","Dragging","Custom","Controlled","Methods","Form","Lifecycle","States","PopupMotion"],HysColorPicker:["Basic","Configure","Alpha","Formats","Presets","Confirm","Inline","Appearance","Controlled","Custom","Mount","Methods","Form","Performance","Lifecycle","States","PopupMotion"]}
const feedbackOrder:Record<string,string[]>={HysAlert:['Basic','Configure','Appearance','Content','Controlled','Async','Motion','Accessibility','Lifecycle','States'],HysEmpty:['Basic','Configure','Illustrations','Image','Content','Accessibility','States'],HysTimeline:['Basic','Configure','Layout','Nodes','Timestamps','Pending','Custom','Mapping','Dynamic','States']}
const progressOrder=['Basic','Configure','Shapes','Colors','Gradient','Success','Steps','Labels','Statuses','Sizes','Motion','Indeterminate','Accessibility','Lifecycle','States']
const uploadOrder=['Basic','Configure','Automatic','Manual','Request','Single','Lists','Controlled','Validation','Removal','Custom','InputMethods','Form','Methods','Lifecycle','States']
const inputOrder=['Basic','Configure','Disabled','Clearable','ClearIcon','NativeControls','ModelCommit','Formatter','Password','Icons','Textarea','Autosize','Mixed','Sizes','Length','Graphemes','Methods','Affixes','Validation']
const sliderOrder=['Basic','Configure','Sizes','Precision','Range','Marks','Number','Orientation','Custom','Tooltip','Performance','Keyboard','Form','States']
const avatarOrder=['Basic','Configure','Types','Fallback','Fit','Autosize','Responsive','Badge','Image','Group','Collapse','Custom','Vertical','Dynamic','States']
const autocompleteOrder=['Basic','Configure','Template','CustomInput','Remote','Loading','HeaderFooter','Status','ClearIcon','Options','CaseInsensitive','Categories','Query','Keyboard','AfterSelect','Form','States']
const choiceOrder=['Basic','Configure','Values','Array','All','Limits','Appearance','Buttons','Grid','Sizes','Content','Icons','Slots','Custom','Dynamic','Async','Controlled','Keyboard','RTL','Methods','Form','States']
const ratingOrder=['Basic','Configure','Half','Text','Colors','Icons','Sizes','Tooltips','Controlled','Keyboard','Methods','Form','States'],segmentedOrder=['Basic','Configure','Values','Layout','Content','Dynamic','Controlled','Keyboard','RTL','Methods','Form','States']
const ganttOrder=['Basic','Configure','Scrolling','LargeData','Dependencies','DependencyRouting','Reconnecting','MultipleDependencies','History','Conflicts','ConflictPreview','States']
const calendarOrder=['Basic','Configure','Motion','Selection','Year','Card','Events','Custom','Header','Range','Limits','Locale','Methods','States']
const virtualTableOrder=['Basic','Configure','Fixed','Wide','Selection','Remote','Append','Keyboard','Templates','Lifecycle','States']
const tableOrder=['Basic','Configure','Layout','Fixed','Sticky','Grouped','Structure','Sort','SortFields','Filters','FilterSearch','CustomFilter','FilterControl','ColumnControl','Selection','SelectionActions','SelectionCustom','Current','Reserve','Expand','ExpandCustom','Tree','Lazy','UpdateChildren','Summary','Span','Templates','Overflow','Resize','Editing','Responsive','Attributes','Pagination','Locale','Server','Methods','Scroll','States']
const surfaceOrder:Record<string,string[]>={HysPagination:["Basic","Configure","Layout","Bounds","Controlled"],HysTooltip:["Basic","Configure","Triggers","Placements","Controlled","Delay","Hover","Appearance","Sizes","Content","Input","Reference","Mount","Lifecycle","Methods","PopupMotion","States"],HysPopover:["Basic","Configure","Triggers","Placements","Controlled","Delay","Hover","Appearance","Sizes","Content","Input","Reference","Mount","Lifecycle","Methods","PopupMotion","States"],HysDrawer:["Basic","Configure","Sizes","Sections","Overflow","Async","Form","Guard","Controlled","Lifecycle","Contained","Nested","Resize","Layout","Appearance","Focus","Custom","Motion","States"],HysContextMenu:["Basic","Configure","Submenus","Checking","Selection","Controlled","Mapping","Custom","Position","Methods","Nested","States"],HysBreadcrumb:["Basic","Configure","Icons","Dropdown","Collapse","Router","Truncate","Custom","States"],HysModal:["Basic","Configure","Sizes","Sections","Async","Form","Guard","Layout","Overflow","DragResize","PreviewDrag","Recovery","Custom","Lifecycle","Nested","Focus","Service","ServiceUpdate","Motion","Appearance","Performance","States"],HysDatePicker:["Basic","Configure","Types","Weeks","WeekMultiple","WeekYear","WeekRules","WeekBounds","Formats","FormatAlternatives","UnifiedRange","Multiple","Shortcuts","Bounds","Time","TimePanel","Input","Custom","PanelPlacement","Inline","Controlled","Form","Keyboard","Locale","States"],HysDateRangePicker:["Basic","Configure","Units","Weeks","Dual","PanelPresets","Shortcuts","Bounds","Time","Partial","Locked","Custom","Inline","Methods","States"],HysCascader:["Basic","Configure","Hover","Levels","Multiple","Strict","Tags","Mapping","Search","Async","Root","Custom","Inline","Virtual","Controlled","Methods","Form","Keyboard","States"],HysTreeSelect:["Basic","Configure","Expansion","Multiple","Checking","Tags","Mapping","Simple","Labels","Remote","Lazy","Custom","Popup","Virtual","Form","Keyboard","Methods","States"],HysTree:["Basic","Configure","Defaults","Checking","Expansion","Multiple","Filtering","Mapping","Custom","Async","DragDrop","Editing","Virtual","Form","Keyboard","Locale","States"],HysTransfer:["Basic","Configure","Search","Selection","SelectionKeys","Ordering","OneWay","Dragging","Movement","Mapping","Custom","Pagination","Virtual","CustomPanel","Form","Methods","Locale","Disabled","States"],HysBadge:["Basic","Configure","Appearance","Counters","Status","Placement","Selectable"],HysCard:["Basic","Configure","Content","Tabs","Loading"],HysDivider:["Basic","Configure","Styles","Direction"],HysSkeleton:["Basic","Configure","Variants","Repeated","Template","Loading"]}
function rank(path:string){const scene=path.split('/').pop()!.replace('.vue','');if(scene==='PopupMotion')return 95;if(props.name==='HysVirtualTable')return Math.max(0,virtualTableOrder.indexOf(scene));return tagColorOrder[props.name]?Math.max(0,tagColorOrder[props.name].indexOf(scene)):feedbackOrder[props.name]?Math.max(0,feedbackOrder[props.name].indexOf(scene)):surfaceOrder[props.name]?Math.max(0,surfaceOrder[props.name].indexOf(scene)):props.name==='HysTable'?Math.max(0,tableOrder.indexOf(scene)):props.name==='HysCalendar'?Math.max(0,calendarOrder.indexOf(scene)):props.name==='HysGantt'?Math.max(0,ganttOrder.indexOf(scene)):props.name==='HysProgress'?Math.max(0,progressOrder.indexOf(scene)):props.name==='HysUpload'?Math.max(0,uploadOrder.indexOf(scene)):props.name==='HysRating'?Math.max(0,ratingOrder.indexOf(scene)):props.name==='HysSegmented'?Math.max(0,segmentedOrder.indexOf(scene)):['HysCheckbox','HysCheckboxGroup','HysRadio','HysRadioGroup','HysSwitch'].includes(props.name)?Math.max(0,choiceOrder.indexOf(scene)):props.name==='HysAutocomplete'?Math.max(0,autocompleteOrder.indexOf(scene)):props.name==='HysAvatar'||props.name==='HysAvatarGroup'?Math.max(0,avatarOrder.indexOf(scene)):props.name==='HysSlider'?Math.max(0,sliderOrder.indexOf(scene)):props.name==='HysInput'||props.name==='HysTextarea'?Math.max(0,inputOrder.indexOf(scene)):order[scene]??10}
const buttonOrder=['Basic','Palette','Links','Features','Group','Actions','Async','Color','Form','Configure']
const animatedNumberOrder=['Basic','Configure','Controls','Effects','AnimationCatalog','Formatting','Statistic','Triggers','Activation','Realtime','Styling','Composition','Dashboard']
const spinOrder=['Basic','Animations','Timing','Tasks','Overlay','Business','Custom']
const iconOrder=['Basic','Picker','Sources','Appearance','Motion','Interactions','Registry']
const splitPaneOrder=['Basic','Configure','Resize','Snapping','Panels','Cascade','Responsive','Inspector','Workspace']
const dataGridOrder=['Basic','Configure','GroupedHeaders','ColumnLayouts','RowStates','ContextActions','GroupingSummary','KeyboardReview','Selection','Resize','Editing','Tree','Controlled','Server','PopupMotion','States']
const popconfirmOrder=['Basic','Async','Guard','Table','Controlled','Placement','Custom','PopupMotion']
const layoutOrder:Record<string,string[]>={HysDescriptions:['Basic','Responsive','Custom'],HysResult:['Basic','Exceptions','Workflow'],HysSpace:['Basic','Responsive','Separators']}
const tabsOrder=['Basic','Configure','AdvancedLayout','Overflow','Keyboard','Interaction','Guard','Lifecycle','AsyncContent','Dynamic','Workbench','Routing','Custom','States']
const toastOrder=['Basic','Configure','Positions','Service','Queue','Tasks','Interactions','Stack','Motion','Appearance','Content']
const sortableListOrder=['Basic','Configure','Layouts','Board','Table','Tree','History','Virtual','Custom']
function rankExample(path:string) {
 const scene=path.split('/').pop()!.replace('.vue','')
 if(props.name==='HysAnimatedNumber')return animatedNumberOrder.indexOf(scene)
 if(props.name==='HysSpin')return spinOrder.indexOf(scene)
 if(props.name==='HysIcon')return iconOrder.indexOf(scene)
 if(props.name==='HysSplitPane')return splitPaneOrder.indexOf(scene)
 if(props.name==='HysDataGrid')return dataGridOrder.indexOf(scene)
 if(props.name==='HysTable'&&scene==='QuickSearch')return tableOrder.indexOf('Filters')-.5
 if(props.name==='HysTable'&&scene==='KeyboardRows')return tableOrder.indexOf('Selection')+.5
 if(props.name==='HysPopconfirm')return popconfirmOrder.indexOf(scene)
 if(layoutOrder[props.name])return layoutOrder[props.name].indexOf(scene)
 if(props.name==='HysTabs')return tabsOrder.indexOf(scene)
 if(props.name==='HysTabPane')return scene==='Basic'?0:1
 if(props.name==='HysToast')return toastOrder.indexOf(scene)
 if(props.name==='HysSortableList')return sortableListOrder.indexOf(scene)
 return props.name==='HysButton' ? buttonOrder.indexOf(scene) : rank(path)
}
const scenarios=Object.keys(modules)
 .filter(path=>path.includes('/'+props.name+'/'))
 .sort((a,b)=>rankExample(a)-rankExample(b)||a.localeCompare(b))
 .map(path=>{
  const filename=path.split('/').pop()!
  const scene=filename.replace(/\.vue$/,'')
  return {path,filename,scene,id:'scene-'+scene.toLowerCase(),component:defineAsyncComponent(modules[path] as ()=>Promise<any>),version:ref(0),loadSource:sources[path] as ()=>Promise<ExampleSourceData>}
 })
const articleRoot=ref<HTMLElement>(),tocRoot=ref<HTMLElement>()
const compactContents=ref<HTMLDetailsElement>()
const hasCompactContents=computed(()=>['HysAnimatedNumber','HysInput','HysTextarea','HysSortableList','HysTabs','HysTable','HysDataGrid'].includes(props.name))
const tocState=useDocToc(articleRoot,tocRoot,()=>[...scenarios.map(s=>s.id),'api','capabilities','usage'])
const section=ref('props')
const rows=computed(()=>metadata.value[section.value as keyof typeof metadata.value] as {name:string;type:string;required:boolean;default:string;description:string}[])
const titles=computed<Record<string,string>>(()=>({...scenarioTitles.common,...scenarioTitles.components[props.name as keyof typeof scenarioTitles.components]}))
async function reset(s:typeof scenarios[number]){const element=document.getElementById(s.id);if(element)await clearExamplePasswords(element);if(props.name==='HysDataGrid')localStorage.removeItem('hys-ui-grid:hys-docs-data-grid-'+s.scene.toLowerCase());s.version.value++}
function jumpToSection(event:MouseEvent){
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return
 const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
 if(!link)return
 const target=document.getElementById(link.getAttribute('href')!.slice(1))
 if(!target)return
 event.preventDefault()
 if(compactContents.value?.open)compactContents.value.open=false
 tocState.select(target.id)
 target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})
 if(event.detail===0){target.tabIndex=-1;target.focus({preventScroll:true})}
}
</script>
<template>
 <article ref="articleRoot" class="doc-page doc-page-with-toc" :class="{ 'doc-page-button': name==='HysButton'||name==='HysButtonGroup' }">
  <div class="doc-eyebrow">{{entry.category}} / COMPONENT</div>
  <header class="doc-heading"><div><h1>{{name}} <span>{{entry.label}}</span></h1><p>{{entry.description}}</p></div><HysBadge tone="blue">Vue 3.5+</HysBadge></header>
  <div class="usage"><Code2 :size="16"/><code>import { {{name}} } from 'hys-ui'</code></div>
  <nav v-if="hasCompactContents" class="doc-jump" aria-label="页内导航" @click="jumpToSection">
   <details ref="compactContents" class="doc-jump-examples">
    <summary>本页示例<ChevronDown :size="14" aria-hidden="true"/></summary>
    <ul>
     <li v-for="scenario in scenarios" :key="scenario.id">
      <a :href="'#'+scenario.id" :aria-current="tocState.current.value===scenario.id?'location':undefined">{{titles[scenario.scene]}}</a>
     </li>
    </ul>
   </details>
   <a href="#api" class="doc-jump-api">API 参考<ArrowDown :size="14" aria-hidden="true"/></a>
  </nav>
  <Teleport v-if="active" defer to="#docs-toc-host"><aside ref="tocRoot" class="doc-toc" aria-label="页内导航" @click="jumpToSection"><span>本页内容</span><a v-for="scenario in scenarios" :key="scenario.id" :class="{'toc-active':tocState.current.value===scenario.id}" :aria-current="tocState.current.value===scenario.id?'location':undefined" :href="'#'+scenario.id">{{titles[scenario.scene]}}</a><a :class="{'toc-active':tocState.current.value==='api'}" :aria-current="tocState.current.value==='api'?'location':undefined" href="#api">API 参考</a><a :class="{'toc-active':tocState.current.value==='capabilities'}" :aria-current="tocState.current.value==='capabilities'?'location':undefined" href="#capabilities">功能说明</a><a :class="{'toc-active':tocState.current.value==='usage'}" :aria-current="tocState.current.value==='usage'?'location':undefined" href="#usage">使用说明</a></aside></Teleport>
  <section v-for="scenario in scenarios" :id="scenario.id" :key="scenario.path" class="example-card">
   <header><div><span class="section-dot"></span><h2>{{titles[scenario.scene]}}</h2></div><HysButton v-if="name!=='HysButton'||!/(Features|Color)\.vue$/.test(scenario.path)" variant="ghost" size="sm" @click="reset(scenario)"><RotateCcw :size="14"/>重置</HysButton></header>
   <div class="example-stage"><form v-if="name==='HysInput'" class="demo-input-scope" autocomplete="off" @submit.prevent><component :is="scenario.component" :key="scenario.version.value"/></form><component v-else :is="scenario.component" :key="scenario.version.value"/></div>
   <ExampleSource :load-source="scenario.loadSource" :filename="scenario.filename"/>
  </section>
  <FormRuleReference v-if="name==='HysForm'||name==='HysFormItem'"/>
  <SelectReference v-if="name==='HysSelect'"/>
  <InputReference v-if="name==='HysInput'||name==='HysTextarea'"/>
  <NumberInputReference v-if="name==='HysNumberInput'"/>
  <SliderReference v-if="name==='HysSlider'"/>
  <AvatarReference v-if="name==='HysAvatar'||name==='HysAvatarGroup'"/>
  <AutocompleteReference v-if="name==='HysAutocomplete'"/>
  <ChoiceReference v-if="['HysCheckbox','HysCheckboxGroup','HysRadio','HysRadioGroup','HysSwitch'].includes(name)"/>
  <RatingSegmentedReference v-if="name==='HysRating'||name==='HysSegmented'" :name="name"/>
  <GanttReference v-if="name==='HysGantt'"/>
  <CalendarReference v-if="name==='HysCalendar'"/>
  <TableReference v-if="name==='HysTable'"/>
  <MentionReference v-if="name==='HysMention'"/>
  <TransferReference v-if="name==='HysTransfer'"/>
  <TreeReference v-if="name==='HysTree'"/>
  <TreeSelectReference v-if="name==='HysTreeSelect'"/>
  <CascaderReference v-if="name==='HysCascader'"/>
  <DatePickerReference v-if="name==='HysDatePicker'||name==='HysDateRangePicker'"/>
  <VirtualTableReference v-if="name==='HysVirtualTable'"/>
  <TagColorReference v-if="['HysTagInput','HysColorPicker'].includes(name)" :name="name"/>
  <FeedbackTimelineReference v-if="['HysAlert','HysEmpty','HysTimeline'].includes(name)" :name="name"/>
  <ProgressReference v-if="name==='HysProgress'"/>
  <UploadReference v-if="name==='HysUpload'"/>
  <ModalReference v-if="name==='HysModal'"/>
  <AnimatedNumberReference v-if="name==='HysAnimatedNumber'"/>
  <SortableListReference v-if="name==='HysSortableList'"/>
  <section id="api" class="api-section"><h2>API 参考</h2><p>以下签名与默认值从组件源码生成。</p><HysTabs v-model="section" :items="[{label:'参数 Props',value:'props'},{label:'事件 Events',value:'events'},{label:'插槽 Slots',value:'slots'},{label:'实例方法',value:'exposed'}]"/>
   <p v-if="apiPending" role="status">正在加载接口信息…</p><div v-else-if="apiError" role="alert">{{apiError}} <HysButton size="sm" variant="ghost" @click="loadApi()">重新加载</HysButton></div><div v-else class="api-scroll"><table><thead><tr><th>名称</th><th>类型 / 签名</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in rows" :key="row.name"><td><code>{{row.name}}</code><span v-if="row.required" class="required">必填</span></td><td><code>{{row.type}}</code></td><td><code>{{row.default||'—'}}</code></td><td>{{row.description}}</td></tr><tr v-if="!rows.length"><td colspan="4">此组件未声明此类接口。</td></tr></tbody></table></div>
  </section>
  <ToastReference v-if="name==='HysToast'"/>
  <SpinReference v-if="name==='HysSpin'"/>
  <IconReference v-if="name==='HysIcon'"/>
  <PopconfirmReference v-if="name==='HysPopconfirm'"/>
  <DescriptionsReference v-if="name==='HysDescriptions'"/>
  <TabsReference v-if="name==='HysTabs'"/>
  <section id="capabilities" class="notes"><h2>功能说明</h2><p>{{capability}}</p></section>
  <section id="usage" class="notes"><h2>使用说明</h2><ul><li v-for="note in entry.notes" :key="note">{{note}}</li><li>交互控件可通过 Tab 聚焦，浮层支持 Escape 关闭。减少动态效果设置优先于组件动效。</li><li>主题颜色通过 <code>--hys-ui-primary</code> 等变量覆盖，使用 <code>provideHysConfig</code> 可响应式切换主题与动效。</li></ul></section>
 </article>
</template>

<style scoped>
.doc-jump {
  position: relative;
  display: grid;
  margin: -12px 0 24px;
}
.doc-jump-examples {
  min-width: 0;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-surface);
}
.doc-jump summary,
.doc-jump-api {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
}
.doc-jump summary {
  justify-content: flex-start;
  padding-inline-end: 112px;
  cursor: pointer;
  list-style: none;
}
.doc-jump summary::-webkit-details-marker { display: none; }
.doc-jump details[open] summary svg { transform: rotate(180deg); }
.doc-jump-api {
  position: absolute;
  inset-block-start: 1px;
  inset-inline-end: 1px;
  color: var(--docs-nav-active-text);
  text-decoration: none;
}
.doc-jump ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr));
  gap: 4px 12px;
  margin: 0;
  padding: 8px;
  max-block-size: min(44dvh, 18rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--docs-border);
  list-style: none;
}
.doc-jump li a {
  display: block;
  padding: 8px;
  border-radius: 5px;
  color: var(--docs-text);
  font-size: 12px;
  text-decoration: none;
}
.doc-jump li a:hover,
.doc-jump li a[aria-current] {
  color: var(--docs-nav-active-text);
  background: var(--docs-nav-active-bg);
}
.doc-jump a:focus-visible,
.doc-jump summary:focus-visible {
  outline: 2px solid var(--docs-nav-active-text);
  outline-offset: -2px;
  border-radius: 5px;
}
@media (min-width:1500px) { .doc-jump { display: none; } }
.doc-page-button .usage { margin-bottom: 18px; }
.doc-page-button .example-card { margin-bottom: 16px; }
.doc-page-button .example-card > header { min-height: 44px; padding: 6px 16px; }
.doc-page-button .section-dot { display: none; }
.doc-page-button .example-stage { min-height: 0; padding: 16px; }
</style>
