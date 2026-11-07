<script setup lang="ts">
import {computed,ref,type Component} from 'vue'
import {LoaderCircle} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
export type HysButtonVariant='primary'|'secondary'|'ghost'|'danger'|'success'|'warning'|'info'|'text'|'link'
export interface HysButtonProps {
 variant?:HysButtonVariant;size?:'sm'|'md'|'lg';disabled?:boolean;loading?:boolean
 plain?:boolean;round?:boolean;circle?:boolean;block?:boolean;dashed?:boolean;color?:string
 icon?:Component;iconPosition?:'left'|'right';type?:'button'|'submit'|'reset';nativeType?:'button'|'submit'|'reset'
 href?:string;target?:string;rel?:string;autofocus?:boolean;focusable?:boolean;ariaLabel?:string
}
const props=withDefaults(defineProps<HysButtonProps>(),{variant:'primary',size:'md',iconPosition:'left',type:'button',focusable:true})
const emit=defineEmits<{click:[event:MouseEvent]}>()
const hysRootAttrs=useHysRootAttrs(),element=ref<HTMLButtonElement|HTMLAnchorElement>()
const locked=computed(()=>props.disabled||props.loading)
const colors:Record<string,string>={danger:'#ed4556',success:'#16a46e',warning:'#d9860c',info:'#697b97'}
const tone=computed(()=>props.color||colors[props.variant]||'var(--hys-ui-primary,var(--hys-ui-theme-primary))')
function click(event:MouseEvent){if(locked.value){event.preventDefault();event.stopImmediatePropagation();return}emit('click',event)}
defineExpose({element,focus:()=>element.value?.focus(),blur:()=>element.value?.blur()})
</script>
<template>
 <component :is="href?'a':'button'" ref="element" v-bind="hysRootAttrs" class="hys-ui-btn" :class="['hys-ui-btn-'+size,'hys-ui-button-'+variant,{'hys-ui-button-plain':plain,'hys-ui-button-round':round,'hys-ui-button-circle':circle,'hys-ui-button-block':block,'hys-ui-button-dashed':dashed,'hys-ui-button-locked':locked}]" :style="{'--hys-ui-button-color':tone}" :type="href?undefined:(nativeType||type)" :href="locked?undefined:href" :role="href?'link':undefined" :target="href?target:undefined" :rel="href?(rel||(target==='_blank'?'noopener noreferrer':undefined)):undefined" :disabled="href?undefined:locked" :aria-disabled="locked||undefined" :aria-busy="loading||undefined" :aria-label="ariaLabel" :tabindex="locked||!focusable?-1:undefined" :autofocus="autofocus" @click="click">
  <span v-if="loading" class="hys-ui-button-icon"><slot name="loading"><LoaderCircle class="hys-ui-button-spinner" :size="16" aria-hidden="true"/></slot></span>
  <span v-else-if="(icon||$slots.icon)&&iconPosition==='left'" class="hys-ui-button-icon"><slot name="icon"><component :is="icon" :size="16" aria-hidden="true"/></slot></span>
  <slot/>
  <span v-if="!loading&&(icon||$slots.icon)&&iconPosition==='right'" class="hys-ui-button-icon"><slot name="icon"><component :is="icon" :size="16" aria-hidden="true"/></slot></span><slot name="suffix"/>
 </component>
</template>
<style scoped>
.hys-ui-btn{position:relative;display:inline-flex;gap:7px;align-items:center;justify-content:center;vertical-align:middle;text-decoration:none;line-height:1.4;border:1px solid var(--hys-ui-button-color);background:var(--hys-ui-button-color);color:#fff;border-radius:8px;font-weight:550;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s}
.hys-ui-btn:not(.hys-ui-button-locked):hover{background:color-mix(in srgb,var(--hys-ui-button-color) 85%,#fff);border-color:color-mix(in srgb,var(--hys-ui-button-color) 85%,#fff)}.hys-ui-btn:not(.hys-ui-button-locked):active{background:color-mix(in srgb,var(--hys-ui-button-color) 85%,#000)}.hys-ui-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--hys-ui-button-color) 45%,transparent);outline-offset:3px}
.hys-ui-btn-sm{min-height:30px;padding:6px 11px;font-size:12px}.hys-ui-btn-md{min-height:38px;padding:9px 16px;font-size:13px}.hys-ui-btn-lg{min-height:44px;padding:11px 20px;font-size:15px}
.hys-ui-button-secondary{background:var(--hys-ui-surface,var(--hys-ui-theme-surface));border-color:var(--hys-ui-border,var(--hys-ui-theme-border));color:var(--hys-ui-text,var(--hys-ui-theme-text))}.hys-ui-button-ghost,.hys-ui-button-text,.hys-ui-button-link{background:transparent;border-color:transparent;color:var(--hys-ui-button-color)}.hys-ui-button-plain{background:color-mix(in srgb,var(--hys-ui-button-color) 8%,var(--hys-ui-surface,var(--hys-ui-theme-surface)));color:var(--hys-ui-button-color);border-color:color-mix(in srgb,var(--hys-ui-button-color) 40%,transparent)}
.hys-ui-button-secondary:not(.hys-ui-button-locked):hover,.hys-ui-button-ghost:not(.hys-ui-button-locked):hover,.hys-ui-button-text:not(.hys-ui-button-locked):hover,.hys-ui-button-link:not(.hys-ui-button-locked):hover,.hys-ui-button-plain:not(.hys-ui-button-locked):hover{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-button-color)}
.hys-ui-button-link{padding-inline:0;min-height:unset}.hys-ui-button-link:hover{text-decoration:underline}.hys-ui-button-round{border-radius:999px}.hys-ui-button-circle{border-radius:50%;aspect-ratio:1;padding:8px}.hys-ui-button-block{display:flex;width:100%}.hys-ui-button-dashed{border-style:dashed}.hys-ui-button-locked{cursor:not-allowed;opacity:.55}.hys-ui-button-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.hys-ui-button-spinner{animation:hys-ui-button-spin .9s linear infinite}@keyframes hys-ui-button-spin{to{transform:rotate(360deg)}}
</style>
