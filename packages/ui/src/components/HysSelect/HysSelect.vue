<script setup lang="ts" generic="T extends string | string[] = string">
import {useHysControlState} from '../../composables/formContext'

import {computed,nextTick,ref,useId,watch} from 'vue'
import {Check,ChevronDown,LoaderCircle,X} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
import {useFloating} from '../../composables/useFloating'
export interface HysSelectOption {label:string;value:string;disabled?:boolean}
const props=withDefaults(defineProps<{modelValue:T;options:HysSelectOption[];disabled?:boolean;ariaLabel?:string;placeholder?:string;multiple?:boolean;filterable?:boolean;clearable?:boolean;loading?:boolean;remote?:boolean;popupMatchWidth?:boolean;filterMethod?:(query:string,option:HysSelectOption)=>boolean;emptyText?:string;size?:'sm'|'md'|'lg'}>(),{placeholder:'请选择',emptyText:'暂无选项'})
const {disabled:controlDisabled,size:controlSize,label:fieldLabel}=useHysControlState(props)
const iconSize=computed(()=>controlSize.value==='sm'?14:controlSize.value==='lg'?18:16)

const emit=defineEmits<{'update:modelValue':[value:T];change:[value:T];clear:[];search:[query:string];visibleChange:[open:boolean]}>()
const hysRootAttrs=useHysRootAttrs(),trigger=ref<HTMLElement>(),panel=ref<HTMLElement>(),searchInput=ref<HTMLInputElement>(),query=ref(''),active=ref(0),id=useId()
const {open,style,show,close,update:updatePosition}=useFloating(trigger,panel,{placement:'bottom-start',matchWidth:()=>props.popupMatchWidth?true:'min'})
const multiple=computed(()=>props.multiple||Array.isArray(props.modelValue)),values=computed<string[]>(()=>Array.isArray(props.modelValue)?props.modelValue as string[]:[props.modelValue as string].filter(Boolean))
const optionCache=ref(new Map<string,HysSelectOption>())
watch(()=>[props.options,values.value] as const,()=>{const previous=optionCache.value,next=new Map<string,HysSelectOption>();for(const option of props.options)next.set(option.value,option);for(const value of values.value)if(!next.has(value)&&previous.has(value))next.set(value,previous.get(value)!);optionCache.value=next},{immediate:true,deep:true})
const selected=computed(()=>values.value.map(value=>optionCache.value.get(value)??{value,label:value}))
const filtered=computed(()=>props.remote?props.options:props.options.filter(x=>!query.value||(props.filterMethod?props.filterMethod(query.value,x):x.label.toLocaleLowerCase().includes(query.value.toLocaleLowerCase()))))
function update(value:string|string[]){emit('update:modelValue',value as T);emit('change',value as T)}
function choose(index:number){const option=filtered.value[index];if(!option||option.disabled||controlDisabled.value||props.loading)return;if(multiple.value){update(values.value.includes(option.value)?values.value.filter(x=>x!==option.value):[...values.value,option.value])}else{update(option.value);close(true)}}
function clear(){if(controlDisabled.value)return;update(multiple.value?[]:'');emit('clear');trigger.value?.focus()}
async function expand(){if(controlDisabled.value)return;if(open.value){close();return}query.value='';const selectedIndex=filtered.value.findIndex(x=>values.value.includes(x.value)&&!x.disabled);active.value=selectedIndex>=0?selectedIndex:filtered.value.findIndex(x=>!x.disabled);await show();if(props.filterable)searchInput.value?.focus()}
async function keyboard(event:KeyboardEvent){
 if(controlDisabled.value||event.isComposing||event.keyCode===229)return
 if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(!open.value)await expand();else{
  const direction=event.key==='ArrowUp'?-1:1;let index=event.key==='Home'?-1:event.key==='End'?filtered.value.length:active.value
  for(let count=0;count<filtered.value.length;count++){index=(index+(event.key==='End'?-1:direction)+filtered.value.length)%filtered.value.length;if(!filtered.value[index].disabled){active.value=index;break}}
 }await nextTick();panel.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({block:'nearest'})}
 else if(event.key==='Enter'||(event.key===' '&&!props.filterable)){event.preventDefault();if(open.value)choose(active.value);else await expand()}
 else if(event.key==='Tab')close(!!panel.value?.contains(document.activeElement))
}
watch(query,value=>{active.value=filtered.value.findIndex(x=>!x.disabled);emit('search',value)})
watch(filtered,options=>{if(!options[active.value]||options[active.value].disabled)active.value=options.findIndex(x=>!x.disabled);if(open.value)void nextTick(updatePosition)},{deep:true})
watch(()=>props.popupMatchWidth,()=>{if(open.value){close();void expand()}})
watch(controlSize,()=>{if(open.value)void nextTick(updatePosition)})
watch(open,value=>emit('visibleChange',value));watch(()=>controlDisabled.value,value=>{if(value)close()})
defineExpose({focus:()=>trigger.value?.focus(),blur:()=>trigger.value?.blur(),close:()=>close()})
</script>
<template>
 <div v-bind="hysRootAttrs" class="hys-ui-select-wrap" :class="'hys-ui-select-'+controlSize">
  <button ref="trigger" type="button" class="hys-ui-select" :aria-label="ariaLabel||fieldLabel" :disabled="controlDisabled" role="combobox" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="open?id:undefined" :aria-activedescendant="open?id+'-'+active:undefined" @click="expand" @keydown="keyboard"><span class="hys-ui-select-label"><slot name="label" :selected="selected"><template v-if="multiple&&selected.length"><span v-for="option in selected" :key="option.value" class="hys-ui-select-tag">{{option.label}}</span></template><span v-else class="hys-ui-select-single-label" :title="selected[0]?.label">{{selected[0]?.label||placeholder}}</span></slot></span><LoaderCircle v-if="loading" class="hys-ui-icon-spin" :size="iconSize"/><ChevronDown v-else class="hys-ui-select-chevron" :size="iconSize" aria-hidden="true"/></button>
  <button v-if="clearable&&values.length&&!controlDisabled" type="button" class="hys-ui-select-clear" aria-label="清空选择" @click.stop="clear"><X :size="controlSize==='sm'?12:controlSize==='lg'?14:13"/></button>
  <Teleport to="body"><div v-if="open" ref="panel" v-bind="hysRootAttrs" class="hys-ui-select-options hys-ui-floating-surface" :class="'hys-ui-select-popup-'+controlSize" :data-size="controlSize" :style="style" @keydown="keyboard"><input v-if="filterable" ref="searchInput" v-model="query" class="hys-ui-select-search" placeholder="搜索选项…" aria-label="搜索选项" :aria-controls="id" :aria-activedescendant="id+'-'+active"/><div :id="id" role="listbox" :aria-multiselectable="multiple||undefined"><p v-if="loading" class="hys-ui-floating-empty"><slot name="loading">加载中…</slot></p><template v-else><button v-for="(option,index) in filtered" :id="id+'-'+index" :key="option.value" type="button" role="option" class="hys-ui-select-option" :class="{'hys-ui-selected':values.includes(option.value),'hys-ui-active':active===index&&!option.disabled}" :data-active="active===index" :aria-selected="values.includes(option.value)" :disabled="option.disabled" @pointerenter="!option.disabled&&(active=index)" @click="choose(index)"><span class="hys-ui-select-option-label" :title="option.label"><slot name="option" :option="option" :selected="values.includes(option.value)">{{option.label}}</slot></span><Check v-if="values.includes(option.value)" :size="iconSize-1" aria-hidden="true"/></button><p v-if="!filtered.length" class="hys-ui-floating-empty"><slot name="empty">{{emptyText}}</slot></p></template></div><slot name="footer"/></div></Teleport>
 </div>
