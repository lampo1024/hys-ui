<script setup lang="ts">
import {computed,onActivated,onBeforeUnmount,onDeactivated,ref,useId,watch} from 'vue'
import {ChevronDown} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
import {useMotion} from '../../motion/useMotion'
export type HysAccordionKey=string|number
export interface HysAccordionItem {id?:HysAccordionKey;title:string;content?:string;disabled?:boolean;forceRender?:boolean;showArrow?:boolean}
const props=withDefaults(defineProps<{
  items:HysAccordionItem[]
  multiple?:boolean
  modelValue?:HysAccordionKey[]
  defaultActive?:HysAccordionKey[]
  disabled?:boolean
  bordered?:boolean
  ghost?:boolean
  size?:'sm'|'md'|'lg'
  arrowPlacement?:'left'|'right'
  showArrow?:boolean
  trigger?:'header'|'icon'
  lazy?:boolean
  /** 收起时销毁内容；设为 false 可保留已访问面板的局部状态。 */
  destroyOnHide?:boolean
  beforeToggle?:(key:HysAccordionKey,expanded:boolean)=>boolean|void|Promise<boolean|void>
}>(),{bordered:true,size:'md',arrowPlacement:'right',showArrow:true,trigger:'header',lazy:true,destroyOnHide:true})
const emit=defineEmits<{'update:modelValue':[value:HysAccordionKey[]];change:[value:HysAccordionKey[]];itemClick:[key:HysAccordionKey,expanded:boolean];guardError:[error:unknown]}>()
const hysRootAttrs=useHysRootAttrs(),{effectiveMotion}=useMotion(),local=ref<HysAccordionKey[]>([...(props.defaultActive??[])]),root=ref<HTMLElement>(),id=useId()
const keyFor=(index:number)=>props.items[index]?.id??index
const open=computed(()=>{const valid=new Set(props.items.map((_,index)=>keyFor(index))),keys=[...new Set(props.modelValue??local.value)].filter(key=>valid.has(key));return props.multiple?keys:keys.slice(0,1)})
const visited=ref(new Set<HysAccordionKey>()),pending=ref<HysAccordionKey>()
let request=0,live=true
const isOpen=(index:number)=>open.value.includes(keyFor(index))
const rendered=(item:HysAccordionItem,index:number)=>item.forceRender||isOpen(index)||(!props.destroyOnHide&&(!props.lazy||visited.value.has(keyFor(index))))
const hasArrow=(item:HysAccordionItem)=>props.trigger==='icon'||(item.showArrow??props.showArrow)
function invalidate(){request++;pending.value=undefined}
async function toggle(index:number){
  const item=props.items[index],key=keyFor(index),ticket=++request
  pending.value=undefined
  if(!live||props.disabled||!item||item.disabled)return
  const expanded=!open.value.includes(key),previous=[...open.value]
  emit('itemClick',key,expanded)
  try{
    if(props.beforeToggle){pending.value=key;if((await props.beforeToggle(key,expanded))===false)return}
    if(!live||ticket!==request||props.disabled||props.items[index]!==item||item.disabled)return
    if(previous.length!==open.value.length||previous.some((value,i)=>value!==open.value[i]))return
    const next=expanded?(props.multiple?[...open.value,key]:[key]):open.value.filter(value=>value!==key)
    pending.value=undefined;local.value=next;emit('update:modelValue',next);emit('change',next)
  }catch(error){if(live&&ticket===request)emit('guardError',error)}
  finally{if(ticket===request)pending.value=undefined}
}
function keyboard(event:KeyboardEvent,index:number){
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
  const enabled=props.items.map((item,i)=>!props.disabled&&!item.disabled?i:-1).filter(i=>i>=0);if(!enabled.length)return
  event.preventDefault();const current=enabled.indexOf(index),next=event.key==='Home'?0:event.key==='End'?enabled.length-1:(current+(event.key==='ArrowUp'?-1:1)+enabled.length)%enabled.length
  root.value?.querySelector<HTMLButtonElement>('[data-accordion-index="'+enabled[next]+'"]')?.focus()
}
watch(open,keys=>{keys.forEach(key=>visited.value.add(key));invalidate()},{immediate:true})
watch(()=>props.items.map(item=>[item.id,item.disabled]),()=>{invalidate();const keys=new Set(props.items.map((_,i)=>keyFor(i)));visited.value=new Set([...visited.value].filter(key=>keys.has(key)))},{deep:true})
watch(()=>props.disabled,invalidate)
onActivated(()=>{live=true})
onDeactivated(()=>{live=false;invalidate()})
onBeforeUnmount(()=>{live=false;invalidate()})
</script>
<template>
  <div ref="root" v-bind="hysRootAttrs" class="hys-ui-ex-accordion" :class="['hys-ui-accordion-size-'+size,{'hys-ui-accordion-borderless':!bordered,'hys-ui-accordion-ghost':ghost}]">
    <section v-for="(item,index) in items" :key="typeof keyFor(index)+':'+keyFor(index)" class="hys-ui-accordion-item">
      <div class="hys-ui-accordion-heading" :class="{'hys-ui-accordion-arrow-left':arrowPlacement==='left','hys-ui-accordion-disabled':disabled||item.disabled}">
        <h3>
          <component :is="trigger==='header'?'button':'span'" :id="id+'-button-'+index" :type="trigger==='header'?'button':undefined" :class="{'hys-ui-accordion-trigger':trigger==='header','hys-ui-accordion-title':true}" :data-accordion-index="trigger==='header'?index:undefined" :disabled="trigger==='header'?(disabled||item.disabled):undefined" :aria-expanded="trigger==='header'?isOpen(index):undefined" :aria-controls="trigger==='header'?id+'-panel-'+index:undefined" :aria-busy="trigger==='header'&&pending===keyFor(index)||undefined" @click="trigger==='header'&&toggle(index)" @keydown="trigger==='header'&&keyboard($event,index)">
            <span class="hys-ui-accordion-title-content"><slot name="title" :item="item" :index="index" :expanded="isOpen(index)">{{item.title}}</slot></span>
            <span v-if="trigger==='header'&&hasArrow(item)" class="hys-ui-accordion-icon" aria-hidden="true"><slot name="icon" :item="item" :index="index" :expanded="isOpen(index)"><ChevronDown :size="16" class="hys-ui-accordion-chevron" :class="{'hys-ui-accordion-expanded':isOpen(index)}"/></slot></span>
          </component>
        </h3>
        <button v-if="trigger==='icon'" type="button" class="hys-ui-accordion-trigger hys-ui-accordion-icon-trigger" :data-accordion-index="index" :disabled="disabled||item.disabled" :aria-label="(isOpen(index)?'收起':'展开')+item.title" :aria-expanded="isOpen(index)" :aria-controls="id+'-panel-'+index" :aria-busy="pending===keyFor(index)||undefined" @click="toggle(index)" @keydown="keyboard($event,index)"><slot name="icon" :item="item" :index="index" :expanded="isOpen(index)"><ChevronDown :size="16" class="hys-ui-accordion-chevron" :class="{'hys-ui-accordion-expanded':isOpen(index)}"/></slot></button>
        <div v-if="$slots.extra" class="hys-ui-accordion-extra"><slot name="extra" :item="item" :index="index" :expanded="isOpen(index)"/></div>
      </div>
      <Transition name="hys-ui-accordion" :css="effectiveMotion!=='off'"><div v-if="rendered(item,index)" v-show="isOpen(index)" :id="id+'-panel-'+index" role="region" :aria-labelledby="id+'-button-'+index" class="hys-ui-accordion-panel"><div class="hys-ui-accordion-clip"><div class="hys-ui-ex-accordion-body"><slot name="content" :item="item" :index="index" :expanded="isOpen(index)">{{item.content}}</slot></div></div></div></Transition>
    </section>
  </div>
