<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import { computed, nextTick, onDeactivated, onBeforeUnmount, ref, useId, watch } from 'vue'
import {ChevronDown,ChevronRight,ChevronUp,Search,Settings2} from 'lucide-vue-next';
import {useMotion} from '../../motion/useMotion'
import HysSortableList from '../HysSortableList/HysSortableList.vue'
import HysSelect from '../HysSelect/HysSelect.vue'
import HysInput from '../HysInput/HysInput.vue'
import HysCheckbox from '../HysCheckbox/HysCheckbox.vue'
import HysButton from '../HysButton/HysButton.vue'
import HysPagination from '../HysPagination/HysPagination.vue'
export interface GridColumn { key:string; label:string; width?:number; minWidth?:number; maxWidth?:number; sortable?:boolean; filterable?:boolean; hideable?:boolean; resizable?:boolean; reorderable?:boolean; pinned?:'left'|'right'; align?:'left'|'center'|'right'; summary?:'sum'|'avg'|'min'|'max'|'count'; editable?:boolean }
type Row = Record<string,unknown>
type Sort = {key:string;direction:'asc'|'desc'} | null
type SortRule = {key:string;direction:'asc'|'desc'}
const props=withDefaults(defineProps<{columns:GridColumn[];rows:Row[];rowKey?:string;pageSize?:number;storageKey?:string;selectable?:boolean;loading?:boolean;emptyText?:string;density?:'compact'|'normal'|'comfortable';serverMode?:boolean;totalRows?:number;page?:number;multiSort?:boolean;stickyHeader?:boolean;groupable?:boolean;showSummary?:boolean;treeMode?:boolean;parentKey?:string;editable?:boolean}>(),{rowKey:'id',pageSize:10,selectable:true,loading:false,emptyText:'暂无数据',density:'normal',parentKey:'parentId'})
const emit=defineEmits<{rowClick:[row:Row];selectionChange:[keys:(string|number)[]];columnsChange:[keys:string[]];sortChange:[sort:Sort];pageChange:[page:number];queryChange:[query:{page:number;pageSize:number;sort:SortRule[];search:string;filters:Record<string,string>}];pageSizeChange:[size:number];cellEdit:[payload:{row:Row;rowKey:string|number;column:string;value:string}];batchEdit:[payload:{keys:(string|number)[];column:string;value:string}]}>()
const initial=():Record<string,unknown>=>{
 if(!props.storageKey||typeof localStorage==='undefined')return {}
 try {
  const value=JSON.parse(localStorage.getItem('hys-ui-grid:'+props.storageKey)||'{}')
  return value&&typeof value==='object'&&!Array.isArray(value)?value:{}
 } catch {return {}}
}
const saved=initial()
const savedOrder=Array.isArray(saved.order)?saved.order.filter((key):key is string=>typeof key==='string'):[]
const savedHidden=Array.isArray(saved.hidden)?saved.hidden.filter((key):key is string=>typeof key==='string'):[]
const savedWidths=saved.widths&&typeof saved.widths==='object'&&!Array.isArray(saved.widths)
 ?Object.fromEntries(Object.entries(saved.widths).filter((entry):entry is [string,number]=>typeof entry[1]==='number'&&Number.isFinite(entry[1])))
 :{}
