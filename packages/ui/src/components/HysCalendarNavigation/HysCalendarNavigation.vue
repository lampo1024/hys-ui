<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {computed, nextTick, ref} from 'vue'
import {ChevronLeft, ChevronRight} from 'lucide-vue-next'

const props = defineProps<{month:Date; min?:string; max?:string}>()
const emit = defineEmits<{'update:month':[value:Date]}>()
const view = ref<'days'|'months'|'years'>('days')
const root = ref<HTMLElement>()
const year = computed(() => props.month.getUTCFullYear())
const yearPage = ref(Math.floor(year.value / 12) * 12)
const years = computed(() => Array.from({length:12}, (_, i) => yearPage.value + i))
function allowedYear(value:number) {
 return (!props.min || value >= Number(props.min.slice(0,4))) && (!props.max || value <= Number(props.max.slice(0,4)))
}
function allowedMonth(value:number) {
 const key = String(year.value).padStart(4,'0') + '-' + String(value+1).padStart(2,'0')
 return (!props.min || key >= props.min.slice(0,7)) && (!props.max || key <= props.max.slice(0,7))
}
async function focusChoice() {
 await nextTick()
 const selected = root.value?.querySelector<HTMLButtonElement>('.hys-ui-pf-calendar-periods button[aria-pressed="true"]:not(:disabled)')
 ;(selected || root.value?.querySelector<HTMLButtonElement>('.hys-ui-pf-calendar-periods button:not(:disabled)'))?.focus()
}
function showYears() {
 yearPage.value = Math.floor(year.value / 12) * 12
 view.value = 'years'
 focusChoice()
}
function showMonths() {
 view.value = 'months'
 focusChoice()
}
function move(offset:number) {
 if(view.value === 'years') {yearPage.value += offset * 12; return}
 const next = view.value === 'months'
  ? new Date(Date.UTC(year.value + offset, props.month.getUTCMonth(), 1))
  : new Date(Date.UTC(year.value, props.month.getUTCMonth() + offset, 1))
 emit('update:month',next)
}
function selectYear(value:number) {
 if(!allowedYear(value)) return
 emit('update:month',new Date(Date.UTC(value,props.month.getUTCMonth(),1)))
 showMonths()
}
async function returnToDates() {
 view.value = 'days'
 await nextTick()
 root.value?.querySelector<HTMLButtonElement>('[data-date]:not(:disabled)')?.focus()
}
function selectMonth(value:number) {
 if(!allowedMonth(value)) return
 emit('update:month',new Date(Date.UTC(year.value,value,1)))
 returnToDates()
}

</script>
<template>
 <div v-bind="hysRootAttrs" ref="root">
  <div class="hys-ui-pf-calendar-heading">
   <button type="button" :aria-label="view==='years'?'上一组年份':view==='months'?'上一年':'上个月'" @click="move(-1)"><ChevronLeft :size="16" aria-hidden="true"/></button>
   <div class="hys-ui-pf-calendar-period-title" aria-live="polite">
    <button v-if="view==='years'" type="button" aria-label="返回日期" title="返回日期面板" @click="returnToDates">{{yearPage}} — {{yearPage+11}}</button>
    <template v-else>
     <button type="button" aria-label="选择年份" @click="showYears">{{year}}年</button>
     <button type="button" :aria-label="view==='months'?'返回日期':'选择月份'" :title="view==='months'?'返回日期面板':'选择月份'" :aria-pressed="view==='months'" @click="view==='months'?returnToDates():showMonths()">{{month.getUTCMonth()+1}}月</button>
    </template>
   </div>
   <button type="button" :aria-label="view==='years'?'下一组年份':view==='months'?'下一年':'下个月'" @click="move(1)"><ChevronRight :size="16" aria-hidden="true"/></button>
  </div>
  <div v-if="view==='years'" class="hys-ui-pf-calendar-periods" role="group" aria-label="年份选择">
   <button v-for="value in years" :key="value" type="button" :aria-pressed="value===year" :disabled="!allowedYear(value)" @click="selectYear(value)">{{value}}年</button>
  </div>
  <div v-else-if="view==='months'" class="hys-ui-pf-calendar-periods" role="group" aria-label="月份选择">
   <button v-for="value in 12" :key="value" type="button" :aria-pressed="value-1===month.getUTCMonth()" :disabled="!allowedMonth(value-1)" @click="selectMonth(value-1)">{{value}}月</button>
  </div>
  <slot v-else/>
 </div>
</template>