</template>
<style scoped>
.hys-ui-ex-accordion{color:var(--hys-ui-text,var(--hys-ui-theme-text));background:var(--hys-ui-surface,var(--hys-ui-theme-surface))}.hys-ui-accordion-heading{display:flex;align-items:center;gap:8px;padding:0 14px}.hys-ui-accordion-heading h3{flex:1;min-width:0;font-size:14px;font-weight:500}.hys-ui-accordion-title{display:flex;align-items:center;gap:10px;text-align:start;width:100%;padding:14px 0;border:0;background:transparent;color:inherit;font:inherit}.hys-ui-accordion-title-content{flex:1;min-width:0;overflow-wrap:anywhere}.hys-ui-accordion-trigger{cursor:pointer}.hys-ui-accordion-trigger:disabled{cursor:not-allowed}.hys-ui-accordion-disabled{opacity:.45}.hys-ui-accordion-icon{display:flex;flex:none}.hys-ui-accordion-arrow-left .hys-ui-accordion-icon{order:-1}.hys-ui-accordion-icon-trigger{display:grid;place-items:center;flex:none;width:28px;height:28px;padding:0;border:0;background:transparent;color:inherit;border-radius:5px}.hys-ui-accordion-arrow-left .hys-ui-accordion-icon-trigger{order:-1}.hys-ui-accordion-extra{display:flex;align-items:center;flex:none}.hys-ui-accordion-chevron{transition:transform .18s}.hys-ui-accordion-expanded{transform:rotate(180deg)}.hys-ui-accordion-borderless,.hys-ui-accordion-ghost{border:0;border-radius:0}.hys-ui-accordion-ghost{background:transparent}.hys-ui-accordion-ghost>.hys-ui-accordion-item+.hys-ui-accordion-item{border:0}.hys-ui-accordion-size-sm .hys-ui-accordion-title{padding:9px 0;font-size:12px}.hys-ui-accordion-size-lg .hys-ui-accordion-title{padding:18px 0;font-size:16px}.hys-ui-accordion-panel{display:grid;grid-template-rows:1fr;transition:grid-template-rows .18s ease,opacity .18s ease}.hys-ui-accordion-clip{overflow:hidden;min-height:0}.hys-ui-ex-accordion-body{padding:0 14px 16px}.hys-ui-accordion-enter-from,.hys-ui-accordion-leave-to{grid-template-rows:0fr;opacity:0}
@media(prefers-reduced-motion:reduce){.hys-ui-accordion-panel,.hys-ui-accordion-chevron{transition:none}}
</style>
