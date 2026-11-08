<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {computed,ref,watch,nextTick,onMounted,onActivated,onDeactivated,onBeforeUnmount} from 'vue';
import HysSegmented from '../HysSegmented/HysSegmented.vue'
import HysButton from '../HysButton/HysButton.vue'
export interface GanttItem { id:string|number; title:string; start:string; end:string; progress?:number; owner?:string; status?:string; dependencies?:Array<string|number>; color?:string; disabled?:boolean }
type Scale='day'|'week'|'month';
const props=withDefaults(defineProps<{items:GanttItem[];modelValue?:string|number|null;scale?:Scale;editable?:boolean;rowHeight?:number;labelWidth?:number;fitContainer?:boolean}>(),{scale:'day',editable:false,rowHeight:46,labelWidth:270,fitContainer:true});
const emit=defineEmits<{ 'update:modelValue':[id:string|number|null];'update:scale':[value:Scale];scaleChange:[value:Scale];'update:items':[items:GanttItem[]];change:[item:GanttItem];open:[item:GanttItem] }>();
const currentScale=ref<Scale>(props.scale);watch(()=>props.scale,v=>currentScale.value=v);
const selected=ref<string|number|null>(props.modelValue??null);watch(()=>props.modelValue,v=>selected.value=v??null);
const scroller=ref<HTMLElement|null>(null);const today=new Date();today.setHours(0,0,0,0);
const DAY=86400000;
function parseDate(v:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;const [y,m,d]=v.split('-').map(Number);const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null}
function atDay(d:Date){return Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(1970,0,1))/DAY)}
function dateFromDay(n:number){return new Date(n*DAY)}
function formatDay(n:number){return dateFromDay(n).toISOString().slice(0,10)}
const normalized=computed(()=>props.items.map(item=>{const start=parseDate(item.start),end=parseDate(item.end);if(!start||!end||atDay(end)<atDay(start))return null;return {...item,s:atDay(start),e:atDay(end),progress:Math.min(100,Math.max(0,item.progress??0))}}).filter((x):x is NonNullable<typeof x>=>x!==null));
const baseUnitWidth=computed(()=>currentScale.value==='day'?36:currentScale.value==='week'?17:currentScale.value==='month'?7:36);
const bounds=computed(()=>{const dates=normalized.value.flatMap(t=>[t.s,t.e]);const base=atDay(today);return {start:Math.min(base-7,...dates)-7,end:Math.max(base+21,...dates)+14}});
const totalDays=computed(()=>bounds.value.end-bounds.value.start+1);
const viewportWidth=ref(0);
const unitWidth=computed(()=>Math.max(baseUnitWidth.value,props.fitContainer?viewportWidth.value/totalDays.value:0));
const width=computed(()=>Math.max(totalDays.value*unitWidth.value,props.fitContainer?viewportWidth.value:0));
let resizeObserver:ResizeObserver|undefined;let active=true;
function measure(){if(!active)return;viewportWidth.value=scroller.value?.clientWidth||0}
function stopObserving(){resizeObserver?.disconnect();resizeObserver=undefined;window.removeEventListener('resize',measure)}
function observe(){stopObserving();if(!active||!scroller.value)return;measure();if(scroller.value&&typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(measure);resizeObserver.observe(scroller.value)}else window.addEventListener('resize',measure)}
onMounted(observe);onActivated(()=>{active=true;void nextTick(()=>active&&observe())});onDeactivated(()=>{active=false;stopObserving();cancelDrag()});onBeforeUnmount(()=>{active=false;stopObserving();cancelDrag()});
function changeScale(value:string){if(!['day','week','month'].includes(value)||value===currentScale.value)return;currentScale.value=value as Scale;emit('update:scale',value as Scale);emit('scaleChange',value as Scale)}
const days=computed(()=>Array.from({length:totalDays.value},(_,i)=>bounds.value.start+i));
const months=computed(()=>{const arr:{key:string;label:string;left:number;width:number}[]=[];for(let i=0;i<days.value.length;i++){const d=dateFromDay(days.value[i]);const key=`${d.getUTCFullYear()}-${d.getUTCMonth()}`;const last=arr[arr.length-1];if(last?.key===key)last.width+=unitWidth.value;else arr.push({key,label:`${d.getUTCFullYear()}年${d.getUTCMonth()+1}月`,left:i*unitWidth.value,width:unitWidth.value})}return arr});
const positions=computed(()=>new Map(normalized.value.map((t,i)=>[String(t.id),{x:(t.s-bounds.value.start)*unitWidth.value,w:(t.e-t.s+1)*unitWidth.value,y:i*props.rowHeight+props.rowHeight/2}])));
const edges=computed(()=>normalized.value.flatMap(t=>(t.dependencies??[]).flatMap(id=>{const from=positions.value.get(String(id)),to=positions.value.get(String(t.id));if(!from||!to||String(id)===String(t.id))return [];return [{id:`${id}-${t.id}`,path:`M ${from.x+from.w} ${from.y} H ${from.x+from.w+9} V ${to.y} H ${to.x}`}]})));
function select(t:GanttItem){selected.value=t.id;emit('update:modelValue',t.id);emit('open',t)}
function moveToToday(){const el=scroller.value;if(el)el.scrollLeft=Math.max(0,(atDay(today)-bounds.value.start)*unitWidth.value-el.clientWidth/3)}
watch(currentScale,()=>nextTick(moveToToday));
const drag=ref<{id:string|number;type:'move'|'start'|'end';x:number;original:GanttItem;days:number;unitWidth:number}|null>(null);
let captured:{element:HTMLElement;id:number}|undefined;
function releasePointer(){const capture=captured;captured=undefined;if(capture?.element.hasPointerCapture?.(capture.id))capture.element.releasePointerCapture(capture.id)}
function cancelDrag(){drag.value=null;releasePointer()}
function pointerDown(e:PointerEvent,t:GanttItem,type:'move'|'start'|'end'){if(!props.editable||t.disabled||e.button!==0)return;e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);captured={element:e.currentTarget as HTMLElement,id:e.pointerId};drag.value={id:t.id,type,x:e.clientX,original:{...t},days:0,unitWidth:unitWidth.value};selected.value=t.id;emit('update:modelValue',t.id)}
function pointerMove(e:PointerEvent){if(!drag.value)return;drag.value.days=Math.round((e.clientX-drag.value.x)/drag.value.unitWidth)}
function pointerEnd(e:PointerEvent){const state=drag.value;if(!state)return;drag.value=null;releasePointer();if(e.type==='pointercancel'||!state.days)return;const s=parseDate(state.original.start),end=parseDate(state.original.end);if(!s||!end)return;let start=atDay(s),finish=atDay(end);if(state.type==='move'){start+=state.days;finish+=state.days}else if(state.type==='start'){start=Math.min(finish,start+state.days)}else{finish=Math.max(start,finish+state.days)}const next={...state.original,start:formatDay(start),end:formatDay(finish)};emit('update:items',props.items.map(t=>String(t.id)===String(next.id)?next:t));emit('change',next)}
function preview(t:typeof normalized.value[number]){const state=drag.value;if(!state||String(state.id)!==String(t.id))return {s:t.s,e:t.e};const n=state.days;return state.type==='move'?{s:t.s+n,e:t.e+n}:state.type==='start'?{s:Math.min(t.e,t.s+n),e:t.e}:{s:t.s,e:Math.max(t.s,t.e+n)}}
function barStyle(t:typeof normalized.value[number]){const p=preview(t);return {left:`${(p.s-bounds.value.start)*unitWidth.value}px`,width:`${Math.max(unitWidth.value,(p.e-p.s+1)*unitWidth.value)}px`,background:t.color||'var(--hys-ui-primary,var(--hys-ui-theme-primary, #4776ed))'}}
function nudge(t:GanttItem,offset:number){if(!props.editable||t.disabled)return;const s=parseDate(t.start),e=parseDate(t.end);if(!s||!e)return;const next={...t,start:formatDay(atDay(s)+offset),end:formatDay(atDay(e)+offset)};emit('update:items',props.items.map(x=>String(x.id)===String(t.id)?next:x));emit('change',next)}

