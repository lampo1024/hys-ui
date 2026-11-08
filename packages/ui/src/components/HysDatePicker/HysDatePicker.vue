<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import { computed, ref, watch, nextTick } from 'vue'
import { CalendarDays } from 'lucide-vue-next'
import HysCalendarNavigation from '../HysCalendarNavigation/HysCalendarNavigation.vue'
import { useFloating } from '../../composables/useFloating'

const props = defineProps<{modelValue:string; disabled?:boolean; min?:string; max?:string; placeholder?:string; label?:string;clearable?:boolean;disabledDate?:(date:Date)=>boolean}>()
const {disabled:controlDisabled}=useHysControlState(props)

const emit = defineEmits<{'update:modelValue':[value:string]}>()
const trigger = ref<HTMLElement>(), panel = ref<HTMLElement>()
const { open, style, show, close } = useFloating(trigger, panel)
const today = new Date()
function format(date:Date) { return [date.getUTCFullYear(), String(date.getUTCMonth()+1).padStart(2,'0'), String(date.getUTCDate()).padStart(2,'0')].join('-') }
const todayKey = format(new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())))
const month = ref(new Date(todayKey+'T00:00:00Z'))
function unavailable(value:string) { return !!((props.min && value < props.min) || (props.max && value > props.max) || props.disabledDate?.(new Date(value+'T00:00:00Z'))) }
const days = computed(() => {
 const first = new Date(Date.UTC(month.value.getUTCFullYear(), month.value.getUTCMonth(), 1))
 return Array.from({length:42}, (_, i) => {
  const date = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),i-(first.getUTCDay()+6)%7+1))
  return {value:format(date),day:date.getUTCDate(),outside:date.getUTCMonth()!==first.getUTCMonth()}
 })
})
async function expand() {
 if (controlDisabled.value) return
 if (open.value) {close(); return}
 let value = props.modelValue || todayKey
 if(props.min && value<props.min) value=props.min
 if(props.max && value>props.max) value=props.max
 const date=new Date(value+'T00:00:00Z')
 if(!Number.isNaN(date.getTime())) month.value=date
 await show()
 const target=Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('[data-date]:not(:disabled)')||[]).find(el=>el.dataset.date===value)
 ;(target || panel.value?.querySelector<HTMLButtonElement>('[data-date]:not(:disabled)'))?.focus()
}
function choose(value:string) {
 if(controlDisabled.value || unavailable(value)) return
 emit('update:modelValue',value)
 close(true)
}
async function navigate(event:KeyboardEvent,value:string) {
 const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}
 if(!(event.key in offsets)) return
 event.preventDefault()
 const date=new Date(value+'T00:00:00Z')
 date.setUTCDate(date.getUTCDate()+offsets[event.key])
 const next=format(date)
 if(unavailable(next)) return
 month.value=date
 await nextTick()
 Array.from(panel.value?.querySelectorAll<HTMLButtonElement>('[data-date]')||[]).find(el=>el.dataset.date===next)?.focus()
}
watch(()=>controlDisabled.value,value=>{if(value)close()})

</script>
<template>
 <div v-bind="hysRootAttrs" class="hys-ui-pf-date-picker">
  <button ref="trigger" type="button" class="hys-ui-v4-control hys-ui-pf-select-trigger" :disabled="controlDisabled" :aria-label="label||'选择日期'" aria-haspopup="dialog" :aria-expanded="open" @click="expand">
   <span :class="{'hys-ui-pf-placeholder':!modelValue}">{{modelValue||placeholder||'选择日期'}}</span><CalendarDays :size="16" class="hys-ui-pf-select-icon" aria-hidden="true"/>
  </button>
  <Teleport to="body">
   <div v-bind="hysRootAttrs" v-if="open" ref="panel" class="hys-ui-v4-menu hys-ui-pf-calendar" :style="style" role="dialog" :aria-label="label||'选择日期'">
    <HysCalendarNavigation v-model:month="month" :min="min" :max="max">
    <div class="hys-ui-pf-calendar-week" aria-hidden="true"><span v-for="day in ['一','二','三','四','五','六','日']" :key="day">{{day}}</span></div>
    <div class="hys-ui-pf-calendar-grid">
     <button v-for="day in days" :key="day.value" type="button" :data-date="day.value" :aria-label="day.value" :aria-pressed="day.value===modelValue" :aria-current="day.value===todayKey?'date':undefined" :disabled="unavailable(day.value)" :class="{'hys-ui-is-outside':day.outside,'hys-ui-is-selected':day.value===modelValue,'hys-ui-is-today':day.value===todayKey}" @click="choose(day.value)" @keydown="navigate($event,day.value)">{{day.day}}</button>
    </div>
    </HysCalendarNavigation><button v-if="clearable" type="button" class="hys-ui-v4-option" @click="emit('update:modelValue','');close(true)">清空</button><div class="hys-ui-pf-calendar-footer"><button type="button" :disabled="unavailable(todayKey)" @click="choose(todayKey)">今天</button><button type="button" @click="close(true)">关闭</button></div>
   </div>
  </Teleport>
 </div>
</template>
