<script setup lang="ts">
import {computed,nextTick,onActivated,onBeforeUnmount,onDeactivated,onMounted,ref,useId,watch} from 'vue'
import {ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Plus,X} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
import {useMotion} from '../../motion/useMotion'

export type HysTabValue=string|number
export interface HysTabItem {label:string;value:HysTabValue;disabled?:boolean;closable?:boolean;content?:string;forceRender?:boolean}
const props=withDefaults(defineProps<{
  modelValue?:HysTabValue
  defaultValue?:HysTabValue
  items:HysTabItem[]
  disabled?:boolean
  type?:'line'|'card'|'border-card'|'segment'
  vertical?:boolean
  placement?:'top'|'right'|'bottom'|'left'
  size?:'sm'|'md'|'lg'
  stretch?:boolean
  centered?:boolean
  closable?:boolean
  addable?:boolean
  editable?:boolean
  trigger?:'click'|'hover'
  activation?:'auto'|'manual'
  /** 首次访问时才挂载面板；用于 panel 插槽。 */
  lazy?:boolean
  /** 离开时销毁面板；默认保留已访问面板的局部状态。 */
  destroyOnHide?:boolean
  animated?:boolean
  showScrollButtons?:boolean
  ariaLabel?:string
  beforeLeave?:(next:HysTabValue,current:HysTabValue)=>boolean|void|Promise<boolean|void>
  beforeClose?:(value:HysTabValue)=>boolean|void|Promise<boolean|void>
}>(),{type:'line',size:'md',trigger:'click',activation:'auto',lazy:true,destroyOnHide:false,animated:true,showScrollButtons:true})
const emit=defineEmits<{
  'update:modelValue':[value:HysTabValue]
  change:[value:HysTabValue]
  tabClick:[value:HysTabValue,event:MouseEvent]
  close:[value:HysTabValue]
  add:[]
  edit:[value:HysTabValue|undefined,action:'add'|'remove']
  guardError:[error:unknown]
}>()
const hysRootAttrs=useHysRootAttrs(),{effectiveMotion}=useMotion(),id=useId()
const nav=ref<HTMLElement>(),local=ref<HysTabValue|undefined>(props.defaultValue)
const active=computed(()=>props.modelValue??(props.items.some(item=>item.value===local.value)?local.value!:props.items.find(item=>!item.disabled)?.value??''))
const position=computed(()=>props.placement??(props.vertical?'left':'top'))
const isVertical=computed(()=>position.value==='left'||position.value==='right')
const enabled=computed(()=>props.items.filter(item=>!props.disabled&&!item.disabled))
const focused=ref<HysTabValue>(),visited=ref(new Set<HysTabValue>()),pending=ref(false),closing=ref(new Set<HysTabValue>())
const canPrevious=ref(false),canNext=ref(false)
let request=0,lifetime=0,closeSequence=0,live=true,observer:ResizeObserver|undefined
const closeRequests=new Map<HysTabValue,number>()
const itemKey=(value:HysTabValue)=>typeof value+':'+value
const tabId=(index:number)=>id+'-tab-'+index
const panelId=(index:number)=>id+'-panel-'+index
const canClose=(item:HysTabItem)=>item.closable??(props.closable||props.editable)
const buttonFor=(value:HysTabValue)=>Array.from(nav.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')||[]).find(button=>button.dataset.tabKey===itemKey(value))
const rendered=(item:HysTabItem)=>item.forceRender||(!props.destroyOnHide&&(!props.lazy||visited.value.has(item.value)))||active.value===item.value
function updateOverflow(){const element=nav.value;if(!element)return;const offset=isVertical.value?element.scrollTop:element.scrollLeft,size=isVertical.value?element.clientHeight:element.clientWidth,total=isVertical.value?element.scrollHeight:element.scrollWidth;canPrevious.value=offset>1;canNext.value=offset+size<total-1}
function scrollToActiveTab(){const element=nav.value,button=buttonFor(active.value);if(!element||!button)return;const box=element.getBoundingClientRect(),target=button.getBoundingClientRect();if(isVertical.value){if(target.top<box.top)element.scrollTop-=box.top-target.top;else if(target.bottom>box.bottom)element.scrollTop+=target.bottom-box.bottom}else{if(target.left<box.left)element.scrollLeft-=box.left-target.left;else if(target.right>box.right)element.scrollLeft+=target.right-box.right}updateOverflow()}
function scrollNav(direction:number){const element=nav.value;if(!element)return;const amount=(isVertical.value?element.clientHeight:element.clientWidth)*.8*direction;element.scrollBy({[isVertical.value?'top':'left']:amount,behavior:effectiveMotion.value==='off'?'auto':'smooth'})}
function focusTab(value:HysTabValue){focused.value=value;buttonFor(value)?.focus()}
async function select(value:HysTabValue){
  const ticket=++request,from=active.value,epoch=lifetime
  pending.value=false
  if(!live||!enabled.value.some(item=>item.value===value)||value===from)return
  try{
    if(props.beforeLeave){pending.value=true;const allowed=await props.beforeLeave(value,from);if(allowed===false)return}
    if(!live||epoch!==lifetime||ticket!==request||active.value!==from||!enabled.value.some(item=>item.value===value))return
    pending.value=false;local.value=value;emit('update:modelValue',value);emit('change',value)
    await nextTick();scrollToActiveTab()
  }catch(error){if(live&&epoch===lifetime&&ticket===request)emit('guardError',error)}
  finally{if(ticket===request)pending.value=false}
}
function clickTab(item:HysTabItem,event:MouseEvent){if(props.disabled||item.disabled)return;emit('tabClick',item.value,event);void select(item.value)}
async function closeTab(item:HysTabItem){
  if(!live||props.disabled||item.disabled||!canClose(item)||closing.value.has(item.value))return
  const epoch=lifetime,ticket=++closeSequence;closeRequests.set(item.value,ticket)
  try{
    closing.value.add(item.value)
    if(props.beforeClose&&(await props.beforeClose(item.value))===false)return
    const current=props.items.find(entry=>entry.value===item.value)
    if(!live||epoch!==lifetime||closeRequests.get(item.value)!==ticket||props.disabled||!current||current.disabled||!canClose(current))return
    emit('close',item.value);emit('edit',item.value,'remove')
  }catch(error){if(live&&epoch===lifetime)emit('guardError',error)}
  finally{if(closeRequests.get(item.value)===ticket)closing.value.delete(item.value)}
}
function addTab(){if(!props.disabled){emit('add');emit('edit',undefined,'add')}}
function keyboard(event:KeyboardEvent){
  if((event.target as HTMLElement).closest('.hys-ui-tab-close'))return
  const keys=isVertical.value?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight']
  const target=(event.target as HTMLElement).closest<HTMLElement>('[role="tab"]')
  const value=enabled.value.find(item=>itemKey(item.value)===target?.dataset.tabKey)?.value??focused.value??active.value
  if(['Enter',' '].includes(event.key)&&props.activation==='manual'&&target){event.preventDefault();void select(value);return}
  if(![...keys,'Home','End'].includes(event.key)||!enabled.value.length)return
  event.preventDefault();const index=enabled.value.findIndex(item=>item.value===value)
  const next=event.key==='Home'?0:event.key==='End'?enabled.value.length-1:index<0?(event.key===keys[0]?enabled.value.length-1:0):(index+(event.key===keys[0]?-1:1)+enabled.value.length)%enabled.value.length
  focusTab(enabled.value[next].value);if(props.activation==='auto')void select(enabled.value[next].value)
}
function invalidate(){request++;pending.value=false;lifetime++;closing.value.clear();closeRequests.clear()}
function disconnect(){observer?.disconnect();observer=undefined}
function observe(){disconnect();if(typeof ResizeObserver!=='undefined'&&nav.value){observer=new ResizeObserver(updateOverflow);observer.observe(nav.value)}void nextTick().then(updateOverflow)}
watch(active,value=>{visited.value.add(value);request++;pending.value=false;void nextTick().then(scrollToActiveTab)},{immediate:true})
watch(()=>props.items.map(item=>[item.value,item.disabled,item.closable]),()=>{invalidate();visited.value=new Set([...visited.value].filter(value=>props.items.some(item=>item.value===value)));if(focused.value!==undefined&&!enabled.value.some(item=>item.value===focused.value))focused.value=undefined;void nextTick().then(updateOverflow)},{deep:true})
watch(()=>props.disabled,()=>invalidate())
watch(()=>[props.size,props.type,props.stretch,props.centered,...props.items.map(item=>item.label)],()=>void nextTick().then(()=>{updateOverflow();scrollToActiveTab()}))
watch(position,()=>void nextTick().then(()=>{updateOverflow();scrollToActiveTab()}))
onMounted(observe)
onActivated(()=>{live=true;observe()})
onDeactivated(()=>{live=false;invalidate();disconnect()})
onBeforeUnmount(()=>{live=false;invalidate();disconnect()})
defineExpose({scrollToActiveTab,focus:(value:HysTabValue=active.value)=>focusTab(value)})
</script>
<template>
  <div v-bind="hysRootAttrs" class="hys-ui-tabs-root" :class="['hys-ui-tabs-placement-'+position,'hys-ui-tabs-size-'+size,{'hys-ui-tabs-bordered':type==='border-card'}]">
    <div class="hys-ui-tabs-header" :class="{'hys-ui-tabs-header-vertical':isVertical}">
      <div v-if="$slots.prefix" class="hys-ui-tabs-extra"><slot name="prefix"/></div>
      <button v-if="showScrollButtons&&canPrevious" class="hys-ui-tab-scroll" type="button" :aria-label="isVertical?'向上滚动页签':'向左滚动页签'" @click="scrollNav(-1)"><component :is="isVertical?ChevronUp:ChevronLeft" :size="16"/></button>
      <div ref="nav" class="hys-ui-tabs" :class="['hys-ui-tabs-'+type,{'hys-ui-tabs-vertical':isVertical,'hys-ui-tabs-stretch':stretch,'hys-ui-tabs-centered':centered}]" role="tablist" :aria-label="ariaLabel||'页签'" :aria-busy="pending||undefined" :aria-orientation="isVertical?'vertical':'horizontal'" @keydown="keyboard" @scroll.passive="updateOverflow">
        <div v-for="(item,index) in items" :key="itemKey(item.value)" class="hys-ui-tab-item" :class="{'hys-ui-tab-selected':active===item.value}">
          <button :id="tabId(index)" type="button" role="tab" :data-tab-key="itemKey(item.value)" :aria-selected="active===item.value" :aria-controls="$slots.panel||item.content!==undefined||($slots.default&&active===item.value)?panelId(index):undefined" :disabled="disabled||item.disabled" :tabindex="(focused??(enabled.some(entry=>entry.value===active)?active:enabled[0]?.value))===item.value?0:-1" :class="{'hys-ui-active':active===item.value}" @focus="focused=item.value" @click="clickTab(item,$event)" @mouseenter="trigger==='hover'&&select(item.value)"><slot name="label" :item="item" :active="active===item.value">{{item.label}}</slot></button>
          <button v-if="canClose(item)" type="button" class="hys-ui-tab-close" :aria-label="'关闭'+item.label" :aria-busy="closing.has(item.value)||undefined" :disabled="disabled||item.disabled||closing.has(item.value)" @click="closeTab(item)"><slot name="close-icon" :item="item"><X :size="13"/></slot></button>
        </div>
      </div>
      <button v-if="showScrollButtons&&canNext" class="hys-ui-tab-scroll" type="button" :aria-label="isVertical?'向下滚动页签':'向右滚动页签'" @click="scrollNav(1)"><component :is="isVertical?ChevronDown:ChevronRight" :size="16"/></button>
      <button v-if="addable||editable" type="button" class="hys-ui-tab-add" aria-label="添加页签" :disabled="disabled" @click="addTab"><slot name="add-icon"><Plus :size="16"/></slot></button>
      <div v-if="$slots.suffix" class="hys-ui-tabs-extra"><slot name="suffix"/></div>
    </div>
    <div v-if="$slots.panel||items.some(item=>item.content!==undefined)" class="hys-ui-tabs-content" :class="{'hys-ui-tabs-animated':animated&&effectiveMotion!=='off'}">
      <template v-for="(item,index) in items" :key="itemKey(item.value)"><div v-if="rendered(item)" v-show="active===item.value" :id="panelId(index)" class="hys-ui-tab-panel" :data-active="active===item.value" role="tabpanel" :aria-labelledby="tabId(index)" tabindex="0"><slot name="panel" :item="item" :active="active===item.value">{{item.content}}</slot></div></template>
    </div>
    <div v-else-if="$slots.default" :id="panelId(items.findIndex(item=>item.value===active))" class="hys-ui-tabs-content" role="tabpanel" :aria-labelledby="items.some(item=>item.value===active)?tabId(items.findIndex(item=>item.value===active)):undefined" tabindex="0"><slot :active="active"/></div>
  </div>
</template>
<style scoped>
.hys-ui-tabs-root{min-width:0;color:var(--hys-ui-text,var(--hys-ui-theme-text));font-family:var(--hys-ui-font-family,inherit)}
.hys-ui-tabs-header{display:flex;align-items:center;gap:8px;min-width:0}
.hys-ui-tabs{flex:1;min-width:0;display:flex;gap:22px;overflow:auto;scrollbar-width:none;position:relative}
.hys-ui-tabs::-webkit-scrollbar{display:none}.hys-ui-tab-item{display:flex;align-items:center;flex:none;position:relative;gap:5px}
.hys-ui-tabs [role=tab]{display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;line-height:1.5;padding:12px 5px;font:inherit;font-size:14px}
.hys-ui-tabs button:disabled{cursor:not-allowed;opacity:.45}.hys-ui-tab-close{display:grid;place-items:center;padding:4px!important;border:0!important;border-radius:4px;background:transparent;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));cursor:pointer}
.hys-ui-tab-close:hover{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-tab-add,.hys-ui-tab-scroll{display:grid;place-items:center;flex:none;width:28px;height:28px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:6px;background:transparent;color:inherit;cursor:pointer;padding:0}
.hys-ui-tabs-extra{display:flex;align-items:center;flex:none}.hys-ui-tabs-content{min-width:0;padding:16px 0;flex:1}.hys-ui-tab-panel{outline-offset:3px}
.hys-ui-tabs-card,.hys-ui-tabs-border-card{gap:4px}.hys-ui-tabs-card .hys-ui-tab-item,.hys-ui-tabs-border-card .hys-ui-tab-item{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:7px 7px 0 0;padding:0 10px}
.hys-ui-tabs-card .hys-ui-tab-selected,.hys-ui-tabs-border-card .hys-ui-tab-selected{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}.hys-ui-tabs-card [role=tab]::after,.hys-ui-tabs-border-card [role=tab]::after,.hys-ui-tabs-segment [role=tab]::after{display:none}
.hys-ui-tabs-bordered{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:9px;overflow:hidden}.hys-ui-tabs-bordered .hys-ui-tabs-header{padding:6px 10px 0;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}.hys-ui-tabs-bordered .hys-ui-tabs-content{padding:16px}
.hys-ui-tabs-segment{gap:4px;padding:4px;border:0;border-radius:8px;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}.hys-ui-tabs-segment .hys-ui-tab-item{border-radius:5px;padding:0 8px}.hys-ui-tabs-segment .hys-ui-tab-selected{background:var(--hys-ui-surface,var(--hys-ui-theme-surface));box-shadow:0 1px 4px #00000010}
.hys-ui-tabs-stretch .hys-ui-tab-item{flex:1}.hys-ui-tabs-stretch [role=tab]{flex:1}.hys-ui-tabs-centered{justify-content:safe center}.hys-ui-tabs-size-sm .hys-ui-tabs [role=tab]{padding-top:8px;padding-bottom:8px;font-size:12px}.hys-ui-tabs-size-lg .hys-ui-tabs [role=tab]{padding-top:16px;padding-bottom:16px;font-size:16px}
.hys-ui-tabs-placement-bottom{display:flex;flex-direction:column-reverse}.hys-ui-tabs-placement-bottom .hys-ui-tabs{border-bottom:0;border-top:1px solid var(--hys-ui-border,var(--hys-ui-theme-border))}.hys-ui-tabs-placement-bottom [role=tab]::after{top:0;bottom:auto}
.hys-ui-tabs-placement-left,.hys-ui-tabs-placement-right{display:flex;gap:20px;align-items:stretch}.hys-ui-tabs-placement-right{flex-direction:row-reverse}.hys-ui-tabs-header-vertical{flex-direction:column;flex:none;max-width:45%}.hys-ui-tabs-vertical{flex-direction:column;gap:5px;max-height:360px;overflow-y:auto;border-bottom:0;border-right:1px solid var(--hys-ui-border,var(--hys-ui-theme-border))}.hys-ui-tabs-vertical .hys-ui-tab-item{width:100%;border-radius:6px}.hys-ui-tabs-vertical [role=tab]{justify-content:flex-start;flex:1;padding:10px 14px}.hys-ui-tabs-vertical [role=tab]::after{left:auto;right:0;top:0;bottom:0;width:3px;height:auto}.hys-ui-tabs-placement-right .hys-ui-tabs-vertical{border-right:0;border-left:1px solid var(--hys-ui-border,var(--hys-ui-theme-border))}.hys-ui-tabs-placement-right [role=tab]::after{left:0;right:auto}
.hys-ui-tabs-animated .hys-ui-tab-panel[data-active=true]{animation:hys-ui-tab-appear .16s ease-out}@keyframes hys-ui-tab-appear{from{opacity:.35;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.hys-ui-tabs-animated .hys-ui-tab-panel{animation:none}}
</style>
