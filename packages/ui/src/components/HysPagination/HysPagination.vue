<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight} from 'lucide-vue-next';

import { computed, ref, watch } from 'vue'
import HysSelect from '../HysSelect/HysSelect.vue'
import HysNumberInput from '../HysNumberInput/HysNumberInput.vue'
import HysButton from '../HysButton/HysButton.vue'
const props = withDefaults(defineProps<{
  page: number; total: number; pageSize?: number; pageSizeOptions?: number[];
  siblingCount?: number; showSizeChanger?: boolean; showQuickJumper?: boolean;
  showTotal?: boolean; disabled?: boolean; loading?: boolean; compact?: boolean;
  labels?: Partial<{ total: string; perPage: string; jump: string; page: string; first: string; previous: string; next: string; last: string }>
}>(), { pageSize: 10, siblingCount: 1, showSizeChanger: false, showQuickJumper: false, showTotal: true, disabled: false, loading: false, compact: false })
const emit = defineEmits<{ change: [page: number]; 'update:page': [page: number]; pageSizeChange: [size: number]; 'update:pageSize': [size: number] }>()
const size = computed(() => Number.isFinite(props.pageSize) && props.pageSize > 0 ? Math.floor(props.pageSize) : 10)
const total = computed(() => Number.isFinite(props.total) ? Math.max(0, Math.floor(props.total)) : 0)
const pages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const current = computed(() => Math.min(pages.value, Math.max(1, Number.isFinite(props.page) ? Math.floor(props.page) : 1)))
const busy = computed(() => props.disabled || props.loading)
const rangeStart = computed(() => total.value === 0 ? 0 : (current.value - 1) * size.value + 1)
const rangeEnd = computed(() => Math.min(total.value, current.value * size.value))
const t = computed(() => ({ total: '共 {total} 条（{start}–{end}）', perPage: '每页条数', jump: '跳转到', page: '页', first: '首页', previous: '上一页', next: '下一页', last: '末页', ...props.labels }))
const totalLabel = computed(() => t.value.total.replace('{total}', String(total.value)).replace('{start}', String(rangeStart.value)).replace('{end}', String(rangeEnd.value)))
const options = computed(() => [...new Set([...(props.pageSizeOptions ?? [10, 20, 50, 100]), size.value].filter(n => Number.isInteger(n) && n > 0))].sort((a,b) => a-b))
type Item = number | 'left-gap' | 'right-gap'
const items = computed<Item[]>(() => {
  const last = pages.value
  const siblings = Math.max(0, Math.min(5, Math.floor(props.siblingCount)))
  const visible = new Set<number>([1, last])
  for (let n = Math.max(1, current.value-siblings); n <= Math.min(last, current.value+siblings); n++) visible.add(n)
  if (current.value <= siblings+3) for (let n=1;n<=Math.min(last,2*siblings+3);n++) visible.add(n)
  if (current.value >= last-siblings-2) for (let n=Math.max(1,last-(2*siblings+2));n<=last;n++) visible.add(n)
  const nums = [...visible].sort((a,b)=>a-b)
  const result:Item[] = []
  nums.forEach((n,i) => {if(i && n-nums[i-1]>1){if(n-nums[i-1]===2) result.push(n-1);else result.push(i===1?'left-gap':'right-gap')}result.push(n)})
  return result
})
const jump = ref(current.value)
const validJump = computed(() => Number.isInteger(jump.value) && jump.value>0 && jump.value!==current.value)
watch(current, () => {jump.value=current.value})
function changePage(n:number) {if(busy.value || !Number.isFinite(n)) return;const next=Math.min(pages.value,Math.max(1,Math.floor(n)));if(next!==current.value){emit('update:page',next);emit('change',next)}}
function changeSize(value:string) {if(busy.value)return;const next=Number(value);if(!Number.isInteger(next)||next<1||next===size.value)return;emit('update:pageSize',next);emit('pageSizeChange',next);const max=Math.max(1,Math.ceil(total.value/next));if(current.value>max)changePage(max)}
function submitJump() {const n=Number(jump.value);if(validJump.value && Number.isInteger(n))changePage(n);jump.value=current.value}