</script>
<template>
<section v-bind="hysRootAttrs" class="hys-ui-pg-gantt" aria-label="项目甘特图">
  <div class="hys-ui-pg-toolbar"><HysSegmented class="hys-ui-pg-scale" :model-value="currentScale" :options="[{label:'日',value:'day'},{label:'周',value:'week'},{label:'月',value:'month'}]" aria-label="时间刻度" @update:model-value="changeScale"/><HysButton variant="secondary" size="sm" class="hys-ui-pg-today" @click="moveToToday">定位今天</HysButton><span class="hys-ui-pg-hint">{{editable?'拖动任务条调整排期 · Alt + 左/右方向键微调日期':'点击任务查看详情'}}</span></div>
  <div class="hys-ui-pg-body"><div class="hys-ui-pg-labels" :style="{width:labelWidth+'px',minWidth:labelWidth+'px'}"><div class="hys-ui-pg-label-head">任务 / 负责人</div><button type="button" v-for="t in normalized" :key="t.id" class="hys-ui-pg-task-label" :class="{'hys-ui-selected':selected===t.id}" :style="{height:rowHeight+'px'}" @click="select(t)" @keydown.alt.left.prevent="nudge(t,-1)" @keydown.alt.right.prevent="nudge(t,1)"><strong :title="t.title">{{t.title}}</strong><small>{{t.owner||'未分配'}} · {{t.status||'待办'}}</small></button><div v-if="!normalized.length" class="hys-ui-pg-empty">暂无有效排期任务</div></div>
  <div ref="scroller" class="hys-ui-pg-scroll" tabindex="0" aria-label="可横向滚动的甘特图时间轴"><div class="hys-ui-pg-canvas" :style="{width:width+'px'}"><div class="hys-ui-pg-months"><span v-for="m in months" :key="m.key" :title="m.label" :style="{left:m.left+'px',width:m.width+'px'}">{{m.label}}</span></div><div class="hys-ui-pg-days"><span v-for="day in days" :key="day" :class="{'hys-ui-weekend':[0,6].includes(dateFromDay(day).getUTCDay()),'hys-ui-today':day===atDay(today)}" :style="{width:unitWidth+'px'}">{{currentScale==='month'?'':dateFromDay(day).getUTCDate()}}</span></div><div class="hys-ui-pg-grid" :style="{height:normalized.length*rowHeight+'px'}"><div v-for="day in days" :key="day" class="hys-ui-pg-day-column" :class="{'hys-ui-weekend':[0,6].includes(dateFromDay(day).getUTCDay())}" :style="{left:(day-bounds.start)*unitWidth+'px',width:unitWidth+'px'}"/><div class="hys-ui-pg-today-line" :style="{left:(atDay(today)-bounds.start)*unitWidth+unitWidth/2+'px'}"/><div v-for="(t,i) in normalized" :key="t.id" class="hys-ui-pg-row" :style="{top:i*rowHeight+'px',height:rowHeight+'px'}"><div class="hys-ui-pg-bar" :class="{'hys-ui-selected':selected===t.id,'hys-ui-dragging':drag?.id===t.id,'hys-ui-disabled':t.disabled}" :style="barStyle(t)" role="button" tabindex="0" :aria-label="`${t.title}，${t.start} 至 ${t.end}，完成 ${t.progress}%`" :title="`${t.title}