</template>
<style scoped>
.hys-ui-select-wrap{position:relative;min-width:0}.hys-ui-select{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:38px;width:100%;padding:8px 12px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:8px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));color:var(--hys-ui-text,var(--hys-ui-theme-text));text-align:left;font:inherit}.hys-ui-select:focus-visible{outline:none;border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary));box-shadow:0 0 0 2px color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 10%,transparent)}.hys-ui-select-label{display:flex;flex-wrap:wrap;gap:4px;min-width:0}.hys-ui-select-tag{display:inline-block;padding:1px 6px;border-radius:4px;background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));font-size:12px}.hys-ui-select-options{padding:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:9px}.hys-ui-select-option{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;min-height:36px;width:100%;padding:8px 10px;margin:3px 0;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit}.hys-ui-select-option:not(:disabled):hover{background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}.hys-ui-select-option.hys-ui-active{outline:1px solid color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 50%,transparent);outline-offset:-1px}.hys-ui-select-option.hys-ui-selected{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));font-weight:550}.hys-ui-select-option:disabled{opacity:.45}.hys-ui-select-chevron{flex:none;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));transition:transform .15s}.hys-ui-select[aria-expanded=true] .hys-ui-select-chevron{transform:rotate(180deg)}.hys-ui-select-clear{position:absolute;right:32px;top:50%;transform:translateY(-50%);display:grid;place-items:center;padding:2px;border:0;border-radius:4px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}.hys-ui-select-search{width:100%;padding:8px 10px;margin-bottom:5px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:6px;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt));font:inherit;color:inherit}.hys-ui-select-sm .hys-ui-select{min-height:30px;padding:5px 10px;font-size:12px}.hys-ui-select-lg .hys-ui-select{min-height:44px;padding:11px 14px;font-size:15px}
.hys-ui-select-option{white-space:nowrap;min-width:0}.hys-ui-select-option-label{display:block;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hys-ui-select-option>svg{flex:none}
.hys-ui-select-label{flex:1}.hys-ui-select-single-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hys-ui-select-options{--hys-ui-select-option-height:36px;--hys-ui-select-option-padding:7px 10px;--hys-ui-select-option-margin:3px 0;--hys-ui-select-search-padding:6px 10px;font-size:14px;line-height:1.5}
.hys-ui-select-popup-sm{--hys-ui-select-option-height:30px;--hys-ui-select-option-padding:5px 8px;--hys-ui-select-option-margin:2px 0;--hys-ui-select-search-padding:5px 8px;font-size:12px;padding:4px}
.hys-ui-select-popup-lg{--hys-ui-select-option-height:42px;--hys-ui-select-option-padding:9px 12px;--hys-ui-select-option-margin:4px 0;--hys-ui-select-search-padding:8px 12px;font-size:15px;padding:8px}
.hys-ui-select-options .hys-ui-select-option{min-height:var(--hys-ui-select-option-height);padding:var(--hys-ui-select-option-padding);margin:var(--hys-ui-select-option-margin);font:inherit;line-height:1.5}
.hys-ui-select-options .hys-ui-select-search{min-height:var(--hys-ui-select-option-height);padding:var(--hys-ui-select-search-padding);font:inherit;line-height:1.5}
.hys-ui-select-options .hys-ui-floating-empty{padding:var(--hys-ui-select-option-padding);font-size:inherit;line-height:1.5}
.hys-ui-select-sm .hys-ui-select-tag{font-size:11px}.hys-ui-select-lg .hys-ui-select-tag{font-size:13px}
</style>
