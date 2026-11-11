<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useHysRootAttrs } from '../../config'
import HysButton from '../HysButton/HysButton.vue'
import HysNumberInput from '../HysNumberInput/HysNumberInput.vue'
import HysSelect from '../HysSelect/HysSelect.vue'

const hysRootAttrs = useHysRootAttrs()
const props = withDefaults(defineProps<{
  /** 受控页码，使用 v-model:page。省略时由分页器维护。 */
  page?: number
  /** 总记录数，用于计算页数和当前记录范围。 */
  total?: number
  /** 显式总页数；与 total 同时提供时优先用于分页。 */
  pageCount?: number
  /** 受控每页条数，使用 v-model:page-size。省略时由分页器维护。 */
  pageSize?: number
  /** 非受控的初始页码，从 1 开始。 */
  defaultPage?: number
  /** 非受控的初始每页条数。 */
  defaultPageSize?: number
  /** 每页条数选项。当前条数会保留在列表中。 */
  pageSizeOptions?: number[]
  /** 当前页左右各保留的页码数量，取值 0–5。 */
  siblingCount?: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  /** 默认布局是否显示记录总数；需要 total 或 total 插槽。 */
  showTotal?: boolean
  /** 总页数小于等于一页时隐藏分页器。 */
  hideOnSinglePage?: boolean
  disabled?: boolean
  loading?: boolean
  /** 以当前页 / 总页数代替页码，并隐藏跳转。 */
  compact?: boolean
  /** 在窄容器中以当前页 / 总页数代替页码。 */
  responsive?: boolean
  /** 分页控件尺寸，sm、md、lg 分别为 28、32、40px。 */
  size?: 'sm' | 'md' | 'lg'
  /** 逗号分隔的控件顺序，支持 total、first、prev、pager、next、last、sizes、jumper。使用 -> 将后续控件靠右排列。 */
  layout?: string
  /** 覆盖分页区域、按钮、字段标签和总数格式。 */
  labels?: Partial<{
    total: string
    perPage: string
    jump: string
    page: string
    pageItem: string
    navigation: string
    confirm: string
    first: string
    previous: string
    next: string
    last: string
  }>
}>(), {
  defaultPage: 1,
  defaultPageSize: 10,
  siblingCount: 1,
  showSizeChanger: false,
  showQuickJumper: false,
  showTotal: true,
  hideOnSinglePage: false,
  disabled: false,
  loading: false,
  compact: false,
  responsive: true,
  size: 'md',
})
const emit = defineEmits<{
  /** 用户请求切换页码或已生效的分页范围收窄时触发。 */
  change: [page: number]
  'update:page': [page: number]
  /** 用户选择每页条数时触发，受控值由宿主应用更新。 */
  pageSizeChange: [size: number]
  'update:pageSize': [size: number]
}>()

type NavigationItem = 'first' | 'prev' | 'next' | 'last'
type Control = NavigationItem | 'pager'
type LayoutItem = Control | 'total' | 'sizes' | 'jumper'
type LayoutGroup = { kind: 'controls'; controls: Control[] } | { kind: 'total' | 'sizes' | 'jumper' }
const slots = defineSlots<{
  total?: (props: { total: number | undefined; start: number; end: number; pageCount: number }) => unknown
  item?: (props: { type: NavigationItem | 'page'; page: number; active: boolean; disabled: boolean }) => unknown
  'jump-button'?: () => unknown
}>()

function positiveInteger(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(value)))
    : fallback
}

const localSize = ref(positiveInteger(props.defaultPageSize, 10))
const pageSize = computed(() => positiveInteger(props.pageSize, localSize.value))
const total = computed(() => props.total === undefined
  ? undefined
  : Number.isFinite(props.total) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(props.total))) : 0)
const pages = computed(() => props.pageCount === undefined
  ? Math.max(1, Math.ceil((total.value ?? 0) / pageSize.value))
  : positiveInteger(props.pageCount, 1))
const localPage = ref(Math.min(positiveInteger(props.defaultPage, 1), pages.value))
const requestedPage = computed(() => positiveInteger(props.page, localPage.value))
const current = computed(() => Math.min(requestedPage.value, pages.value))
const busy = computed(() => props.disabled || props.loading)

const offset = computed(() => (current.value - 1) * pageSize.value)
const rangeStart = computed(() => offset.value < (total.value ?? 0) ? offset.value + 1 : 0)
const rangeEnd = computed(() => rangeStart.value ? Math.min(total.value ?? 0, current.value * pageSize.value) : 0)
const t = computed(() => ({
  total: '共 {total} 条（{start}–{end}）',
  perPage: '每页条数',
  jump: '跳转到',
  page: '页',
  pageItem: '第 {page} ' + (props.labels?.page ?? '页'),
  navigation: '分页导航',
  confirm: '确定',
  first: '首页',
  previous: '上一页',
  next: '下一页',
  last: '末页',
  ...props.labels,
}))
const totalLabel = computed(() => t.value.total
  .replace('{total}', String(total.value ?? 0))
  .replace('{start}', String(rangeStart.value))
  .replace('{end}', String(rangeEnd.value)))