const order=ref<string[]>(savedOrder);const hidden=ref<string[]>(savedHidden);const widths=ref<Record<string,number>>(savedWidths);const sort=ref<Sort>(null);const sorts=ref<SortRule[]>([]);const currentPageSize=ref(Math.max(1,props.pageSize));const filters=ref<Record<string,string>>({});const search=ref('');const groupBy=ref('');const expandedTree=ref<(string|number)[]>([]);const editing=ref<{id:string|number;key:string}|null>(null);const editValue=ref('');const batchColumn=ref('');const batchValue=ref('');const collapsedGroups=ref<string[]>([]);const page=ref(1);const selected=ref<(string|number)[]>([]);const settingsOpen=ref(false);const menuRef=ref<HTMLElement|null>(null);const tableRef=ref<HTMLElement|null>(null)
watch(()=>props.columns,()=>{
 if(!props.columns.length)return
 const keys=props.columns.map(column=>column.key)
 order.value=[...new Set([...order.value.filter(key=>keys.includes(key)),...keys])]
 hidden.value=[...new Set(hidden.value.filter(key=>props.columns.some(column=>column.key===key&&column.hideable!==false)))]
 if(keys.every(key=>hidden.value.includes(key)))hidden.value=[]
 widths.value=Object.fromEntries(props.columns.filter(column=>widths.value[column.key]!=null).map(column=>[
  column.key,Math.max(column.minWidth||80,Math.min(column.maxWidth||800,widths.value[column.key]))
 ]))
},{immediate:true,deep:true})
function persistColumns() {
 if(!props.storageKey||typeof localStorage==='undefined')return
 try {localStorage.setItem('hys-ui-grid:'+props.storageKey,JSON.stringify({order:order.value,hidden:hidden.value,widths:widths.value}))}catch{}
}
persistColumns()
watch([order,hidden,widths],()=>{persistColumns();emit('columnsChange',visibleColumns.value.map(c=>c.key))},{deep:true})
const visibleColumns=computed(()=>{
 const keys=[...new Set([...order.value,...props.columns.map(column=>column.key)])]
 const columns=keys.filter(key=>!hidden.value.includes(key)).map(key=>props.columns.find(column=>column.key===key)).filter((column):column is GridColumn=>!!column)
 return columns.length?columns:props.columns
})
defineExpose({resetColumns})
const orderedColumns=computed(()=>[...visibleColumns.value.filter(c=>c.pinned==='left'),...visibleColumns.value.filter(c=>!c.pinned),...visibleColumns.value.filter(c=>c.pinned==='right')])
const filtersVisible=ref(false), activeFilterColumn=ref<string>(), filterRowId=useId()
async function closeColumnFilters(restoreFocus=true) {
 filtersVisible.value=false
 if(!restoreFocus)return
 await nextTick()
 const headers=Array.from(tableRef.value?.querySelectorAll<HTMLElement>('thead th[data-column-key]')||[])
 const header=headers.find(cell=>cell.dataset.columnKey===activeFilterColumn.value)
 ;(header?.querySelector<HTMLButtonElement>('.hys-ui-pf-grid-filter')||tableRef.value?.querySelector<HTMLButtonElement>('.hys-ui-pf-grid-filter'))?.focus({preventScroll:true})
}
async function showColumnFilters(column:GridColumn) {
 if(filtersVisible.value&&activeFilterColumn.value===column.key){await closeColumnFilters(false);return}
 activeFilterColumn.value=column.key
 filtersVisible.value=true
 await nextTick()
 const cell=Array.from(tableRef.value?.querySelectorAll<HTMLElement>('[data-filter-key]')||[]).find(element=>element.dataset.filterKey===column.key)
 cell?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true})
}
const settingsItems=computed(()=>[...new Set([...order.value,...props.columns.map(column=>column.key)])].flatMap(key=>{const column=props.columns.find(column=>column.key===key);return column?[{id:key,label:column.label}]:[]}))
const tableWidth=computed(()=>orderedColumns.value.reduce((total,column)=>total+(widths.value[column.key]||column.width||160),props.selectable?44:0))
const stickyOffsets=computed(()=>{const offsets:Record<string,{left?:string;right?:string}>={};let left=props.selectable?44:0;for(const c of orderedColumns.value.filter(c=>c.pinned==='left')){offsets[c.key]={left:left+'px'};left+=widths.value[c.key]||c.width||160}let right=0;for(const c of [...orderedColumns.value].reverse().filter(c=>c.pinned==='right')){offsets[c.key]={right:right+'px'};right+=widths.value[c.key]||c.width||160}return offsets})
const pinnedStyle=(c:GridColumn,header=false)=>c.pinned?{position:'sticky' as const,...stickyOffsets.value[c.key],zIndex:header?5:2}:{}
const safePageSize=computed(()=>Math.max(1,currentPageSize.value))
watch(()=>props.pageSize,v=>currentPageSize.value=Math.max(1,v))
watch(()=>props.page,v=>{if(v!=null)page.value=Math.max(1,v)})
const effectiveSorts=computed(()=>props.multiSort?sorts.value:(sort.value?[sort.value]:[]))
const cellValue=(r:Row,k:string)=>r[k]==null?'':String(r[k])
const processed=computed(()=>{if(props.serverMode)return props.rows;const term=search.value.trim().toLocaleLowerCase();let rows=props.rows.filter(r=>(!term||props.columns.some(c=>cellValue(r,c.key).toLocaleLowerCase().includes(term)))&&Object.entries(filters.value).every(([k,v])=>!v||cellValue(r,k).toLocaleLowerCase().includes(v.toLocaleLowerCase())));if(effectiveSorts.value.length){rows=[...rows].sort((a,b)=>{for(const {key,direction} of effectiveSorts.value){const av=a[key],bv=b[key];const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av??'').localeCompare(String(bv??''),'zh-CN',{numeric:true});if(cmp)return direction==='asc'?cmp:-cmp}return 0})}return rows})
const totalPages=computed(()=>Math.max(1,Math.ceil((props.serverMode?(props.totalRows??props.rows.length):processed.value.length)/safePageSize.value)))
watch([search,filters,sort,sorts,()=>props.pageSize],()=>{page.value=1},{deep:true})
watch(totalPages,v=>{page.value=Math.min(page.value,v)})
const treeRows=computed(()=>{if(!props.treeMode)return processed.value;const rows=processed.value;const ids=new Set(rows.map(r=>r[props.rowKey]));const children=new Map<unknown,Row[]>();for(const r of rows){const parent=r[props.parentKey];const key=parent!=null&&ids.has(parent)?parent:null;const list=children.get(key)||[];list.push(r);children.set(key,list)}const result:Row[]=[];const visited=new Set<Row>();const walk=(r:Row,depth:number)=>{if(visited.has(r))return;visited.add(r);result.push({...r,__pfDepth:depth,__pfHasChildren:(children.get(r[props.rowKey])||[]).length>0});if(expandedTree.value.includes(r[props.rowKey] as string|number))for(const child of children.get(r[props.rowKey])||[])walk(child,depth+1)};for(const root of children.get(null)||[])walk(root,0);for(const r of rows)if(!visited.has(r))walk(r,0);return result})
const pageRows=computed(()=>props.serverMode?treeRows.value:treeRows.value.slice((page.value-1)*safePageSize.value,page.value*safePageSize.value))
const rowId=(r:Row,index:number):string|number=>{const key=r[props.rowKey];return typeof key==='string'||typeof key==='number'?key:index+(page.value-1)*safePageSize.value}
watch(()=>props.rows,rows=>{if(!props.serverMode){const valid=new Set(rows.map((r,i)=>{const k=r[props.rowKey];return typeof k==='string'||typeof k==='number'?k:i}));const next=selected.value.filter(k=>valid.has(k));if(next.length!==selected.value.length){selected.value=next;emit('selectionChange',next)}}})
const groupOptions=computed(()=>props.columns.filter(c=>c.key!==props.rowKey))
const groupLabel=(v:unknown)=>v==null||v===''?'（空）':String(v)
const groupKey=(v:unknown)=>JSON.stringify(v??null)
const displayRows=computed(()=>{
  if(!groupBy.value)return pageRows.value.map((row,i)=>({kind:'row' as const,row,index:i,key:String(rowId(row,i))}))
  const buckets=new Map<string,{label:string;rows:{row:Row;index:number}[]}>()
  pageRows.value.forEach((row,i)=>{const key=groupKey(row[groupBy.value]);if(!buckets.has(key))buckets.set(key,{label:groupLabel(row[groupBy.value]),rows:[]});buckets.get(key)!.rows.push({row,index:i})})
  const out:Array<{kind:'group'|'row';key:string;label?:string;count?:number;row?:Row;index?:number}>=[]
  for(const [key,b] of buckets){out.push({kind:'group',key,label:b.label,count:b.rows.length});if(!collapsedGroups.value.includes(key))for(const r of b.rows)out.push({kind:'row',key:key+':'+String(rowId(r.row,r.index)),row:r.row,index:r.index})}
  return out
})
function toggleTree(key:string|number){expandedTree.value=expandedTree.value.includes(key)?expandedTree.value.filter(k=>k!==key):[...expandedTree.value,key]}
function beginEdit(row:Row,c:GridColumn){if(!props.editable||!c.editable)return;editing.value={id:rowId(row,0),key:c.key};editValue.value=cellValue(row,c.key)}
function commitEdit(row:Row,c:GridColumn){if(!editing.value)return;emit('cellEdit',{row,rowKey:editing.value.id,column:c.key,value:editValue.value});editing.value=null}
function commitBatch(){if(!batchColumn.value||!selected.value.length)return;emit('batchEdit',{keys:[...selected.value],column:batchColumn.value,value:batchValue.value});batchValue.value=''}
function toggleGroup(key:string){collapsedGroups.value=collapsedGroups.value.includes(key)?collapsedGroups.value.filter(k=>k!==key):[...collapsedGroups.value,key]}
watch(groupBy,()=>collapsedGroups.value=[])
const summaryValue=(c:GridColumn)=>{
  if(!c.summary)return ''
  const values=processed.value.map(r=>r[c.key]).filter(v=>v!==null&&v!==undefined&&v!=='')
  if(c.summary==='count')return String(values.length)
  const nums=values.map(Number).filter(Number.isFinite)
  if(!nums.length)return '—'
  const result=c.summary==='sum'?nums.reduce((a,b)=>a+b,0):c.summary==='avg'?nums.reduce((a,b)=>a+b,0)/nums.length:c.summary==='min'?Math.min(...nums):Math.max(...nums)
  return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(result)
}
const pageKeys=computed(()=>pageRows.value.map((r,i)=>rowId(r,i)))
const allPageSelected=computed(()=>pageKeys.value.length>0&&pageKeys.value.every(k=>selected.value.includes(k)))
const somePageSelected=computed(()=>pageKeys.value.some(k=>selected.value.includes(k)))
function selectRow(key:string|number,checked:boolean){selected.value=checked?[...new Set([...selected.value,key])]:selected.value.filter(k=>k!==key);emit('selectionChange',selected.value)}
function selectPage(checked:boolean){const keys=new Set(pageKeys.value);selected.value=checked?[...new Set([...selected.value,...keys])]:selected.value.filter(k=>!keys.has(k));emit('selectionChange',selected.value)}
function applySort(column:GridColumn,direction:'asc'|'desc'|null) {
 if(column.sortable===false)return
 const rule=direction?{key:column.key,direction}:null
 if(props.multiSort) {
  sorts.value=sorts.value.filter(item=>item.key!==column.key)
  if(rule)sorts.value=[...sorts.value,rule]
  sort.value=sorts.value[0]??null
 } else {
  sort.value=rule
  sorts.value=rule?[rule]:[]
 }
 emit('sortChange',sort.value)
}
function toggleSort(column:GridColumn) {
 const current=effectiveSorts.value.find(item=>item.key===column.key)?.direction
 applySort(column,current==='asc'?'desc':current==='desc'?null:'asc')
}
function chooseSort(column:GridColumn,direction:'asc'|'desc') {
 const current=effectiveSorts.value.find(item=>item.key===column.key)?.direction
 applySort(column,current===direction?null:direction)
}

