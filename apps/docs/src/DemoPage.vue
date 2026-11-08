<script setup lang="ts">
import {computed,defineAsyncComponent,onActivated,onDeactivated,ref} from 'vue'
import {HysButton,HysBadge,HysTabs} from 'hys-ui'
import {RotateCcw,Code2} from 'lucide-vue-next'
import scenarioTitles from './scenario-titles.json'
import api from './generated/api.json'
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
import type {ExampleSourceData} from './sourceTypes'
import {catalog} from './catalog'
import capabilities from './component-capabilities.json'
import {clearExamplePasswords} from './examplePasswords'
const props=defineProps<{name:string}>()
const active=ref(true)
onActivated(()=>active.value=true)
onDeactivated(()=>active.value=false)
const metadata=computed(()=>api[props.name as keyof typeof api])
const entry=computed(()=>catalog.find(x=>x.name===props.name)!)
const capability=computed(()=>capabilities[props.name as keyof typeof capabilities])
const modules=import.meta.glob('./examples/*/*.vue')
const sources=import.meta.glob('./examples/*/*.vue',{query:'?example-source&raw',import:'default'})
const order:Record<string,number>={Basic:0,Configure:1,Features:2,Rules:2,Width:3,Search:4,Remote:5,Dynamic:5,Custom:6,Keyboard:7,Lifecycle:8,Nested:8,Dependencies:9,Guard:9,Overflow:10,Methods:10,Feedback:11,Registration:2,Inline:3,Alignment:4,Layout:4,Number:6,Policy:12,Data:13,Accessibility:14,Presentation:7,Conditional:8,ControlAdapter:9,Groups:3,Values:4,Limits:5,Create:6,AsyncSearch:7,Virtual:8,Control:9,Infinite:10,Nullable:2,Precision:3,Format:4,StringMode:5,Controls:6,Timing:7,Events:8,Form:9,States:98,Disabled:99}
const inputOrder=['Basic','Configure','Disabled','Clearable','ClearIcon','Formatter','Password','Icons','Textarea','Autosize','Mixed','Sizes','Length','Graphemes','Methods','Affixes']
const sliderOrder=['Basic','Configure','Sizes','Precision','Range','Marks','Number','Orientation','Custom','Tooltip','Performance','Keyboard','Form','States']
const avatarOrder=['Basic','Configure','Types','Fallback','Fit','Autosize','Responsive','Badge','Image','Group','Collapse','Custom','Vertical','Dynamic','States']
const autocompleteOrder=['Basic','Configure','Template','CustomInput','Remote','Loading','HeaderFooter','Status','ClearIcon','Options','CaseInsensitive','Categories','Query','Keyboard','AfterSelect','Form','States']
const choiceOrder=['Basic','Configure','Values','Array','All','Limits','Appearance','Buttons','Grid','Sizes','Content','Icons','Slots','Custom','Dynamic','Async','Controlled','Keyboard','RTL','Methods','Form','States']
const ratingOrder=['Basic','Configure','Half','Text','Colors','Icons','Sizes','Tooltips','Controlled','Keyboard','Methods','Form','States'],segmentedOrder=['Basic','Configure','Values','Layout','Content','Dynamic','Controlled','Keyboard','RTL','Methods','Form','States']
function rank(path:string){const scene=path.split('/').pop()!.replace('.vue','');return props.name==='HysRating'?Math.max(0,ratingOrder.indexOf(scene)):props.name==='HysSegmented'?Math.max(0,segmentedOrder.indexOf(scene)):['HysCheckbox','HysCheckboxGroup','HysRadio','HysRadioGroup','HysSwitch'].includes(props.name)?Math.max(0,choiceOrder.indexOf(scene)):props.name==='HysAutocomplete'?Math.max(0,autocompleteOrder.indexOf(scene)):props.name==='HysAvatar'||props.name==='HysAvatarGroup'?Math.max(0,avatarOrder.indexOf(scene)):props.name==='HysSlider'?Math.max(0,sliderOrder.indexOf(scene)):props.name==='HysInput'||props.name==='HysTextarea'?Math.max(0,inputOrder.indexOf(scene)):order[scene]??10}
const scenarios=Object.keys(modules).filter(p=>p.includes('/'+props.name+'/')).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b)).map(p=>({path:p,component:defineAsyncComponent(modules[p] as ()=>Promise<any>),version:ref(0),loadSource:sources[p] as ()=>Promise<ExampleSourceData>}))
const section=ref('props')
const rows=computed(()=>metadata.value[section.value as keyof typeof metadata.value] as {name:string;type:string;required:boolean;default:string;description:string}[])
const titles=computed<Record<string,string>>(()=>({...scenarioTitles.common,...scenarioTitles.components[props.name as keyof typeof scenarioTitles.components]}))
async function reset(s:typeof scenarios[number]){const scene=s.path.split('/').pop()!.replace('.vue','').toLowerCase(),element=document.getElementById('scene-'+scene);if(element)await clearExamplePasswords(element);if(props.name==='HysDataGrid')localStorage.removeItem('hys-ui-grid:hys-docs-data-grid-'+scene);s.version.value++}
function jumpToSection(event:MouseEvent){
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return
 const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
 if(!link)return
 const target=document.getElementById(link.getAttribute('href')!.slice(1))
 if(!target)return
 event.preventDefault()
 target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})
 if(event.detail===0){target.tabIndex=-1;target.focus({preventScroll:true})}
}
</script>
<template>
 <article class="doc-page doc-page-with-toc">
  <div class="doc-eyebrow">{{entry.category}} / COMPONENT</div>
  <header class="doc-heading"><div><h1>{{name}} <span>{{entry.label}}</span></h1><p>{{entry.description}}</p></div><HysBadge tone="blue">Vue 3.5+</HysBadge></header>
  <div class="usage"><Code2 :size="16"/><code>import { {{name}} } from 'hys-ui'</code></div>
  <Teleport v-if="active" to="#docs-toc-host"><aside class="doc-toc" aria-label="页内导航" @click="jumpToSection"><span>本页内容</span><a v-for="scenario in scenarios" :key="scenario.path" :href="'#scene-'+scenario.path.split('/').pop()!.replace('.vue','').toLowerCase()">{{titles[scenario.path.split('/').pop()!.replace('.vue','')]}}</a><a href="#api">API 参考</a><a href="#capabilities">功能说明</a><a href="#usage">使用说明</a></aside></Teleport>
  <section v-for="scenario in scenarios" :id="'scene-'+scenario.path.split('/').pop()!.replace('.vue','').toLowerCase()" :key="scenario.path" class="example-card">
   <header><div><span class="section-dot"></span><h2>{{titles[scenario.path.split('/').pop()!.replace('.vue','')]}}</h2></div><HysButton variant="ghost" size="sm" @click="reset(scenario)"><RotateCcw :size="14"/>重置</HysButton></header>
   <div class="example-stage"><form v-if="name==='HysInput'" class="demo-input-scope" autocomplete="off" @submit.prevent><component :is="scenario.component" :key="scenario.version.value"/></form><component v-else :is="scenario.component" :key="scenario.version.value"/></div>
   <ExampleSource :load-source="scenario.loadSource" :filename="scenario.path.split('/').pop()!"/>
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
  <section id="api" class="api-section"><h2>API 参考</h2><p>以下签名与默认值从组件源码生成。</p><HysTabs v-model="section" :items="[{label:'参数 Props',value:'props'},{label:'事件 Events',value:'events'},{label:'插槽 Slots',value:'slots'},{label:'实例方法',value:'exposed'}]"/>
   <div class="api-scroll"><table><thead><tr><th>名称</th><th>类型 / 签名</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in rows" :key="row.name"><td><code>{{row.name}}</code><span v-if="row.required" class="required">必填</span></td><td><code>{{row.type}}</code></td><td><code>{{row.default||'—'}}</code></td><td>{{row.description||'详见类型签名及对应交互示例'}}</td></tr><tr v-if="!rows.length"><td colspan="4">此组件未声明此类接口。</td></tr></tbody></table></div>
  </section>
  <section v-if="name==='HysToast'" class="notes"><h2>调用 API</h2><p>在组件 setup 中调用 <code>useHysToast({maxCount:5})</code>，消息继承当前主题与动效，页面离开时自动清理。</p><div class="api-scroll"><table><thead><tr><th>方法</th><th>说明</th></tr></thead><tbody><tr><td><code>show(options | string)</code></td><td>创建提示，支持 id、content、icon、grouping、onClose 与 onAfterClose。</td></tr><tr><td><code>success / info / warning / error / loading</code></td><td>快捷创建对应状态。loading 默认保留，其余默认 3000ms。</td></tr><tr><td><code>handle.update(options | string)</code></td><td>更新原提示的内容、状态或配置；相同 id 会复用现有提示。</td></tr><tr><td><code>handle.close() / handle.closed</code></td><td>主动关闭，或等待退出动画完成。</td></tr><tr><td><code>createHysToast(config)</code></td><td>在 setup 外创建共享服务，可用于请求回调等场景。支持 theme、motion，结束时调用 dispose()。</td></tr><tr><td><code>closeAll()</code></td><td>关闭当前调用范围中的全部提示。</td></tr></tbody></table></div><p>调用配置还支持 <code>maxCount</code>（默认 5）、<code>appendTo</code> 及组件的显示参数。<code>grouping</code> 默认关闭，启用后合并相同位置、状态和文本的消息。位置参数使用七种标准值，原有 <code>top</code>、<code>bottom</code> 分别对应顶部中间和底部中间。</p></section>
  <section id="capabilities" class="notes"><h2>功能说明</h2><p>{{capability}}</p></section>
  <section id="usage" class="notes"><h2>使用说明</h2><ul><li v-for="note in entry.notes" :key="note">{{note}}</li><li>交互控件可通过 Tab 聚焦，浮层支持 Escape 关闭。减少动态效果设置优先于组件动效。</li><li>主题颜色通过 <code>--hys-ui-primary</code> 等变量覆盖，使用 <code>provideHysConfig</code> 可响应式切换主题与动效。</li></ul></section>
 </article>
</template>