const options = computed(() => [...new Set([
  ...(props.pageSizeOptions ?? [10, 20, 50, 100]), pageSize.value,
].filter(n => Number.isSafeInteger(n) && n > 0))]
  .sort((a, b) => a - b)
  .map(n => ({ label: String(n), value: String(n) })))

const navigation = computed(() => ({
  first: { page: 1, label: t.value.first, icon: ChevronsLeft },
  prev: { page: current.value - 1, label: t.value.previous, icon: ChevronLeft },
  next: { page: current.value + 1, label: t.value.next, icon: ChevronRight },
  last: { page: pages.value, label: t.value.last, icon: ChevronsRight },
}))
function navigationDisabled(control: NavigationItem) {
  return busy.value || (control === 'first' || control === 'prev'
    ? current.value === 1
    : current.value === pages.value)
}
function isControl(item: string): item is Control {
  return item === 'first' || item === 'prev' || item === 'pager' || item === 'next' || item === 'last'
}

const sections = computed(() => {
  const defaultLayout = [
    props.showTotal ? 'total' : '', '->', 'first', 'prev', 'pager', 'next', 'last',
    props.showSizeChanger ? 'sizes' : '',
    props.showQuickJumper ? 'jumper' : '',
  ].join(',')
  const result: { side: 'leading' | 'trailing'; groups: LayoutGroup[] }[] = [
    { side: 'leading', groups: [] }, { side: 'trailing', groups: [] },
  ]
  const seen = new Set<LayoutItem>()
  let groups = result[0].groups
  for (const token of (props.layout ?? defaultLayout).split(',')) {
    const item = token.trim()
    if (item === '->') {
      groups = result[1].groups
      continue
    }
    if (!isControl(item) && item !== 'total' && item !== 'sizes' && item !== 'jumper') continue
    if (seen.has(item) || (item === 'jumper' && props.compact)) continue
    if (item === 'total' && total.value === undefined && !slots.total) continue
    seen.add(item)
    if (isControl(item)) {
      const last = groups.at(-1)
      if (last?.kind === 'controls') last.controls.push(item)
      else groups.push({ kind: 'controls', controls: [item] })
    } else {
      groups.push({ kind: item })
    }
  }
  return result.filter(section => section.groups.length)
})

type PageItem = number | 'left-gap' | 'right-gap'
const items = computed<PageItem[]>(() => {
  const last = pages.value
  const siblings = Number.isFinite(props.siblingCount)
    ? Math.max(0, Math.min(5, Math.floor(props.siblingCount)))
    : 1
  const visible = new Set<number>([1, last])
  for (let n = Math.max(1, current.value - siblings); n <= Math.min(last, current.value + siblings); n++) visible.add(n)
  if (current.value <= siblings + 3) {
    for (let n = 1; n <= Math.min(last, 2 * siblings + 3); n++) visible.add(n)
  }
  if (current.value >= last - siblings - 2) {
    for (let n = Math.max(1, last - (2 * siblings + 2)); n <= last; n++) visible.add(n)
  }
  const nums = [...visible].sort((a, b) => a - b)
  const result: PageItem[] = []
  for (const [i, n] of nums.entries()) {
    const gap = i ? n - nums[i - 1] : 0
    if (gap === 2) result.push(n - 1)
    if (gap > 2) result.push(i === 1 ? 'left-gap' : 'right-gap')
    result.push(n)
  }
  return result
})

const jump = ref(current.value)
const jumpDraft = ref<number | null>(current.value)
const validJump = computed(() => jumpDraft.value !== null
  && Number.isInteger(jumpDraft.value) && jumpDraft.value > 0
  && Math.min(pages.value, jumpDraft.value) !== current.value)
function resetJump() {
  jump.value = current.value
  jumpDraft.value = current.value
}
watch(current, resetJump)
watch(jump, value => jumpDraft.value = value)

function requestPage(next: number) {
  if (props.page === undefined) localPage.value = next
  emit('update:page', next)
  emit('change', next)
}
function changePage(value: number) {
  if (busy.value || !Number.isFinite(value)) return
  const next = Math.min(pages.value, positiveInteger(value, 1))
  if (next !== current.value) requestPage(next)
}
function changeSize(value: string) {
  if (busy.value) return
  const next = Number(value)
  if (!Number.isSafeInteger(next) || next < 1 || next === pageSize.value) return
  if (props.pageSize === undefined) localSize.value = next
  emit('update:pageSize', next)
  emit('pageSizeChange', next)
}
// Clamp against the applied page count after the host has handled both model updates.
watch(pages, (next, previous) => {
  if (next < previous && requestedPage.value > next) requestPage(next)
})
function submitJump() {
  if (validJump.value && jumpDraft.value !== null) changePage(jumpDraft.value)
  resetJump()
}
</script>