function setPage(n:number){page.value=Math.max(1,Math.min(n,totalPages.value));emit('pageChange',page.value)}
function onPageSizeChange(size:number){currentPageSize.value=size;page.value=1;emit('pageSizeChange',size)}
watch([page,currentPageSize,effectiveSorts,search,filters],()=>emit('queryChange',{page:page.value,pageSize:safePageSize.value,sort:[...effectiveSorts.value],search:search.value,filters:{...filters.value}}),{deep:true})
function toggleColumn(c:GridColumn){if(c.hideable===false)return;if(hidden.value.includes(c.key))hidden.value=hidden.value.filter(k=>k!==c.key);else if(visibleColumns.value.length>1)hidden.value=[...hidden.value,c.key]}
let resizing:{key:string;start:number;width:number;min:number;max:number}|null=null
function onPointerMove(e:PointerEvent){if(!resizing)return;widths.value={...widths.value,[resizing.key]:Math.max(resizing.min,Math.min(resizing.max,resizing.width+e.clientX-resizing.start))}}
function stopResize(){resizing=null;window.removeEventListener('pointermove',onPointerMove);window.removeEventListener('pointerup',stopResize);document.body.style.cursor=''}
function startResize(e:PointerEvent,c:GridColumn){if(c.resizable===false)return;e.preventDefault();e.stopPropagation();resizing={key:c.key,start:e.clientX,width:widths.value[c.key]||c.width||160,min:c.minWidth||80,max:c.maxWidth||800};document.body.style.cursor='col-resize';window.addEventListener('pointermove',onPointerMove);window.addEventListener('pointerup',stopResize)}
const {effectiveMotion}=useMotion()
const dragging=ref<string|null>(null)
const columnDropTarget=ref<{key:string;position:'before'|'after'}|null>(null)
let columnDragFrame=0
let pendingColumnHover:{element:HTMLElement;column:GridColumn;x:number}|null=null
let columnAnimationGeneration=0
const columnAnimations=new Set<Animation>()
const maxColumnAnimations=160

