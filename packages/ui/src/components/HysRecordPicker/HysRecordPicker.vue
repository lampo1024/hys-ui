<script setup lang="ts" generic="T extends object">
import { computed, ref, shallowRef, watch, type VNodeChild } from "vue";
import { useChoiceModel } from "../../composables/choiceModel";
import { isGridKey } from "../../composables/gridCore";
import {
  tableValue,
  type HysTableColumn,
  type HysTableKey,
} from "../../composables/table";
import HysButton from "../HysButton/HysButton.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysDataView from "../HysDataView/HysDataView.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import HysBadge from "../HysBadge/HysBadge.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysDrawer from "../HysDrawer/HysDrawer.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysPagination from "../HysPagination/HysPagination.vue";
import HysSearch from "../HysSearch/HysSearch.vue";
import HysTable from "../HysTable/HysTable.vue";

export interface HysRecordPickerProps<T extends object> {
  /** 本地记录，或传入 total 后由宿主提供的当前页记录。 */
  rows: readonly T[];
  /** 复用 HysTable 的列定义。 */
  columns: readonly HysTableColumn<T>[];
  /** 从行读取稳定键的字段路径或函数，默认 id。 */
  rowKey?: string | ((row: T) => HysTableKey);
  /** 多选模式。默认单选，两种模式的模型都使用键数组。 */
  multiple?: boolean;
  /** 受控已确认的记录键，支持 v-model。 */
  modelValue?: readonly HysTableKey[];
  /** 非受控初始已选键。 */
  defaultValue?: readonly HysTableKey[];
  /** 受控弹窗状态，支持 v-model:open。 */
  open?: boolean;
  /** 非受控初始显隐，默认 false。 */
  defaultOpen?: boolean;
  /** 是否显示内置触发按钮，默认 true。 */
  showTrigger?: boolean;
  /** 受控页码，从 1 开始。省略则由组件维护。 */
  page?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
  /** 提供页大小选项并启用切换，由调用方回写 pageSize。 */
  pageSizes?: readonly number[];
  /** 传入后启用外部分页，搜索与页码变化交由宿主处理。 */
  total?: number;
  /** 正在加载记录。加载期间暂停选择、确定和分页。 */
  loading?: boolean;
  /** 禁用触发器和记录操作。 */
  disabled?: boolean;
  /** 返回 true 时禁用此记录。 */
  rowDisabled?: (row: T) => boolean;
  /** 本地搜索规则。默认从列字段匹配忽略大小写的关键词。 */
  searchMethod?: (keyword: string, row: T) => boolean;
  /** 搜索提交方式，默认 submit。input 模式防抖后自动搜索。 */
  searchTrigger?: "input" | "submit";
  /** input 模式防抖等待时间，默认 300 毫秒。 */
  searchDelay?: number;
  /** 确认所需的最少选择项数。默认 0。 */
  minSelected?: number;
  /** 多选允许的最多项数。超出上限的本次操作整体保留原选区。 */
  maxSelected?: number;
  /** 在弹窗内显示可移除的已选记录标记，跨页保留名称。 */
  showSelected?: boolean;
  /** 在弹窗中提供只看已选的开关。未知记录保留键和移除入口。 */
  selectionFilter?: boolean;
  /** 确认后记住最近选择的键，并提供回选入口。数量范围 0–20，默认 0。 */
  recentLimit?: number;
  /** 表格或卡片视图，支持 v-model:view。省略时默认表格。 */
  view?: "table" | "cards";
  /** 允许在表格和卡片之间切换。 */
  viewSwitch?: boolean;
  /** 格式化已选记录名称。默认使用首列标量字段或记录键。 */
  recordLabel?: (row: T, key: HysTableKey) => string;
  /** 弹窗标题，默认「选择记录」。 */
  title?: string;
  /** 使用弹窗或右侧抽屉，默认 modal。 */
  presentation?: "modal" | "drawer";
  /** 加载失败时的提示。错误状态暂停选择。 */
  error?: string;
  /** 覆盖入口、搜索、状态和操作文案。selected 支持 {count}。 */
  labels?: Partial<{
    trigger: string;
    search: string;
    placeholder: string;
    selected: string;
    clear: string;
    empty: string;
    loading: string;
    confirm: string;
    cancel: string;
    close: string;
    limit: string;
    minimum: string;
  }>;
}
const props = withDefaults(defineProps<HysRecordPickerProps<T>>(), {
  open: undefined,
  rowKey: "id",
  pageSize: 10,
  showTrigger: true,
  title: "选择记录",
  searchTrigger: "submit",
  searchDelay: 300,
});
const emit = defineEmits<{
  "update:modelValue": [keys: HysTableKey[]];
  "update:open": [open: boolean];
  "update:page": [page: number];
  /** 请求更新每页条数，页码变更沿用分页事件。 */
  "update:pageSize": [size: number];
  /** 在表格和卡片之间切换时发出视图。 */
  "update:view": [view: "table" | "cards"];
  search: [keyword: string];
  confirm: [keys: HysTableKey[]];
  cancel: [];
  /** 选择操作超出上限时发出上限和本次请求数量。 */
  /** 点击重试时发出，调用方重新加载当前页。 */
  retry: [];
  selectionLimit: [limit: number, requested: number];
}>();
defineSlots<{
  trigger?: (scope: {
    open: () => void;
    disabled: boolean;
    keys: readonly HysTableKey[];
  }) => VNodeChild;
  "body-cell"?: (scope: {
    row: T;
    column: HysTableColumn<T>;
    value: unknown;
    index: number;
  }) => VNodeChild;
  empty?: () => VNodeChild;
  /** 搜索区下方的业务筛选控件。 */
  filters?: () => VNodeChild;
  /** 卡片中的自定义记录信息与选中状态。 */
  card?: (scope: { row: T; selected: boolean }) => VNodeChild;
}>();
const labels = computed(() => ({
  trigger: "选择记录",
  search: "搜索",
  placeholder: "输入关键词",
  selected: "已选择 {count} 条记录",
  empty: "没有可选择的记录",
  clear: "清空选择",
  loading: "正在加载记录",
  confirm: "确定",
  cancel: "取消",
  close: "关闭",
  limit: "最多选择 {count} 条记录",
  minimum: "至少选择 {count} 条记录",
  ...props.labels,
}));
function keys(input: readonly HysTableKey[] = []) {
  const unique = [...new Set(input.filter(isGridKey))];
  return props.multiple ? unique : unique.slice(0, 1);
}
const sameKeys = (a: readonly HysTableKey[], b: readonly HysTableKey[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);
const selection = useChoiceModel(
  {
    get modelValue() {
      return props.modelValue;
    },
  },
  () => keys(props.defaultValue),
  sameKeys,
);
const visibility = useChoiceModel(
  {
    get modelValue() {
      return props.open;
    },
  },
  () => !!props.defaultOpen,
);
const paging = useChoiceModel(
  {
    get modelValue() {
      return props.page;
    },
  },
  () => 1,
);
const open = visibility.current;
const selectedOnly = ref(false);
const localView = ref<"table" | "cards">("table");
const activeView = computed(() => props.view ?? localView.value);
const viewOptions = [{ value: "table", label: "表格" }, { value: "cards", label: "卡片" }] as const;
const recent = ref<HysTableKey[]>([]);
const cached = shallowRef(new Map<HysTableKey, T>());
const recentMax = computed(() => Number.isFinite(props.recentLimit) ? Math.max(0, Math.min(20, Math.floor(props.recentLimit!))) : 0);
function setView(view: "table" | "cards") {
  localView.value = view;
  emit("update:view", view);
}
const confirmed = computed(() => keys(selection.current.value));
const draft = ref<HysTableKey[]>([]);
const selectedNames = ref(new Map<HysTableKey, string>());
const limitNotice = ref(false);
const minimum = computed(() =>
  Number.isFinite(props.minSelected)
    ? Math.max(0, Math.floor(props.minSelected!))
    : 0,
);
const maximum = computed(() =>
  props.multiple
    ? Number.isFinite(props.maxSelected)
      ? Math.max(0, Math.floor(props.maxSelected!))
      : Infinity
    : 1,
);
const validSelection = computed(
  () =>
    draft.value.length >= minimum.value && draft.value.length <= maximum.value,
);
const searchText = ref("");
const term = ref("");
const busy = computed(() => !!(props.disabled || props.loading));
const selectionBlocked = computed(() => busy.value || !!props.error);
const isRemote = computed(() => props.total !== undefined);
const size = computed(() =>
  Number.isFinite(props.pageSize)
    ? Math.max(1, Math.floor(props.pageSize))
    : 10,
);
watch(
  [open, confirmed],
  ([visible, keys], [wasVisible, previous]) => {
    if (visible && !wasVisible) selectedOnly.value = false;
    if (visible && (!wasVisible || !previous || !sameKeys(keys, previous))) {
      draft.value = [...keys];
      limitNotice.value = false;
    }
  },
  { immediate: true },
);

const getKey = (row: T) =>
  typeof props.rowKey === "function"
    ? props.rowKey(row)
    : tableValue(row, props.rowKey);
const validRows = computed(() => {
  const seen = new Set<HysTableKey>();
  return props.rows.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const key = getKey(row);
    if (!isGridKey(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});
const searchFields = computed(() => {
  const columns = [...props.columns].reverse();
  const seen = new Set<HysTableColumn<T>>();
  const fields: (string | readonly (string | number)[])[] = [];
  while (columns.length) {
    const column = columns.pop()!;
    if (seen.has(column) || column.hidden) continue;
    seen.add(column);
    if (column.children?.length)
      for (let index = column.children.length - 1; index >= 0; index--)
        columns.push(column.children[index]);
    else fields.push(column.dataIndex ?? column.key);
  }
  return fields;
});
function rowLabel(row: T, key: HysTableKey) {
  const first = searchFields.value[0];
  const label = first === undefined ? undefined : tableValue(row, first);
  return props.recordLabel?.(row, key) ??
    (typeof label === "string" || typeof label === "number" ? String(label) : String(key));
}
watch([validRows, draft, confirmed, recent], () => {
  const wanted = new Set([...draft.value, ...confirmed.value, ...recent.value]);
  const records = new Map([...cached.value].filter(([key]) => wanted.has(key)));
  for (const row of validRows.value) {
    const key = getKey(row);
    if (isGridKey(key) && wanted.has(key)) records.set(key, row);
  }
  cached.value = records;
}, { immediate: true });
const chosenRows = computed(() => draft.value.flatMap(key => {
  const row = cached.value.get(key);
  return row ? [row] : [];
}));
const recentRows = computed(() => recent.value.slice(0, recentMax.value).flatMap(key => {
  const row = cached.value.get(key);
  return row ? [{ key, row }] : [];
}));
watch(
  [validRows, draft, () => props.recordLabel, () => props.showSelected, () => props.selectionFilter, open],
  () => {
    if ((!props.showSelected && !props.selectionFilter) || !open.value) return;
    const wanted = new Set(draft.value);
    const names = new Map(
      [...selectedNames.value].filter(([key]) => wanted.has(key)),
    );
    for (const row of validRows.value) {
      const key = getKey(row);
      if (!isGridKey(key) || !wanted.has(key)) continue;
      names.set(key, rowLabel(row, key));
    }
    selectedNames.value = names;
  },
  { immediate: true },
);
const matches = computed(() => {
  const query = term.value.toLowerCase();
  if (isRemote.value || !query) return validRows.value;
  return validRows.value.filter((row) =>
    props.searchMethod
      ? props.searchMethod(term.value, row)
      : searchFields.value.some((path) => {
          const value = tableValue(row, path);
          return (
            (typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean") &&
            String(value).toLowerCase().includes(query)
          );
        }),
  );
});
const count = computed(() =>
  props.total === undefined
    ? matches.value.length
    : Number.isFinite(props.total)
      ? Math.max(0, Math.floor(props.total))
      : 0,
);
const page = computed(() => {
  const requested = Number.isFinite(paging.current.value)
    ? Math.floor(paging.current.value)
    : 1;
  return Math.min(
    Math.max(1, requested),
    Math.max(1, Math.ceil(count.value / size.value)),
  );
});
const displayed = computed(() =>
  isRemote.value
    ? matches.value
    : matches.value.slice(
        (page.value - 1) * size.value,
        page.value * size.value,
      ),
);
function show() {
  if (!props.disabled) setOpen(true);
}
function setOpen(next: boolean) {
  void visibility.commit(
    next,
    (value) => emit("update:open", value),
    () => {},
  );
}
function setPage(next: number) {
  void paging.commit(
    next,
    (value) => emit("update:page", value),
    () => {},
  );
}
function search(text: string) {
  if (props.disabled || (props.loading && props.searchTrigger === "submit"))
    return;
  term.value = text.trim();
  setPage(1);
  emit("search", term.value);
}
function updateDraft(next: readonly HysTableKey[]) {
  if (selectionBlocked.value) return;
  const normalized = keys(next);
  if (
    normalized.length > maximum.value &&
    normalized.length >= draft.value.length
  ) {
    limitNotice.value = true;
    emit("selectionLimit", maximum.value, normalized.length);
    return;
  }
  limitNotice.value = false;
  draft.value = normalized;
}
function toggleRow(row: T) {
  const key = getKey(row);
  if (!isGridKey(key) || selectionBlocked.value || props.rowDisabled?.(row)) return;
  updateDraft(draft.value.includes(key)
    ? (props.multiple ? draft.value.filter(item => item !== key) : draft.value)
    : (props.multiple ? [...draft.value, key] : [key]));
}
const cardRows = computed(() => (selectedOnly.value ? chosenRows.value : displayed.value).flatMap(row => {
  const key = getKey(row);
  return isGridKey(key) ? [{ key, row, label: rowLabel(row, key) }] : [];
}));
async function save() {
  if (selectionBlocked.value || !validSelection.value) return false;
  const next = [...draft.value];
  const accepted = sameKeys(selection.current.value, next) || await selection.commit(
    next,
    (value) => emit("update:modelValue", [...value]),
    () => {},
  );
  if (accepted && recentMax.value) recent.value = [...new Set([...next, ...recent.value])].slice(0, recentMax.value);
  return accepted;
}
</script>

<template>
  <slot
    v-if="showTrigger"
    name="trigger"
    :open="show"
    :disabled="!!disabled"
    :keys="confirmed"
  >
    <HysButton
      variant="secondary"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="show"
    >
      {{ labels.trigger
      }}<template v-if="confirmed.length"> · {{ confirmed.length }}</template>
    </HysButton>
  </slot>
  <component
    :is="presentation === 'drawer' ? HysDrawer : HysModal"
    :open="open"
    :title="title"
    width="min(94vw, 780px)"
    v-bind="presentation === 'drawer' ? {} : { dragMode: 'preview' }"
    footer
    initial-focus=".hys-record-picker-search input"
    :ok-text="labels.confirm"
    :cancel-text="labels.cancel"
    :close-text="labels.close"
    :confirm-disabled="selectionBlocked || !validSelection"
    :before-confirm="save"
    @update:open="setOpen"
    @cancel="emit('cancel')"
    @ok="emit('confirm', [...draft])"
  >
    <section class="hys-record-picker-content">
      <div class="hys-record-picker-tools">
        <HysSearch
          v-model="searchText"
          class="hys-record-picker-search"
          :placeholder="labels.placeholder"
          :aria-label="labels.search"
          :trigger="searchTrigger"
          :delay="searchDelay"
          :enter-button="searchTrigger === 'submit' ? labels.search : false"
          search-on-clear
          :disabled="disabled"
          :loading="loading"
          @search="search"
        />
        <span role="status">{{
          labels.selected.replace("{count}", String(draft.length))
        }}</span>
        <HysButton
          v-if="draft.length"
          size="sm"
          variant="ghost"
          :disabled="selectionBlocked"
          @click="updateDraft([])"
          >{{ labels.clear }}</HysButton
        >
      </div>
      <div
        v-if="limitNotice || !validSelection"
        class="hys-record-picker-limit"
        role="status"
      >
        {{
          (limitNotice || draft.length > maximum
            ? labels.limit
            : labels.minimum
          ).replace(
            "{count}",
            String(limitNotice || draft.length > maximum ? maximum : minimum),
          )
        }}
      </div>
      <div v-if="selectionFilter || viewSwitch" class="hys-record-picker-view-options">
        <HysCheckbox v-if="selectionFilter" v-model="selectedOnly" :disabled="busy">只看已选</HysCheckbox>
        <HysSegmented v-if="viewSwitch" :options="viewOptions" :model-value="activeView" :disabled="busy"
          size="sm" aria-label="记录视图" @update:model-value="setView" />
      </div>
      <HysScrollbar
        v-if="(showSelected || selectedOnly) && draft.length"
        direction="vertical"
        :max-height="82"
      >
        <div
          class="hys-record-picker-selected"
          role="group"
          :aria-label="labels.selected.replace('{count}', String(draft.length))"
        >
          <HysBadge
            v-for="key in draft"
            :key="key"
            :closable="!selectionBlocked"
            :close-label="'移除 ' + (selectedNames.get(key) ?? String(key))"
            @close="updateDraft(draft.filter((item) => item !== key))"
          >
            {{ selectedNames.get(key) ?? key }}
          </HysBadge>
        </div>
      </HysScrollbar>
      <slot name="filters" />
      <div v-if="!selectedOnly && recentRows.length" class="hys-record-picker-view-options" role="group" aria-label="最近使用">
        <span>最近使用</span>
        <HysButton v-for="{ key, row } in recentRows" :key="key" size="sm" variant="secondary"
          :disabled="selectionBlocked || rowDisabled?.(row)" :aria-pressed="draft.includes(key)"
          @click="toggleRow(row)">{{ rowLabel(row, key) }}</HysButton>
      </div>
      <div v-if="error" class="hys-record-picker-limit" role="alert">
        {{ error }}
        <HysButton size="sm" variant="text" :disabled="loading" @click="emit('retry')">重试</HysButton>
      </div>
      <HysScrollbar v-else-if="activeView === 'cards'" direction="vertical" max-height="min(40dvh, 370px)">
        <HysDataView class="hys-record-picker-cards" :items="cardRows" view="grid" hide-view-switch item-key="key" :loading="loading" :labels="{ empty: labels.empty }">
          <template #item="{ item }">
            <HysButton block variant="secondary" :disabled="busy || rowDisabled?.(item.row)" :aria-pressed="draft.includes(item.key)"
              @click="toggleRow(item.row)">
              <slot name="card" :row="item.row" :selected="draft.includes(item.key)">{{ item.label }}</slot>
            </HysButton>
          </template>
          <template v-if="$slots.empty" #empty><slot name="empty" /></template>
        </HysDataView>
      </HysScrollbar>
      <HysTable v-else
        :rows="selectedOnly ? chosenRows : displayed"
        :columns="columns"
        :row-key="rowKey"
        :loading="loading"
        :locale="{ loadingText: labels.loading }"
        :disabled="disabled"
        :empty-text="labels.empty"
        :selectable="(row) => !rowDisabled?.(row)"
        :selection-type="multiple ? 'checkbox' : 'radio'"
        :selected-row-keys="draft"
        reserve-selection
        :max-height="'min(40dvh, 370px)'"
        size="sm"
        @update:selected-row-keys="updateDraft"
      >
        <template v-if="$slots['body-cell']" #body-cell="scope"
          ><slot name="body-cell" v-bind="scope"
        /></template>
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      </HysTable>
      <HysPagination
        v-if="!selectedOnly"
        :page-size-options="pageSizes ? [...pageSizes] : undefined" :show-size-changer="!!pageSizes?.length"
        @update:page-size="emit('update:pageSize', $event)"
        :page="paging.current.value"
        :page-size="size"
        :total="count"
        :loading="loading"
        :disabled="disabled"
        size="sm"
        :hide-on-single-page="!pageSizes?.length"
        @update:page="setPage"
      />
    </section>
  </component>
</template>

<style scoped>
.hys-record-picker-content {
  display: grid;
  gap: 12px;
  min-width: 0;
  /* Keep the search focus outline inside the modal's scroll viewport. */
  padding: 4px;
}
.hys-record-picker-tools {
  display: flex;
  align-items: center;
  gap: 8px 12px;
  flex-wrap: wrap;
}
.hys-record-picker-view-options { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.hys-record-picker-cards { padding: 4px; }
.hys-record-picker-search {
  flex: 1 1 230px;
  min-width: 0;
  max-width: 100%;
}
.hys-record-picker-tools > [role="status"] {
  color: var(--hys-ui-theme-muted);
}
.hys-record-picker-limit {
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
.hys-record-picker-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 2px;
}
</style>
