<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {computed, ref, watch} from 'vue'
import {Check, ChevronDown} from 'lucide-vue-next'
import {useFloating} from '../../composables/useFloating'

const props = defineProps<{modelValue:string; disabled?:boolean; label?:string;presets?:string[];clearable?:boolean}>()
const {disabled:controlDisabled}=useHysControlState(props)

const emit = defineEmits<{'update:modelValue':[value:string]}>()
const trigger = ref<HTMLElement>(), panel = ref<HTMLElement>()
const {open, style, show, close} = useFloating(trigger, panel)
const hue = ref(0), saturation = ref(0), brightness = ref(0)
const draft = ref(props.modelValue)
const valid = computed(() => !draft.value || /^#[0-9a-f]{6}$/i.test(draft.value))
const defaultPresets = ['#3867f5','#8955ea','#ec4899','#ef4444','#f59e0b','#22a06b','#06b6d4','#172a4d','#ffffff','#000000']
function toHex() {
 const s=saturation.value/100, v=brightness.value/100
 const channel=(n:number) => {
  const k=(n+hue.value/60)%6
  return Math.round(255*(v-v*s*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0')
 }
 return '#'+channel(5)+channel(3)+channel(1)
}
const color = computed(toHex)
function read(value:string) {
 if(!/^#[0-9a-f]{6}$/i.test(value))return
 const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255)
 const [r,g,b]=rgb, max=Math.max(...rgb), min=Math.min(...rgb), delta=max-min
 if(delta) {
  const sector=max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4
  hue.value=(sector*60+360)%360
 }
 saturation.value=max?delta/max*100:0
 brightness.value=max*100
}
watch(()=>props.modelValue,value=>{
 draft.value=value
 if(/^#[0-9a-f]{6}$/i.test(value) && value.toLowerCase()!==color.value) read(value)
},{immediate:true})
function publish() {
 draft.value=color.value
 emit('update:modelValue',color.value)
}
function commitHex() {
 if(controlDisabled.value || !valid.value) return
 if(!draft.value){if(props.clearable)emit('update:modelValue','');else draft.value=props.modelValue;return}
 read(draft.value)
 publish()
}
function preset(value:string) {
 if(controlDisabled.value||!/^#[0-9a-f]{6}$/i.test(value))return
 read(value)
 publish()
}
async function expand() {
 if(controlDisabled.value) return
 if(open.value) {close(); return}
 await show()
 panel.value?.querySelector<HTMLElement>('[role="slider"]')?.focus()
}
function point(event:PointerEvent, control:'palette'|'hue') {
 if(controlDisabled.value) return
 const element=event.currentTarget as HTMLElement
 const rect=element.getBoundingClientRect()
 if(!rect.width||!rect.height)return
 const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))
 if(control==='hue') hue.value=x*359
 else {
  saturation.value=x*100
  brightness.value=(1-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)))*100
 }
 publish()
}
function start(event:PointerEvent, control:'palette'|'hue') {
 if(event.button!==0 || controlDisabled.value) return
 event.preventDefault()
 const element=event.currentTarget as HTMLElement
 element.focus()
 element.setPointerCapture(event.pointerId)
 point(event,control)
}
function drag(event:PointerEvent, control:'palette'|'hue') {
 if((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) point(event,control)
}
function end(event:PointerEvent) {
 const element=event.currentTarget as HTMLElement
 if(element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
}
function keyboard(event:KeyboardEvent,control:'palette'|'hue') {
 if(controlDisabled.value || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return
 event.preventDefault()
 const step=event.shiftKey?10:1
 if(control==='hue') {
  const delta=event.key==='ArrowLeft'||event.key==='ArrowDown'?-step:step
  hue.value=event.key==='Home'?0:event.key==='End'?359:Math.max(0,Math.min(359,hue.value+delta))
 } else {
  if(event.key==='ArrowLeft') saturation.value=Math.max(0,saturation.value-step)
  if(event.key==='ArrowRight') saturation.value=Math.min(100,saturation.value+step)
  if(event.key==='ArrowUp') brightness.value=Math.min(100,brightness.value+step)
  if(event.key==='ArrowDown') brightness.value=Math.max(0,brightness.value-step)
  if(event.key==='Home') saturation.value=0
  if(event.key==='End') saturation.value=100
 }
 publish()
}
watch(()=>controlDisabled.value,value=>{if(value)close()})

</script>
<template>
 <div v-bind="hysRootAttrs" class="hys-ui-pf-color-picker">
  <div class="hys-ui-pf-color-control">
   <button ref="trigger" type="button" class="hys-ui-pf-color-trigger" :aria-label="label||'选择颜色'" aria-haspopup="dialog" :aria-expanded="open" :disabled="controlDisabled" @click="expand">
    <span class="hys-ui-pf-color-chip" :style="{background:modelValue?color:'transparent'}"/><ChevronDown :size="14" aria-hidden="true"/>
   </button>
   <input v-model="draft" class="hys-ui-pf-color-hex" aria-label="十六进制颜色" :aria-invalid="!valid" :disabled="controlDisabled" maxlength="7" spellcheck="false" @change="commitHex" @keydown.enter="commitHex"/>
  </div>
  <small v-if="!valid" class="hys-ui-pf-color-error" role="alert">请输入 #RRGGBB 格式</small>
  <Teleport to="body">
   <div v-bind="hysRootAttrs" v-if="open" ref="panel" class="hys-ui-v4-menu hys-ui-pf-color-panel" :style="style" role="dialog" :aria-label="label||'选择颜色'">
    <header><strong>选择颜色</strong><code>{{color.toUpperCase()}}</code></header>
    <div class="hys-ui-pf-color-palette" role="slider" tabindex="0" aria-label="饱和度与亮度" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(saturation)" :aria-valuetext="'饱和度 '+Math.round(saturation)+'%，亮度 '+Math.round(brightness)+'%'" :style="{backgroundColor:'hsl('+hue+',100%,50%)'}" @pointerdown="start($event,'palette')" @pointermove="drag($event,'palette')" @pointerup="end" @pointercancel="end" @keydown="keyboard($event,'palette')">
     <span class="hys-ui-pf-color-cursor" :style="{left:saturation+'%',top:(100-brightness)+'%',background:color}"/>
    </div>
    <div class="hys-ui-pf-color-hue" role="slider" tabindex="0" aria-label="色相" aria-valuemin="0" aria-valuemax="359" :aria-valuenow="Math.round(hue)" @pointerdown="start($event,'hue')" @pointermove="drag($event,'hue')" @pointerup="end" @pointercancel="end" @keydown="keyboard($event,'hue')">
     <span :style="{left:(hue/359*100)+'%'}"/>
    </div>
    <div class="hys-ui-pf-color-presets" role="group" aria-label="常用颜色">
     <button v-for="value in (props.presets||defaultPresets)" :key="value" type="button" :aria-label="value" :aria-pressed="color===value" :style="{background:value}" @click="preset(value)"><Check v-if="color===value" :size="13" :style="{color:value==='#ffffff'?'#172a4d':'white'}" aria-hidden="true"/></button>
    </div>
    <button v-if="clearable&&!controlDisabled&&modelValue" type="button" class="hys-ui-color-clear" @click="emit('update:modelValue','');close(true)">清空颜色</button><footer><span>方向键微调 · Shift 加速</span><button type="button" @click="close(true)">完成</button></footer>
   </div>
  </Teleport>
 </div>
</template>
<style scoped>
.hys-ui-pf-color-picker{min-width:0;width:100%}
.hys-ui-pf-color-control{display:flex;align-items:stretch;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:9px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));min-height:38px;overflow:hidden}
.hys-ui-pf-color-control:focus-within{border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary));box-shadow:0 0 0 3px color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 12%,transparent)}
.hys-ui-pf-color-trigger{display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt));border:0;border-right:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}
.hys-ui-pf-color-chip{width:22px;height:22px;display:block;border-radius:5px;box-shadow:inset 0 0 0 1px #0002}
.hys-ui-pf-color-hex{width:100%;min-width:0;border:0;background:transparent;color:var(--hys-ui-text,var(--hys-ui-theme-text));padding:8px 12px;font:inherit;font-size:13px;font-variant-numeric:tabular-nums}
.hys-ui-pf-color-hex:focus-visible{outline:none}
.hys-ui-pf-color-trigger:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:-3px}
.hys-ui-pf-color-error{display:block;margin-top:6px;color:var(--hys-ui-red,var(--hys-ui-theme-red));font-size:12px}
.hys-ui-pf-color-panel.hys-ui-v4-menu{width:272px;min-width:0;padding:14px}
.hys-ui-pf-color-panel header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:13px}
.hys-ui-pf-color-panel code{font-size:11px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}
.hys-ui-pf-color-palette{height:162px;position:relative;border-radius:8px;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent);touch-action:none;cursor:crosshair}
.hys-ui-pf-color-cursor{position:absolute;width:12px;height:12px;transform:translate(-50%,-50%);border:2px solid white;border-radius:50%;box-shadow:0 0 0 1px #0006;pointer-events:none}
.hys-ui-pf-color-hue{height:12px;position:relative;margin:18px 0;border-radius:8px;background:linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red);touch-action:none;cursor:pointer}
.hys-ui-pf-color-hue span{position:absolute;top:50%;transform:translate(-50%,-50%);width:9px;height:18px;border:2px solid white;border-radius:4px;box-shadow:0 0 0 1px #0005;pointer-events:none}
.hys-ui-pf-color-presets{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}
.hys-ui-pf-color-presets button{padding:0;aspect-ratio:1;border:1px solid #0002;border-radius:4px;display:grid;place-items:center}
.hys-ui-pf-color-panel footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:10px;border-top:1px solid var(--hys-ui-border,var(--hys-ui-theme-border))}
.hys-ui-pf-color-panel footer span{font-size:10px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}
.hys-ui-pf-color-panel footer button{border:0;border-radius:6px;background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft));color:var(--hys-ui-primary,var(--hys-ui-theme-primary));padding:5px 10px;font:inherit;font-size:12px}
.hys-ui-pf-color-panel [tabindex]:focus-visible,.hys-ui-pf-color-panel button:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:3px}
</style>
