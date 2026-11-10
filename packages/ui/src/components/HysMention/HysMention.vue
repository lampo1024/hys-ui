<script setup lang="ts">
import type { HysPopupMotionProps } from '../../motion/popup';

import PopupMotion from '../../motion/PopupMotion';

import {useHysControlState} from '../../composables/formContext'

import {computed,ref,watch,useId,nextTick,onBeforeUnmount,onDeactivated} from 'vue'
import {useHysRootAttrs} from '../../config'
import {useFloating,type FloatingAnchor} from '../../composables/useFloating'
const props=defineProps<HysPopupMotionProps & {users:{id:string;name:string;disabled?:boolean}[];placeholder?:string;disabled?:boolean;readonly?:boolean;maxlength?:number;ariaLabel?:string}>()
const {disabled:controlDisabled,label:fieldLabel}=useHysControlState(props)

const model=defineModel<string>({default:''}),emit=defineEmits<{select:[user:{id:string;name:string}];change:[value:string]}>(),hysRootAttrs=useHysRootAttrs(),active=ref(0),dismissed=ref(false),focused=ref(false),input=ref<HTMLTextAreaElement>(),panel=ref<HTMLElement>(),cursor=ref(model.value.length),id=useId()
const anchor=computed<FloatingAnchor|undefined>(()=>input.value?{getBoundingClientRect:mentionRect,contains:node=>!!input.value?.contains(node),focus:()=>input.value?.focus(),get isConnected(){return !!input.value?.isConnected}}:undefined)
const {placement: popupPlacement, open,style,show,close,update}=useFloating(anchor,panel,{gap:6})
const prefix=computed(()=>model.value.slice(0,cursor.value)),term=computed(()=>prefix.value.match(/@([^\s@]*)$/)?.[1]??null)
let mirror:HTMLDivElement|undefined
function removeMirror(){mirror?.remove();mirror=undefined}
function mentionRect():DOMRect {
 const element=input.value!,box=element.getBoundingClientRect();if(!box.width&&!box.height)return box
 const css=getComputedStyle(element)
 if(!mirror){mirror=document.createElement('div');mirror.setAttribute('aria-hidden','true');document.body.append(mirror)}
 for(const property of ['direction','font','font-family','font-size','font-weight','font-style','font-variant','letter-spacing','word-spacing','text-transform','text-indent','text-align','line-height','padding-top','padding-right','padding-bottom','padding-left','border-top-width','border-right-width','border-bottom-width','border-left-width','border-style','box-sizing','tab-size'])mirror.style.setProperty(property,css.getPropertyValue(property))
 Object.assign(mirror.style,{position:'fixed',top:'0px',left:'-10000px',visibility:'hidden',pointerEvents:'none',height:'auto',overflow:'hidden',whiteSpace:element.wrap==='off'?'pre':'pre-wrap',overflowWrap:'break-word',wordBreak:css.wordBreak})
 const borderLeft=parseFloat(css.borderLeftWidth)||0,borderTop=parseFloat(css.borderTopWidth)||0
 mirror.style.width=((element.clientWidth||box.width-borderLeft-(parseFloat(css.borderRightWidth)||0))+borderLeft+(parseFloat(css.borderRightWidth)||0))+'px'
 const start=Math.max(0,prefix.value.lastIndexOf('@'));mirror.textContent=model.value.slice(0,start)
 const marker=document.createElement('span');marker.textContent=model.value.slice(start)||'@';mirror.append(marker)
 const height=parseFloat(css.lineHeight)||(parseFloat(css.fontSize)||14)*1.6,left=box.left+marker.offsetLeft+borderLeft-element.scrollLeft,top=box.top+marker.offsetTop+borderTop-element.scrollTop
 return {x:left,y:top,left,top,right:left+1,bottom:top+height,width:1,height,toJSON:()=>({left,top,width:1,height})} as DOMRect
}
watch(open,value=>{if(!value)removeMirror()});onBeforeUnmount(removeMirror);onDeactivated(removeMirror)
const choices=computed(()=>term.value===null||controlDisabled.value||props.readonly||dismissed.value||!focused.value?[]:props.users.filter(user=>user.name.toLocaleLowerCase().includes(term.value!.toLocaleLowerCase())).slice(0,8))
const enabled=computed(()=>choices.value.filter(user=>!user.disabled))
watch(term,()=>{active.value=0;dismissed.value=false})
watch(choices,list=>{active.value=Math.min(active.value,Math.max(0,enabled.value.length-1));if(list.length)void show();else close()},{flush:'post'})
async function syncCursor(){await nextTick();cursor.value=input.value?.selectionStart??model.value.length;if(open.value)update()}
watch(model,()=>void syncCursor(),{flush:'post'})
async function choose(user:{id:string;name:string;disabled?:boolean}|undefined){if(!user||user.disabled||controlDisabled.value||props.readonly)return;const before=prefix.value.replace(/@[^\s@]*$/,'@'+user.name+' '),suffix=model.value.slice(cursor.value),after=suffix.startsWith(' ')?suffix.slice(1):suffix;model.value=before+after;dismissed.value=true;active.value=0;close();emit('select',user);emit('change',model.value);await nextTick();input.value?.focus();input.value?.setSelectionRange(before.length,before.length);cursor.value=before.length}
function key(event:KeyboardEvent){if(event.key==='Tab'){dismissed.value=true;close();return}if(!choices.value.length)return;if(event.key==='Escape'){event.preventDefault();dismissed.value=true;close()}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!open.value)void show();else active.value=(active.value+(event.key==='ArrowDown'?1:-1)+Math.max(1,enabled.value.length))%Math.max(1,enabled.value.length);panel.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({block:'nearest'})}else if(event.key==='Enter'&&!event.isComposing&&enabled.value[active.value]){event.preventDefault();void choose(enabled.value[active.value])}}
function change(){dismissed.value=false;void syncCursor();emit('change',model.value)}
defineExpose({focus:()=>input.value?.focus(),blur:()=>input.value?.blur()})
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-mention"><textarea ref="input" v-model="model" :placeholder="placeholder||'输入 @ 提及成员'" :disabled="controlDisabled" :readonly="readonly" :maxlength="maxlength" :aria-label="ariaLabel||fieldLabel||'提及输入'" :aria-controls="open?id:undefined" :aria-expanded="open" :aria-activedescendant="open?id+'-'+enabled[active]?.id:undefined" role="combobox" @keydown="key" @keyup="syncCursor" @click="dismissed=false;syncCursor()" @focus="focused=true;syncCursor()" @blur="focused=false;close()" @input="change"/><Teleport to="body"><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="popupPlacement"><div v-if="open&&choices.length" :id="id" ref="panel" v-bind="hysRootAttrs" class="hys-ui-mention-list hys-ui-floating-surface" :style="{...style,maxHeight:'min(240px,calc(100vh - 20px))'}" role="listbox" aria-label="提及候选成员"><button v-for="user in choices" :id="id+'-'+user.id" :key="user.id" type="button" role="option" :disabled="user.disabled" :aria-selected="enabled[active]?.id===user.id" :data-active="enabled[active]?.id===user.id" :class="{'hys-ui-mention-active':enabled[active]?.id===user.id}" @mousedown.prevent @pointerenter="!user.disabled&&(active=enabled.findIndex(x=>x.id===user.id))" @click="choose(user)"><slot name="option" :user="user"><span class="hys-ui-mention-avatar" aria-hidden="true">{{user.name.slice(0,1)}}</span><span>{{user.name}}</span></slot></button></div></PopupMotion></Teleport></div></template>
<style scoped>
.hys-ui-ent-mention{width:100%;min-width:0}.hys-ui-ent-mention textarea{display:block;width:100%;min-width:0;min-height:94px;resize:vertical;padding:11px 13px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:8px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));font:inherit;line-height:1.6;color:inherit;outline:none;transition:border-color .15s,box-shadow .15s}.hys-ui-ent-mention textarea:focus{outline:none;border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary));box-shadow:0 0 0 2px color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 10%,transparent)}.hys-ui-ent-mention textarea::placeholder{color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}.hys-ui-ent-mention textarea:disabled{opacity:.55;cursor:not-allowed}
.hys-ui-mention-list{width:260px;padding:6px;max-height:240px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:9px;box-shadow:0 10px 30px #17274415}.hys-ui-mention-list button{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:7px 10px;margin:3px 0;border:0;border-radius:6px;background:transparent;color:var(--hys-ui-text,var(--hys-ui-theme-text));font:inherit;text-align:left;cursor:pointer;outline:none}.hys-ui-mention-list button:not(:disabled):hover{background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}.hys-ui-mention-list button.hys-ui-mention-active{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));outline:1px solid color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 20%,transparent);outline-offset:-1px}.hys-ui-mention-list button:disabled{opacity:.45;cursor:not-allowed}.hys-ui-mention-avatar{display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:6px;background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));font-size:11px}
</style>