function stopColumnAnimations() {
 columnAnimationGeneration++
 for(const animation of columnAnimations)animation.cancel()
 columnAnimations.clear()
}
watch(effectiveMotion,value=>{if(value==='off')stopColumnAnimations()})
function endColumnDrag() {
 cancelAnimationFrame(columnDragFrame)
 columnDragFrame=0
 pendingColumnHover=null
 dragging.value=null
 columnDropTarget.value=null
}
function startColumnDrag(event:DragEvent,column:GridColumn) {
 if(resizing||column.reorderable===false||!event.dataTransfer){event.preventDefault();return}
 stopColumnAnimations()
 dragging.value=column.key
 event.dataTransfer.effectAllowed='move'
 event.dataTransfer.setData('text/plain',column.key)
}
function canDropColumn(column:GridColumn) {
 const source=props.columns.find(item=>item.key===dragging.value)
 return !!source&&source.key!==column.key&&source.reorderable!==false&&column.reorderable!==false&&source.pinned===column.pinned
}
function columnDestination(column:GridColumn,x:number,element:HTMLElement) {
 const bounds=element.getBoundingClientRect()
 return {key:column.key,position:x<bounds.left+bounds.width/2?'before' as const:'after' as const}
}
function previewColumnDrop(event:DragEvent,column:GridColumn) {
 if(!canDropColumn(column)){cancelAnimationFrame(columnDragFrame);columnDragFrame=0;pendingColumnHover=null;columnDropTarget.value=null;return}
 event.preventDefault()
 if(event.dataTransfer)event.dataTransfer.dropEffect='move'
 pendingColumnHover={element:event.currentTarget as HTMLElement,column,x:event.clientX}
 if(columnDragFrame)return
 columnDragFrame=requestAnimationFrame(()=>{
  columnDragFrame=0
  const hover=pendingColumnHover
  pendingColumnHover=null
  if(!hover||!canDropColumn(hover.column))return
  const next=columnDestination(hover.column,hover.x,hover.element)
  if(columnDropTarget.value?.key!==next.key||columnDropTarget.value.position!==next.position)columnDropTarget.value=next
 })
}
function leaveColumnDrag(event:DragEvent) {
 if(event.relatedTarget instanceof Element&&event.relatedTarget.closest('th[data-column-key]')&&(event.currentTarget as HTMLElement).contains(event.relatedTarget))return
 cancelAnimationFrame(columnDragFrame)
 columnDragFrame=0
 pendingColumnHover=null
 columnDropTarget.value=null
}
function columnBounds() {
 return new Map(Array.from(tableRef.value?.querySelectorAll<HTMLElement>('th[data-column-key]')||[]).map(element=>[
  element.dataset.columnKey!,element.getBoundingClientRect()
 ]))
}
function animateColumnReorder(before:Map<string,DOMRect>) {
 if(effectiveMotion.value==='off')return
 const scroll=tableRef.value?.querySelector<HTMLElement>('.hys-ui-pf-grid-scroll')
 if(!scroll)return
 const bounds=scroll.getBoundingClientRect()
 const top=Math.max(0,bounds.top),bottom=Math.min(window.innerHeight,bounds.bottom)
 const left=Math.max(0,bounds.left),right=Math.min(window.innerWidth,bounds.right)
 if(top>=bottom||left>=right)return
 const deltas=new Map<string,number>()
 // Read header geometry once per column, before starting any animation.
 for(const [key,after] of columnBounds()) {
  const old=before.get(key)
  if(old&&after.right>left&&after.left<right&&Math.abs(old.left-after.left)>.5)deltas.set(key,old.left-after.left)
 }
 const cells:HTMLElement[]=[]
 for(const row of Array.from(scroll.querySelectorAll<HTMLElement>('thead tr,tbody tr,tfoot tr'))) {
  const rect=row.getBoundingClientRect()
  if(rect.top>=bottom)break
  if(rect.bottom<=top)continue
  for(const cell of Array.from(row.children)) {
   if(cell instanceof HTMLElement&&deltas.has(cell.dataset.columnKey||''))cells.push(cell)
   if(cells.length>=maxColumnAnimations)break
  }
  if(cells.length>=maxColumnAnimations)break
 }
 const duration=effectiveMotion.value==='full'?280:180
 // Transform-only animation avoids per-frame layout or data processing.
 for(const cell of cells) {
  const delta=deltas.get(cell.dataset.columnKey!)!
  const animation=cell.animate([{transform:'translateX('+delta+'px)'},{transform:'translateX(0)'}],{duration,easing:'cubic-bezier(.2,.8,.2,1)'})
  columnAnimations.add(animation)
  animation.onfinish=()=>columnAnimations.delete(animation)
  animation.oncancel=()=>columnAnimations.delete(animation)
 }
}
async function dropColumn(event:DragEvent,column:GridColumn) {
 if(!canDropColumn(column)){endColumnDrag();return}
 event.preventDefault()
 const target=columnDestination(column,event.clientX,event.currentTarget as HTMLElement)
 const next=order.value.filter(key=>key!==dragging.value)
 const index=next.indexOf(target.key)
 if(index<0){endColumnDrag();return}
 next.splice(index+(target.position==='after'?1:0),0,dragging.value!)
 endColumnDrag()
 if(next.every((key,index)=>key===order.value[index]))return
 stopColumnAnimations()
 const generation=columnAnimationGeneration
 const before=effectiveMotion.value==='off'?new Map<string,DOMRect>():columnBounds()
 order.value=next
 await nextTick()
 if(generation===columnAnimationGeneration)animateColumnReorder(before)
}
function resetColumns(){endColumnDrag();stopColumnAnimations();order.value=props.columns.map(c=>c.key);hidden.value=[];widths.value={}}
function exportCsv(){const cols=visibleColumns.value;const quote=(s:string)=>'"'+s.replace(/"/g,'""')+'"';const content='\uFEFF'+[cols.map(c=>quote(c.label)).join(','),...processed.value.map(r=>cols.map(c=>quote(cellValue(r,c.key))).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='projectflow-table.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function closeOutside(e:PointerEvent){if(menuRef.value&&!menuRef.value.contains(e.target as Node))settingsOpen.value=false}
watch(settingsOpen,async v=>{if(v){await nextTick();document.addEventListener('pointerdown',closeOutside)}else document.removeEventListener('pointerdown',closeOutside)})
onDeactivated(()=>{endColumnDrag();stopColumnAnimations();stopResize();settingsOpen.value=false;document.removeEventListener('pointerdown',closeOutside)})
onBeforeUnmount(()=>{endColumnDrag();stopColumnAnimations();stopResize();document.removeEventListener('pointerdown',closeOutside)})

</script>
<template>
<section v-bind="hysRootAttrs" class="hys-ui-pf-grid" :class="'hys-ui-pf-grid--'+density" aria-label="数据表格" ref="tableRef">
  <div class="hys-ui-pf-grid-toolbar"><label class="hys-ui-pf-grid-search"><span>搜索</span><HysInput size="sm" v-model="search" type="search" placeholder="搜索全部列…" aria-label="搜索表格" clearable/></label><label v-if="groupable" class="hys-ui-pf-grid-group-label">分组 <HysSelect size="sm" v-model="groupBy" aria-label="按列分组" :options="[{label:'不分组',value:''},...groupOptions.map(c=>({label:c.label,value:c.key}))]"/></label><div v-if="editable&&selected.length" class="hys-ui-pf-grid-batch"><HysSelect size="sm" v-model="batchColumn" aria-label="批量编辑字段" :options="[{label:'选择编辑列',value:''},...columns.filter(c=>c.editable).map(c=>({label:c.label,value:c.key}))]"/><HysInput size="sm" v-model="batchValue" aria-label="批量编辑值" placeholder="新值"/><HysButton variant="ghost" size="sm" type="button" :disabled="!batchColumn" @click="commitBatch">应用到 {{selected.length}} 行</HysButton></div><template v-if="filtersVisible">
 <HysButton variant="ghost" size="sm" type="button" @click="filters={}">清空筛选</HysButton>
</template><span class="hys-ui-pf-grid-count">{{serverMode?(totalRows??rows.length):processed.length}} 条记录 · 已选 {{selected.length}}</span><div class="hys-ui-pf-grid-menu" ref="menuRef"><HysButton variant="ghost" size="sm" type="button" @click="settingsOpen=!settingsOpen" :aria-expanded="settingsOpen" aria-label="配置显示列"><Settings2 :size="16" aria-hidden="true"/> 列设置</HysButton><div v-if="settingsOpen" class="hys-ui-pf-grid-panel"><strong>显示列与排序</strong><HysSortableList class="hys-ui-pf-grid-settings-list" :model-value="settingsItems" @update:model-value="items=>order=items.map(item=>item.id)">
 <template #item="{item}"><HysCheckbox :model-value="!hidden.includes(item.id)" :label="item.label" :disabled="columns.find(column=>column.key===item.id)?.hideable===false||(!hidden.includes(item.id)&&visibleColumns.length===1)" @update:model-value="toggleColumn(columns.find(column=>column.key===item.id)!)"/></template>
</HysSortableList><HysButton variant="ghost" size="sm" type="button" @click="resetColumns">恢复默认列</HysButton></div></div><HysButton variant="ghost" size="sm" type="button" @click="exportCsv">导出 CSV</HysButton></div>
  <div class="hys-ui-pf-grid-scroll" @dragleave="leaveColumnDrag"><table :class="{'hys-ui-pf-grid-sticky-head':stickyHeader}" :style="{minWidth:tableWidth+'px'}"><colgroup><col v-if="selectable" style="width:44px"/><col v-for="c in orderedColumns" :key="c.key" :style="{width:(widths[c.key]||c.width||160)+'px'}"/></colgroup><thead><tr><th v-if="selectable" scope="col" class="hys-ui-pf-grid-select-col"><HysCheckbox aria-label="选择当前页全部行" :model-value="allPageSelected" :indeterminate="somePageSelected&&!allPageSelected" @update:model-value="selectPage"/></th><th v-for="c in orderedColumns" :key="c.key" scope="col" :data-column-key="c.key" :class="{'hys-ui-is-column-dragging':dragging===c.key}" :data-drop-position="columnDropTarget?.key===c.key?columnDropTarget.position:undefined" :draggable="c.reorderable!==false" @dragstart="startColumnDrag($event,c)" @dragend="endColumnDrag" @dragover="previewColumnDrop($event,c)" @drop="dropColumn($event,c)" :aria-sort="effectiveSorts.find(s=>s.key===c.key)?.direction==='asc'?'ascending':effectiveSorts.find(s=>s.key===c.key)?.direction==='desc'?'descending':'none'" :style="{...pinnedStyle(c,true),textAlign:c.align||'left'}"><div class="hys-ui-pf-grid-head"><div class="hys-ui-pf-grid-sort-group">
 <HysButton variant="ghost" size="sm" type="button" class="hys-ui-pf-grid-sort" :class="{'hys-ui-is-sorted':effectiveSorts.some(item=>item.key===c.key)}" @click="toggleSort(c)"><span class="hys-ui-pf-grid-sort-label">{{c.label}}</span></HysButton>
 <span v-if="c.sortable!==false" class="hys-ui-pf-grid-sort-controls" role="group" :aria-label="c.label+'排序'">
  <HysButton type="button" variant="ghost" size="sm" class="hys-ui-pf-grid-sort-direction" :class="{'hys-ui-is-active':effectiveSorts.find(item=>item.key===c.key)?.direction==='asc'}" :aria-label="c.label+'升序'" :aria-pressed="effectiveSorts.find(item=>item.key===c.key)?.direction==='asc'" @click.stop="chooseSort(c,'asc')"><ChevronUp :size="11" aria-hidden="true"/></HysButton>
  <HysButton type="button" variant="ghost" size="sm" class="hys-ui-pf-grid-sort-direction" :class="{'hys-ui-is-active':effectiveSorts.find(item=>item.key===c.key)?.direction==='desc'}" :aria-label="c.label+'降序'" :aria-pressed="effectiveSorts.find(item=>item.key===c.key)?.direction==='desc'" @click.stop="chooseSort(c,'desc')"><ChevronDown :size="11" aria-hidden="true"/></HysButton>
 </span>
</div><HysButton variant="ghost" size="sm" v-if="c.filterable!==false" type="button" class="hys-ui-pf-grid-filter" :aria-label="'筛选'+c.label" :aria-expanded="filtersVisible" :aria-controls="filterRowId" :title="filtersVisible&&activeFilterColumn===c.key?'再次点击收起筛选（Esc）':'筛选'+c.label" :class="{'hys-ui-is-filtered':!!filters[c.key],'hys-ui-is-filtering':filtersVisible&&activeFilterColumn===c.key}" @click="showColumnFilters(c)"><Search :size="13" aria-hidden="true"/></HysButton><span v-if="c.resizable!==false" class="hys-ui-pf-grid-resize" role="separator" tabindex="0" :aria-label="'调整'+c.label+'列宽'" @pointerdown="startResize($event,c)" @keydown.left.prevent="widths={...widths,[c.key]:Math.max(c.minWidth||80,(widths[c.key]||c.width||160)-10)}" @keydown.right.prevent="widths={...widths,[c.key]:Math.min(c.maxWidth||800,(widths[c.key]||c.width||160)+10)}" /></div></th></tr>
<tr v-if="filtersVisible" class="hys-ui-pf-grid-filter-row" :id="filterRowId" @keydown.esc.stop.prevent="closeColumnFilters()" aria-label="列筛选">
 <td v-if="selectable" class="hys-ui-pf-grid-select-col"></td>
 <td v-for="column in orderedColumns" :key="column.key" :data-filter-key="column.key" :data-column-key="column.key" :style="pinnedStyle(column)">
  <HysInput v-if="column.filterable!==false" v-model="filters[column.key]" @focus="activeFilterColumn=column.key" :aria-label="'过滤'+column.label" placeholder="筛选…" clearable/>
 </td>
</tr></thead><tbody><tr v-if="loading"><td :colspan="visibleColumns.length+(selectable?1:0)" class="hys-ui-pf-grid-empty">正在加载…</td></tr><template v-else><template v-for="item in displayRows" :key="item.key"><tr v-if="item.kind==='group'" class="hys-ui-pf-grid-group-row"><td :colspan="visibleColumns.length+(selectable?1:0)"><HysButton variant="ghost" size="sm" type="button" :aria-expanded="!collapsedGroups.includes(item.key)" @click="toggleGroup(item.key)"><component :is="collapsedGroups.includes(item.key)?ChevronRight:ChevronDown" :size="15" aria-hidden="true"/> {{groupOptions.find(c=>c.key===groupBy)?.label}}：{{item.label}} <span>({{item.count}})</span></HysButton></td></tr><tr v-else-if="item.row" @click="emit('rowClick',item.row)"><td v-if="selectable" class="hys-ui-pf-grid-select-col"><HysCheckbox :aria-label="'选择第'+((item.index??0)+1)+'行'" :model-value="selected.includes(rowId(item.row,item.index??0))" @click.stop @update:model-value="selectRow(rowId(item.row!,item.index??0),$event)"/></td><td v-for="c in orderedColumns" :key="c.key" :data-column-key="c.key" :style="{...pinnedStyle(c),textAlign:c.align||'left'}" :title="cellValue(item.row,c.key)"><template v-if="editing?.id===rowId(item.row,item.index??0)&&editing?.key===c.key"><HysInput v-model="editValue" class="hys-ui-pf-grid-edit" :aria-label="'编辑'+c.label" @click.stop @keydown.enter.stop="commitEdit(item.row,c)" @keydown.esc.stop="editing=null" @focusout="commitEdit(item.row,c)"/></template><template v-else><HysButton variant="ghost" size="sm" v-if="treeMode&&c.key===orderedColumns[0]?.key&&item.row.__pfHasChildren" type="button" class="hys-ui-pf-grid-tree-toggle" :style="{marginLeft:Number(item.row.__pfDepth||0)*16+'px'}" :aria-expanded="expandedTree.includes(item.row[rowKey] as string|number)" @click.stop="toggleTree(item.row[rowKey] as string|number)"><component :is="expandedTree.includes(item.row[rowKey] as string|number)?ChevronDown:ChevronRight" :size="15" aria-hidden="true"/></HysButton><span v-else-if="treeMode&&c.key===orderedColumns[0]?.key" :style="{display:'inline-block',width:(Number(item.row.__pfDepth||0)*16+20)+'px'}"></span><span @dblclick.stop="beginEdit(item.row!,c)"><slot :name="c.key" :row="item.row" :value="item.row[c.key]">{{cellValue(item.row,c.key)}}</slot></span></template></td></tr></template><tr v-if="!pageRows.length"><td :colspan="visibleColumns.length+(selectable?1:0)" class="hys-ui-pf-grid-empty">{{emptyText}}</td></tr></template></tbody><tfoot v-if="showSummary&&!loading&&processed.length"><tr class="hys-ui-pf-grid-summary-row"><td v-if="selectable" class="hys-ui-pf-grid-select-col">合计</td><td v-for="(c,i) in orderedColumns" :key="c.key" :data-column-key="c.key" :style="{...pinnedStyle(c),textAlign:c.align||'left'}">{{c.summary?summaryValue(c):(!selectable&&i===0?'合计':'')}}</td></tr></tfoot></table></div>
  <footer class="hys-ui-pf-grid-footer"><HysPagination :page="page" :total="serverMode?(totalRows??rows.length):processed.length" :page-size="safePageSize" :show-size-changer="true" :show-quick-jumper="true" :disabled="loading" :page-size-options="[10,12,20,50,100]" @change="setPage" @page-size-change="onPageSizeChange" /></footer>
</section>
</template>
<style scoped>
.hys-ui-pf-grid-head :deep(.hys-ui-btn),.hys-ui-pf-grid-head :deep(.hys-ui-btn:hover),.hys-ui-pf-grid-head :deep(.hys-ui-btn:active){background:transparent!important;border-color:transparent!important;box-shadow:none!important;transform:none!important}
.hys-ui-pf-grid{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:12px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:var(--hys-ui-text,var(--hys-ui-theme-text,#25324b));min-width:0;font-size:13px}.hys-ui-pf-grid button,.hys-ui-pf-grid input{font:inherit}.hys-ui-pf-grid button{cursor:pointer}.hys-ui-pf-grid button:disabled{cursor:not-allowed;opacity:.4}.hys-ui-pf-grid-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee))}.hys-ui-pf-grid-toolbar button,.hys-ui-pf-grid-footer button,.hys-ui-pf-grid-panel button{border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:6px;padding:7px 10px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-search{display:flex;align-items:center;gap:8px}.hys-ui-pf-grid-search input,.hys-ui-pf-grid-count{margin-left:auto;color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b))}.hys-ui-pf-grid-menu{position:relative}.hys-ui-pf-grid-panel{position:absolute;z-index:30;right:0;top:calc(100% + 6px);background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit;box-shadow:0 10px 32px #0002;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:10px;padding:12px;min-width:245px;max-height:360px;overflow:auto}.hys-ui-pf-grid-setting{display:flex;align-items:center;gap:5px;padding:5px 0}.hys-ui-pf-grid-setting label{flex:1;display:flex;gap:7px;align-items:center}.hys-ui-pf-grid-setting button{padding:3px 7px}.hys-ui-pf-grid-scroll{overflow:auto;max-width:100%}.hys-ui-pf-grid table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;min-width:max-content}.hys-ui-pf-grid th,.hys-ui-pf-grid td{border-bottom:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));padding:11px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hys-ui-pf-grid th{position:relative;background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:600}.hys-ui-pf-grid-sticky-head thead th{position:sticky;top:0;z-index:4}.hys-ui-pf-grid-select-col{position:sticky!important;left:0;z-index:3;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff))}.hys-ui-pf-grid-sticky-head thead .hys-ui-pf-grid-select-col{z-index:6}.hys-ui-pf-grid tbody tr:hover{background:var(--hys-ui-surface-secondary,#f4f7fc)}.hys-ui-pf-grid-head{display:flex;align-items:center;position:relative;gap:3px}.hys-ui-pf-grid-sort,.hys-ui-pf-grid-filter{border:0;background:none;color:inherit;padding:4px;text-align:left}.hys-ui-pf-grid-sort{flex:1;overflow:hidden;text-overflow:ellipsis}.hys-ui-pf-grid-sort-hint{opacity:.4}.hys-ui-pf-grid-resize{position:absolute;right:-11px;top:-12px;bottom:-12px;width:10px;cursor:col-resize;touch-action:none;border-right:2px solid transparent}.hys-ui-pf-grid-resize:hover,.hys-ui-pf-grid-resize:focus{border-right-color:#3867f5;outline:none}.hys-ui-pf-grid-empty{text-align:center;color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b));padding:35px!important}.hys-ui-pf-grid-group-label{display:flex;align-items:center;gap:6px}.hys-ui-pf-grid-group-label select{padding:7px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-group-row td{background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:600;position:relative!important;left:auto!important}.hys-ui-pf-grid-group-row button{border:0;background:none;color:inherit;padding:3px;cursor:pointer}.hys-ui-pf-grid-group-row span{color:var(--hys-ui-muted,var(--hys-ui-theme-muted,#74829b));font-weight:400}.hys-ui-pf-grid-summary-row td{background:var(--hys-ui-surface-secondary,#f4f7fc);font-weight:700;border-top:2px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee))}.hys-ui-pf-grid-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px}.hys-ui-pf-grid-footer>div{display:flex;gap:6px}.hys-ui-pf-grid--compact td,.hys-ui-pf-grid--compact th{padding-top:6px;padding-bottom:6px}.hys-ui-pf-grid--comfortable td,.hys-ui-pf-grid--comfortable th{padding-top:17px;padding-bottom:17px}@media(max-width:600px){.hys-ui-pf-grid-count{margin-left:0}.hys-ui-pf-grid-footer{align-items:flex-start}}
.hys-ui-pf-grid-batch{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.hys-ui-pf-grid-batch input,.hys-ui-pf-grid-batch select,.hys-ui-pf-grid-edit{max-width:160px;min-width:65px;border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border,#dce3ee));border-radius:5px;padding:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));color:inherit}.hys-ui-pf-grid-tree-toggle{border:0;background:none;color:inherit;cursor:pointer;width:20px}.hys-ui-pf-grid-edit:focus{outline:2px solid #3867f5}.hys-ui-pf-grid-group-label :deep(.hys-ui-select-wrap){min-width:140px}
.hys-ui-pf-grid-search :deep(.hys-ui-input-wrap){width:220px}
.hys-ui-pf-grid-setting>label{min-width:0;justify-content:flex-start}
.hys-ui-pf-grid-select-col :deep(.hys-ui-check-label){justify-content:center}.hys-ui-pf-grid-setting :deep(.hys-ui-check-label){justify-content:flex-start;text-align:left}


.hys-ui-pf-grid-sort{min-width:0;justify-content:flex-start}
.hys-ui-pf-grid-sort :deep(span){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hys-ui-pf-grid-footer :deep(.hys-ui-pf-pagination){width:100%}



.hys-ui-pf-grid-filter.hys-ui-is-filtered{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-pf-grid-panel{min-width:310px}
.hys-ui-pf-grid-settings-list{margin:12px 0}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-v4-sort-row){padding:7px 8px;gap:6px;margin-bottom:6px}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-pf-sort-label){flex:1;text-align:left;overflow:visible}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-check-label){justify-content:flex-start;gap:8px;font-weight:400}
.hys-ui-pf-grid-settings-list :deep(.hys-ui-v4-sort-actions button){padding:4px;min-width:26px;min-height:26px}
.hys-ui-pf-grid-sort{gap:6px}
.hys-ui-pf-grid-sort-icon{flex-shrink:0;color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-pf-grid-sort-icon.hys-ui-is-idle{color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.55}
.hys-ui-pf-grid-sort:hover .hys-ui-pf-grid-sort-icon.hys-ui-is-idle{opacity:1}
.hys-ui-pf-grid-sort.hys-ui-is-sorted .hys-ui-pf-grid-sort-label{color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-pf-grid-sort:hover,.hys-ui-pf-grid-filter:hover{background:transparent}
.hys-ui-pf-grid-filter.hys-ui-is-filtered:hover{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-pf-grid-head .hys-ui-btn{transition-property:color,opacity,border-color}
.hys-ui-pf-grid-head .hys-ui-btn:hover,.hys-ui-pf-grid-head .hys-ui-btn:active{transform:none}
/* Keep both header rows together while scrolling. */
.hys-ui-pf-grid-sticky-head thead{position:sticky;top:0;z-index:4}
.hys-ui-pf-grid-sticky-head thead th{position:relative;top:auto}
.hys-ui-pf-grid-filter-row td{padding:8px;background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input-wrap){min-width:0;width:100%}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input){min-height:32px;padding:6px 26px 6px 8px;font-size:12px;font-weight:400}
.hys-ui-pf-grid-filter-row :deep(.hys-ui-input-clear){right:2px;top:4px;width:22px;height:24px}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter{flex-shrink:0;min-width:24px;min-height:28px;padding:4px;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.5}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter:hover,.hys-ui-pf-grid-head .hys-ui-pf-grid-filter:focus-visible{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1}
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter.hys-ui-is-filtered{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1}
/* The marker is contained inside the header, so it adds no layout shift. */
.hys-ui-pf-grid th.hys-ui-is-column-dragging{opacity:.45}
.hys-ui-pf-grid th[data-drop-position]::after{content:'';position:absolute;top:4px;bottom:4px;width:3px;border-radius:3px;background:var(--hys-ui-primary,var(--hys-ui-theme-primary));z-index:8;pointer-events:none}
.hys-ui-pf-grid th[data-drop-position="before"]::after{left:0}
.hys-ui-pf-grid th[data-drop-position="after"]::after{right:0}
.hys-ui-pf-grid-sort-group{display:flex;align-items:center;flex:1;min-width:0;gap:2px}
.hys-ui-pf-grid-sort-group .hys-ui-pf-grid-sort{flex:0 1 auto}
.hys-ui-pf-grid-sort-controls{display:inline-grid;grid-template-rows:repeat(2,9px);flex-shrink:0}
.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction{display:grid;place-items:center;width:20px;min-width:20px;height:9px;min-height:9px;padding:0;border:0;border-radius:2px;background:transparent;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));opacity:.55}
.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction:hover,.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction:focus-visible,.hys-ui-pf-grid-head .hys-ui-pf-grid-sort-direction.hys-ui-is-active{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:transparent;opacity:1}
/* Opaque cell surfaces are determined by the row section, including sticky cells. */
.hys-ui-pf-grid {
 --hys-ui-grid-header-background:var(--hys-ui-surface-secondary,var(--hys-ui-theme-bg,#f4f7fc));
 --hys-ui-grid-row-background:var(--hys-ui-surface,var(--hys-ui-theme-surface,#fff));
 --hys-ui-grid-hover-background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt,#f8faff));
}
.hys-ui-pf-grid thead th { background:var(--hys-ui-grid-header-background); }
.hys-ui-pf-grid tbody td { background:var(--hys-ui-grid-row-background); }
.hys-ui-pf-grid tbody tr:hover { --hys-ui-grid-row-background:var(--hys-ui-grid-hover-background); background:var(--hys-ui-grid-hover-background); }
.hys-ui-pf-grid tbody .hys-ui-pf-grid-group-row td,
.hys-ui-pf-grid tfoot td { background:var(--hys-ui-grid-header-background); }
.hys-ui-pf-grid thead .hys-ui-pf-grid-filter-row td { background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt,#f8faff)); }
.hys-ui-pf-grid-toolbar :deep(.hys-ui-input-shell),
.hys-ui-pf-grid-toolbar :deep(.hys-ui-select),
.hys-ui-pf-grid-toolbar > .hys-ui-btn,
.hys-ui-pf-grid-toolbar .hys-ui-pf-grid-menu > .hys-ui-btn,
.hys-ui-pf-grid-toolbar .hys-ui-pf-grid-batch > .hys-ui-btn { height:32px;min-height:32px; }
.hys-ui-pf-grid-toolbar :deep(.hys-ui-input-shell .hys-ui-input) { height:30px;min-height:0;padding-block:4px; }
.hys-ui-pf-grid-head .hys-ui-pf-grid-filter.hys-ui-is-filtering { color:var(--hys-ui-primary,var(--hys-ui-theme-primary));opacity:1; }
</style>