${t.start} → ${t.end}
完成 ${t.progress}%`" @click="select(t)" @keydown.enter="select(t)" @keydown.space.prevent="select(t)" @keydown.alt.left.prevent="nudge(t,-1)" @keydown.alt.right.prevent="nudge(t,1)" @pointerdown="pointerDown($event,t,'move')" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="cancelDrag"><div class="hys-ui-pg-progress" :style="{width:t.progress+'%'}"/><span class="hys-ui-pg-bar-title">{{t.progress}}%</span><span v-if="editable&&!t.disabled" class="hys-ui-pg-handle hys-ui-start" title="调整开始日期" @pointerdown.stop="pointerDown($event,t,'start')" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="cancelDrag"/><span v-if="editable&&!t.disabled" class="hys-ui-pg-handle hys-ui-end" title="调整结束日期" @pointerdown.stop="pointerDown($event,t,'end')" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="cancelDrag"/></div></div><svg v-if="edges.length" class="hys-ui-pg-dependencies" :width="width" :height="normalized.length*rowHeight" aria-hidden="true"><path v-for="edge in edges" :key="edge.id" :d="edge.path" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/></svg></div></div></div></div>
  <div class="hys-ui-pg-footer">{{normalized.length}} 项任务 · {{normalized.filter(x=>x.status==='已完成').length}} 项已完成 <span v-if="normalized.length!==items.length">· {{items.length-normalized.length}} 项日期无效已隐藏</span></div>
</section>
</template>

<style scoped>
.hys-ui-pg-scroll{min-width:0;flex:1}.hys-ui-pg-months span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hys-ui-pg-toolbar :deep(.hys-ui-pg-today){min-height:32px;transform:none}
</style>
