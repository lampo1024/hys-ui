<script setup lang="ts">
import {computed,defineAsyncComponent,ref} from 'vue'
import {HysButton,HysBadge,HysTabs} from 'hys-ui'
import {Copy,RotateCcw,Check,Code2} from 'lucide-vue-next'
import api from './generated/api.json'
import {catalog} from './catalog'
import parity from './generated/parity.json'
const props=defineProps<{name:string}>()
const metadata=computed(()=>api[props.name as keyof typeof api])
const entry=computed(()=>catalog.find(x=>x.name===props.name)!)
const comparison=computed(()=>parity.find(x=>x.name===props.name)!)
const modules=import.meta.glob('./examples/*/*.vue')
const sources=import.meta.glob('./examples/*/*.vue',{query:'?raw',import:'default'})
const order:Record<string,number>={Basic:0,Configure:1,Features:2,States:98,Disabled:99}
const scenarios=Object.keys(modules).filter(p=>p.includes('/'+props.name+'/')).sort((a,b)=>(order[a.split('/').pop()!.replace('.vue','')]??10)-(order[b.split('/').pop()!.replace('.vue','')]??10)||a.localeCompare(b)).map(p=>({path:p,component:defineAsyncComponent(modules[p] as ()=>Promise<any>),version:ref(0),source:ref(''),copied:ref(false)}))
const section=ref('props')
const rows=computed(()=>metadata.value[section.value as keyof typeof metadata.value] as {name:string;type:string;required:boolean;default:string;description:string}[])
const titles:Record<string,string>={Basic:'基础与常用场景',Configure:'交互配置',Async:'异步加载与失败重试',States:'状态与边界',Server:'远程分页',Editing:'编辑与批量操作',Tree:'树形数据与汇总',Disabled:'禁用与受限状态',Features:'常用外观与操作',Affixes:'前后缀与密码输入',Rules:'规则与异步校验',Multiple:'多选与搜索',Bounds:'范围约束',Selection:'受控选择',DragDrop:'拖动更新数据',Caret:'随提及位置展示候选'}
async function showCode(s:typeof scenarios[number]){if(!s.source.value)s.source.value=String(await sources[s.path]())}
async function copy(s:typeof scenarios[number]){await showCode(s);await navigator.clipboard.writeText(s.source.value);s.copied.value=true;setTimeout(()=>s.copied.value=false,1500)}
function reset(s:typeof scenarios[number]){if(props.name==='HysDataGrid'){const scene=s.path.split('/').pop()!.replace('.vue','').toLowerCase();localStorage.removeItem('hys-ui-grid:hys-docs-data-grid-'+scene)}s.version.value++}
</script>
<template>
 <article class="doc-page">
  <div class="doc-eyebrow">{{entry.category}} / COMPONENT</div>
  <header class="doc-heading"><div><h1>{{name}} <span>{{entry.label}}</span></h1><p>{{entry.description}}</p></div><HysBadge tone="blue">Vue 3.5+</HysBadge></header>
  <div class="usage"><Code2 :size="16"/><code>import { {{name}} } from 'hys-ui'</code></div>
  <aside class="doc-toc" aria-label="页内导航"><span>本页内容</span><a v-for="scenario in scenarios" :key="scenario.path" :href="'#scene-'+scenario.path.split('/').pop()!.replace('.vue','').toLowerCase()">{{titles[scenario.path.split('/').pop()!.replace('.vue','')]||'进阶用法'}}</a><a href="#api">API 参考</a><a href="#capabilities">对标范围</a><a href="#usage">使用说明</a></aside>
  <section v-for="scenario in scenarios" :id="'scene-'+scenario.path.split('/').pop()!.replace('.vue','').toLowerCase()" :key="scenario.path" class="example-card">
   <header><div><span class="section-dot"></span><h2>{{titles[scenario.path.split('/').pop()!.replace('.vue','')]||'进阶用法'}}</h2></div><HysButton variant="ghost" size="sm" @click="reset(scenario)"><RotateCcw :size="14"/>重置</HysButton></header>
   <div class="example-stage"><component :is="scenario.component" :key="scenario.version.value"/></div>
   <details @toggle="($event.target as HTMLDetailsElement).open&&showCode(scenario)"><summary><Code2 :size="14"/> 查看示例源码</summary><HysButton class="copy-code" variant="secondary" size="sm" @click="copy(scenario)"><component :is="scenario.copied.value?Check:Copy" :size="14"/>{{scenario.copied.value?'已复制':'复制'}}</HysButton><pre><code>{{scenario.source.value}}</code></pre></details>
  </section>
  <section id="api" class="api-section"><h2>API 参考</h2><p>以下签名与默认值从组件源码生成。</p><HysTabs v-model="section" :items="[{label:'参数 Props',value:'props'},{label:'事件 Events',value:'events'},{label:'插槽 Slots',value:'slots'},{label:'实例方法',value:'exposed'}]"/>
   <div class="api-scroll"><table><thead><tr><th>名称</th><th>类型 / 签名</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in rows" :key="row.name"><td><code>{{row.name}}</code><span v-if="row.required" class="required">必填</span></td><td><code>{{row.type}}</code></td><td><code>{{row.default||'—'}}</code></td><td>{{row.description||'详见类型签名及对应交互示例'}}</td></tr><tr v-if="!rows.length"><td colspan="4">此组件未声明此类接口。</td></tr></tbody></table></div>
  </section>
  <section id="capabilities" class="notes"><h2>核心能力与对标范围</h2><p>{{comparison.core}}</p><p class="comparison-next">后续高级能力：{{comparison.later}}</p><a href="https://github.com/lampo1024/hys-ui/blob/main/docs/COMPONENT_PARITY.md" target="_blank" rel="noreferrer">查看全部 69 个组件的对标清单</a></section>
  <section id="usage" class="notes"><h2>使用说明</h2><ul><li v-for="note in entry.notes" :key="note">{{note}}</li><li>交互控件可通过 Tab 聚焦，浮层支持 Escape 关闭。减少动态效果设置优先于组件动效。</li><li>主题颜色通过 <code>--hys-ui-primary</code> 等变量覆盖，使用 <code>provideHysConfig</code> 可响应式切换主题与动效。</li></ul></section>
 </article>
</template>