<template>
  <nav
    v-if="sections.length && (!hideOnSinglePage || pages > 1)"
    v-bind="hysRootAttrs"
    class="hys-ui-pf-pagination"
    :class="{
      'hys-ui-pf-pagination-compact': compact,
      'hys-ui-pf-pagination-responsive': responsive,
    }"
    :data-size="size"
    :aria-label="t.navigation"
    :aria-busy="loading"
  >
    <div
      v-for="section in sections"
      :key="section.side"
      :class="section.side === 'trailing' ? 'hys-ui-pf-pagination-actions' : 'hys-ui-pf-pagination-leading'"
    >
      <template v-for="(group, index) in section.groups" :key="index">
        <span
          v-if="group.kind === 'total'"
          class="hys-ui-pf-pagination-total"
          aria-live="polite"
        >
          <slot name="total" :total="total" :start="rangeStart" :end="rangeEnd" :page-count="pages">{{ totalLabel }}</slot>
        </span>
        <div v-else-if="group.kind === 'controls'" class="hys-ui-pf-pagination-controls">
          <template v-for="control in group.controls" :key="control">
            <template v-if="control === 'pager'">
              <template v-if="!compact">
                <template v-for="item in items" :key="item">
                  <HysButton
                    v-if="typeof item === 'number'"
                    variant="secondary"
                    size="sm"
                    class="hys-ui-pf-pagination-page"
                    :class="{ 'hys-ui-is-current': item === current, 'hys-ui-pf-pagination-custom-item': $slots.item }"
                    :disabled="busy"
                    :aria-label="t.pageItem.replace('{page}', String(item))"
                    :aria-current="item === current ? 'page' : undefined"
                    @click="changePage(item)"
                  >
                    <slot name="item" type="page" :page="item" :active="item === current" :disabled="busy">{{ item }}</slot>
                  </HysButton>
                  <span v-else class="hys-ui-pf-pagination-gap" aria-hidden="true">…</span>
                </template>
              </template>
              <span
                :class="compact ? 'hys-ui-pf-pagination-indicator' : 'hys-ui-pf-pagination-mobile-indicator'"
                aria-live="polite"
              >{{ current }} / {{ pages }}</span>
            </template>
            <HysButton
              v-else
              variant="secondary"
              size="sm"
              :class="{ 'hys-ui-pf-pagination-custom-item': $slots.item }"
              :disabled="navigationDisabled(control)"
              :aria-label="navigation[control].label"
              :title="navigation[control].label"
              @click="changePage(navigation[control].page)"
            >
              <slot
                name="item"
                :type="control"
                :page="Math.max(1, Math.min(pages, navigation[control].page))"
                :active="false"
                :disabled="navigationDisabled(control)"
              >
                <component :is="navigation[control].icon" :size="16" aria-hidden="true" />
              </slot>
            </HysButton>
          </template>
        </div>
        <label v-else-if="group.kind === 'sizes'" class="hys-ui-pf-pagination-size">
          {{ t.perPage }}
          <HysSelect
            :size="size === 'lg' ? 'md' : 'sm'"
            :model-value="String(pageSize)"
            :options="options"
            :disabled="busy"
            :aria-label="t.perPage"
            @update:model-value="changeSize"
          />
        </label>
        <form v-else-if="group.kind === 'jumper'" class="hys-ui-pf-pagination-jump" @submit.prevent.stop="submitJump">
          <span>{{ t.jump }}</span>
          <HysNumberInput
            v-model="jump"
            size="sm"
            class="hys-ui-pf-pagination-jump-input"
            :min="1"
            :max="pages"
            :show-controls="false"
            select-on-focus
            :disabled="busy"
            :aria-label="t.jump"
            @input="jumpDraft = $event"
          />
          <HysButton variant="secondary" size="sm" type="submit" :disabled="busy || !validJump">
            <slot name="jump-button">{{ t.confirm }}</slot>
          </HysButton>
        </form>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.hys-ui-pf-pagination {
  container: pagination / inline-size;
  --hys-ui-pagination-control-height: 32px;
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
.hys-ui-pf-pagination[data-size="sm"] { --hys-ui-pagination-control-height: 28px; }
.hys-ui-pf-pagination[data-size="lg"] { --hys-ui-pagination-control-height: 40px; }
.hys-ui-pf-pagination-total { flex-shrink: 0; color: var(--hys-ui-muted,var(--hys-ui-theme-muted, #74829b)); white-space: nowrap; }
.hys-ui-pf-pagination-leading, .hys-ui-pf-pagination-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 18px; max-width: 100%; }
.hys-ui-pf-pagination-actions { justify-content: flex-end; margin-left: auto; }
.hys-ui-pf-pagination-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; min-width: 0; max-width: 100%; }
.hys-ui-pf-pagination-controls > button {
  flex-shrink: 0;
  width: auto;
  height: var(--hys-ui-pagination-control-height);
  min-width: var(--hys-ui-pagination-control-height);
  min-height: var(--hys-ui-pagination-control-height);
  padding: 0 4px;
  border: 1px solid var(--hys-ui-border,var(--hys-ui-theme-border, #dce3ee));
  border-radius: 7px;
  background: var(--hys-ui-surface,var(--hys-ui-theme-surface, #fff));
  color: inherit;
  font-size: 12px;
  font-weight: 500;
}
.hys-ui-pf-pagination-controls > button.hys-ui-pf-pagination-custom-item { padding-inline: 8px; }
.hys-ui-pf-pagination-controls > button:hover:not(:disabled) { border-color: var(--hys-ui-primary,var(--hys-ui-theme-primary)); background: var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft)); transform: none; }
.hys-ui-pf-pagination-controls > button:active { transform: none; }
.hys-ui-pf-pagination-controls > button:focus-visible { outline: 2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary)); outline-offset: 2px; }
.hys-ui-pf-pagination-controls > button:disabled { opacity: .35; cursor: not-allowed; }
.hys-ui-pf-pagination-controls > button.hys-ui-is-current { background: var(--hys-ui-primary,var(--hys-ui-theme-primary)); border-color: var(--hys-ui-primary,var(--hys-ui-theme-primary)); color: white; font-weight: 600; }
.hys-ui-pf-pagination-gap { display: grid; place-items: center; width: 20px; height: var(--hys-ui-pagination-control-height); color: var(--hys-ui-muted,var(--hys-ui-theme-muted)); }
.hys-ui-pf-pagination-size, .hys-ui-pf-pagination-jump { display: flex; align-items: center; gap: 8px; margin: 0; white-space: nowrap; color: var(--hys-ui-muted,var(--hys-ui-theme-muted)); }
.hys-ui-pf-pagination-size :deep(.hys-ui-select-wrap) { width: 76px; min-width: 76px; }
.hys-ui-pf-pagination-size :deep(.hys-ui-select) { height: var(--hys-ui-pagination-control-height); min-height: var(--hys-ui-pagination-control-height); padding: 5px 9px; gap: 8px; font-size: 12px; }
.hys-ui-pf-pagination-jump-input { width: 60px; flex-shrink: 0; height: var(--hys-ui-pagination-control-height); min-height: var(--hys-ui-pagination-control-height); }
.hys-ui-pf-pagination-jump-input :deep(.hys-ui-number-group),
.hys-ui-pf-pagination-jump-input :deep(.hys-ui-ex-number) { height: var(--hys-ui-pagination-control-height); min-height: var(--hys-ui-pagination-control-height); }
.hys-ui-pf-pagination-jump-input :deep(.hys-ui-number-main) { min-height: 0; }
.hys-ui-pf-pagination-jump-input :deep(input) { height: calc(var(--hys-ui-pagination-control-height) - 2px); min-height: 0; padding: 5px 6px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; }
.hys-ui-pf-pagination-jump > button { min-height: var(--hys-ui-pagination-control-height); height: var(--hys-ui-pagination-control-height); padding: 5px 10px; font-size: 12px; font-weight: 500; }
.hys-ui-pf-pagination-indicator, .hys-ui-pf-pagination-mobile-indicator { padding: 0 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.hys-ui-pf-pagination-mobile-indicator { display: none; }
@container pagination (max-width: 760px) {
  .hys-ui-pf-pagination-actions { width: 100%; justify-content: flex-end; }
}
@container pagination (max-width: 620px) {
  .hys-ui-pf-pagination-actions { display: grid; grid-template-columns: auto auto; justify-content: center; gap: 14px 18px; }
  .hys-ui-pf-pagination-controls { grid-column: 1 / -1; justify-content: center; }
  .hys-ui-pf-pagination-responsive :is(.hys-ui-pf-pagination-page, .hys-ui-pf-pagination-gap) { display: none !important; }
  .hys-ui-pf-pagination-responsive .hys-ui-pf-pagination-mobile-indicator { display: inline; }
}
@container pagination (max-width: 350px) {
  .hys-ui-pf-pagination-actions { grid-template-columns: 1fr; justify-items: center; }
  .hys-ui-pf-pagination-size, .hys-ui-pf-pagination-jump { justify-content: center; }
}
</style>
