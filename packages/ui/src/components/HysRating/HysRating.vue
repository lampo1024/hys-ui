<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {ref} from 'vue'
import {Star} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{modelValue:number;max?:number;readonly?:boolean;disabled?:boolean;allowClear?:boolean;allowHalf?:boolean;showScore?:boolean;ariaLabel?:string}>(),{max:5,allowClear:true})
const {disabled:controlDisabled,label:fieldLabel}=useHysControlState(props)

const emit=defineEmits<{'update:modelValue':[value:number];change:[value:number]}>(),hysRootAttrs=useHysRootAttrs(),hover=ref(0)
function set(value:number){if(controlDisabled.value||props.readonly)return;const next=props.allowClear&&value===props.modelValue?0:value;emit('update:modelValue',next);emit('change',next)}
function value(event:MouseEvent,n:number){const box=(event.currentTarget as HTMLElement).getBoundingClientRect();return props.allowHalf&&event.clientX-box.left<box.width/2?n-.5:n}
function keyboard(event:KeyboardEvent){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?props.max:Math.min(props.max,Math.max(0,props.modelValue+(['ArrowLeft','ArrowDown'].includes(event.key)?-1:1)*(props.allowHalf?.5:1)));if(!controlDisabled.value&&!props.readonly){emit('update:modelValue',next);emit('change',next)}}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-rating" role="slider" :tabindex="controlDisabled?-1:0" :aria-label="ariaLabel||fieldLabel||'评分'" :aria-valuenow="modelValue" :aria-valuemin="0" :aria-valuemax="max" :aria-readonly="readonly" :aria-disabled="controlDisabled" @keydown="keyboard" @mouseleave="hover=0"><button v-for="n in Math.max(0,Math.floor(max))" :key="n" type="button" tabindex="-1" :disabled="readonly||controlDisabled" :aria-label="`${n} 星`" :aria-pressed="modelValue===n" :class="{'hys-ui-active':n<=(hover||modelValue),'hys-ui-rating-half':n-.5===(hover||modelValue)}" @mousemove="!controlDisabled&&!readonly&&(hover=value($event,n))" @click="set(value($event,n))"><slot name="character" :value="n"><span class="hys-ui-rating-star"><Star :size="20" aria-hidden="true"/><span v-if="n-.5===(hover||modelValue)" class="hys-ui-rating-half-fill"><Star :size="20" aria-hidden="true"/></span></span></slot></button><span v-if="showScore" class="hys-ui-rating-score">{{modelValue}}</span></div></template>
<style scoped>.hys-ui-ex-rating button.hys-ui-active svg{fill:currentColor}.hys-ui-rating-half{background:linear-gradient(90deg,#f5ad36 50%,#cbd5e1 50%);background-clip:text}.hys-ui-rating-score{align-self:center;font-size:13px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));margin-left:8px}.hys-ui-rating-star{display:inline-flex;position:relative}.hys-ui-rating-half-fill{position:absolute;inset:0 auto 0 0;width:50%;overflow:hidden;color:#f5ad36}.hys-ui-rating-half-fill svg{fill:currentColor}</style>