</script>
<template>
  <nav v-bind="hysRootAttrs" class="hys-ui-pf-pagination" :class="{'hys-ui-pf-pagination-compact':compact}" aria-label="分页导航" :aria-busy="loading">
    <span v-if="showTotal" class="hys-ui-pf-pagination-total" aria-live="polite">{{totalLabel}}</span>
    <div class="hys-ui-pf-pagination-actions">
    <div class="hys-ui-pf-pagination-controls">
      <HysButton variant="secondary" size="sm" type="button" :disabled="busy||current===1" :aria-label="t.first" :title="t.first" @click="changePage(1)"><ChevronsLeft :size="16" aria-hidden="true"/></HysButton>
      <HysButton variant="secondary" size="sm" type="button" :disabled="busy||current===1" :aria-label="t.previous" :title="t.previous" @click="changePage(current-1)"><ChevronLeft :size="16" aria-hidden="true"/></HysButton>
      <template v-if="!compact"><template v-for="item in items" :key="item">
        <HysButton variant="secondary" size="sm" v-if="typeof item==='number'" class="hys-ui-pf-pagination-page" type="button" :disabled="busy" :aria-label="'第 '+item+' 页'" :aria-current="item===current?'page':undefined" :class="{'hys-ui-is-current':item===current}" @click="changePage(item)">{{item}}</HysButton>
        <span v-else class="hys-ui-pf-pagination-gap" aria-hidden="true">…</span>
      </template></template>
      <span v-else class="hys-ui-pf-pagination-indicator">{{current}} / {{pages}}</span>
      <span v-if="!compact" class="hys-ui-pf-pagination-mobile-indicator">{{current}} / {{pages}}</span>
      <HysButton variant="secondary" size="sm" type="button" :disabled="busy||current===pages" :aria-label="t.next" :title="t.next" @click="changePage(current+1)"><ChevronRight :size="16" aria-hidden="true"/></HysButton>
      <HysButton variant="secondary" size="sm" type="button" :disabled="busy||current===pages" :aria-label="t.last" :title="t.last" @click="changePage(pages)"><ChevronsRight :size="16" aria-hidden="true"/></HysButton>
    </div>
    <label v-if="showSizeChanger" class="hys-ui-pf-pagination-size">{{t.perPage}} <HysSelect :model-value="String(size)" :options="options.map(n=>({label:String(n),value:String(n)}))" :disabled="busy" :aria-label="t.perPage" @update:model-value="changeSize"/></label>
    <form v-if="showQuickJumper&&!compact" class="hys-ui-pf-pagination-jump" @submit.prevent="submitJump"><span>{{t.jump}}</span><HysNumberInput v-model="jump" class="hys-ui-pf-pagination-jump-input" :min="1" :max="pages" :show-controls="false" select-on-focus :disabled="busy" :aria-label="t.jump"/><HysButton variant="secondary" size="sm" type="submit" :disabled="busy||!validJump">确定</HysButton></form>
    </div>
  </nav>
</template>
<style scoped>
.hys-ui-pf-pagination {
  container: pagination / inline-size;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px 24px;
  width: 100%;
  padding: 8px 0;
  color: var(--hys-ui-text,var(--hys-ui-theme-text, #25324b));
  font-size: 12px;
}
.hys-ui-pf-pagination-total { flex-shrink: 0; color: var(--hys-ui-muted,var(--hys-ui-theme-muted, #74829b)); white-space: nowrap; }
.hys-ui-pf-pagination-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 12px 18px; margin-left: auto; max-width: 100%; }
.hys-ui-pf-pagination-controls { display: flex; align-items: center; gap: 4px; }
.hys-ui-pf-pagination-controls > button {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border: 1px solid var(--hys-ui-border,var(--hys-ui-theme-border, #dce3ee));
  border-radius: 7px;
  background: var(--hys-ui-surface,var(--hys-ui-theme-surface, #fff));
  color: inherit;
  font-size: 12px;
  font-weight: 500;
}
.hys-ui-pf-pagination-controls > button:hover:not(:disabled) { border-color: var(--hys-ui-primary,var(--hys-ui-theme-primary)); background: var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft)); transform: none; }
.hys-ui-pf-pagination-controls > button:active { transform: none; }
.hys-ui-pf-pagination-controls > button:focus-visible { outline: 2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary)); outline-offset: 2px; }
.hys-ui-pf-pagination-controls > button:disabled { opacity: .35; cursor: not-allowed; }
.hys-ui-pf-pagination-controls > button.hys-ui-is-current { background: var(--hys-ui-primary,var(--hys-ui-theme-primary)); border-color: var(--hys-ui-primary,var(--hys-ui-theme-primary)); color: white; font-weight: 600; }
.hys-ui-pf-pagination-gap { display: grid; place-items: center; width: 20px; height: 32px; color: var(--hys-ui-muted,var(--hys-ui-theme-muted)); }
.hys-ui-pf-pagination-size, .hys-ui-pf-pagination-jump { display: flex; align-items: center; gap: 8px; margin: 0; white-space: nowrap; color: var(--hys-ui-muted,var(--hys-ui-theme-muted)); }
.hys-ui-pf-pagination-size :deep(.hys-ui-select-wrap) { width: 76px; min-width: 76px; }
.hys-ui-pf-pagination-size :deep(.hys-ui-select) { height: 32px; min-height: 32px; padding: 5px 9px; gap: 8px; font-size: 12px; }
.hys-ui-pf-pagination-jump-input { width: 60px; flex-shrink: 0; height: 32px; min-height: 32px; }
.hys-ui-pf-pagination-jump-input :deep(input) { height: 30px; min-height: 0; padding: 5px 6px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; }
.hys-ui-pf-pagination-jump > button { min-height: 32px; height: 32px; padding: 5px 10px; font-size: 12px; font-weight: 500; }
.hys-ui-pf-pagination-indicator, .hys-ui-pf-pagination-mobile-indicator { padding: 0 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.hys-ui-pf-pagination-mobile-indicator { display: none; }
@container pagination (max-width: 760px) {
  .hys-ui-pf-pagination-actions { width: 100%; justify-content: flex-end; }
}
@container pagination (max-width: 620px) {
  .hys-ui-pf-pagination-actions { display: grid; grid-template-columns: auto auto; justify-content: center; gap: 14px 18px; }
  .hys-ui-pf-pagination-controls { grid-column: 1 / -1; justify-content: center; }
  .hys-ui-pf-pagination-page, .hys-ui-pf-pagination-gap { display: none !important; }
  .hys-ui-pf-pagination-mobile-indicator { display: inline; }
}
@container pagination (max-width: 350px) {
  .hys-ui-pf-pagination-actions { grid-template-columns: 1fr; justify-items: center; }
  .hys-ui-pf-pagination-size, .hys-ui-pf-pagination-jump { justify-content: center; }
}
</style>
