<script setup lang="ts" generic="T">
import { computed, type VNodeChild } from "vue";
import { useChoiceModel } from "../../composables/choiceModel";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysCard from "../HysCard/HysCard.vue";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import HysPagination from "../HysPagination/HysPagination.vue";
import HysSearch from "../HysSearch/HysSearch.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";

export type HysDataViewMode = "list" | "grid";
export interface HysDataViewSort<T> {
  key: string;
  label: string;
  /** 本地排序的比较函数，远程分页交给调用方排序。 */
  compare?: (a: T, b: T) => number;
}
export interface HysDataViewProps<T> {
  /** 当前数据。启用分页时传入当前页的数据。 */
  items: readonly T[];
  /** 列表或网格，支持 v-model:view。 */
  view?: HysDataViewMode;
  /** 非受控初始视图，默认 list。 */
  defaultView?: HysDataViewMode;
  /** 网格最多展示的列数，默认 3。可用宽度不足时自动减少。 */
  gridColumns?: number;
  /** 列表项的稳定 key 字段或取值函数。 */
  itemKey?: keyof T | ((item: T, index: number) => string | number);
  /** 显示骨架，暂时禁止切页。 */
  loading?: boolean;
  /** 记录总数。提供后启用分页，分页数据由调用方提供。 */
  total?: number;
  /** 受控页码，从 1 开始，支持 v-model:page。 */
  page?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
  /** 本地分页。未传 total 时从 items 中切出当前页，默认 false。 */
  localPagination?: boolean;
  /** 分页显示每页数量选择，支持 v-model:pageSize。 */
  pageSizeOptions?: readonly number[];
  /** 显示关键词输入框。传 total 时只发出查询请求，宿主负责筛选。 */
  searchable?: boolean;
  /** 受控关键词，支持 v-model:search。 */
  search?: string;
  /** 本地过滤函数，默认匹配项目的文本或首层标量字段。 */
  searchMethod?: (keyword: string, item: T) => boolean;
  /** 可选的业务排序。 */
  sortOptions?: readonly HysDataViewSort<T>[];
  /** 当前排序键，支持 v-model:sort。空值恢复原始顺序。 */
  sort?: string | null;
  /** 出错提示。可通过重试重新请求，默认无错误。 */
  error?: string;
  /** 覆盖列表、网格、空状态与加载提示。 */
  labels?: Partial<{
    list: string;
    grid: string;
    empty: string;
    loading: string;
    view: string;
    search: string;
    sort: string;
    originalOrder: string;
    retry: string;
  }>;
}
const props = withDefaults(defineProps<HysDataViewProps<T>>(), {
  defaultView: "list",
  gridColumns: 3,
});
const emit = defineEmits<{
  "update:view": [view: HysDataViewMode];
  "update:page": [page: number];
  /** 用户改变分页条数时发出正整数。 */
  "update:pageSize": [pageSize: number];
  /** 编辑关键词时发出新的字符串。 */
  "update:search": [search: string];
  /** 用户选择排序后发出键，清除时为 null。 */
  "update:sort": [sort: string | null];
  /** 用户请求重试当前视图。 */
  retry: [];
}>();
defineSlots<{
  "list-item"?: (scope: { item: T; index: number }) => VNodeChild;
  "grid-item"?: (scope: { item: T; index: number }) => VNodeChild;
  /** 同一内容可复用于两种视图，各自的专用插槽优先。 */
  item?: (scope: {
    item: T;
    index: number;
    view: HysDataViewMode;
  }) => VNodeChild;
  empty?: () => VNodeChild;
  loading?: () => VNodeChild;
  /** 替换错误反馈，提供错误信息及重试函数。 */
  error?: (scope: { message: string; retry: () => void }) => VNodeChild;
  toolbar?: (scope: { view: HysDataViewMode; page: number }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const labels = computed(() => ({
  list: "列表",
  grid: "网格",
  empty: "暂无记录",
  loading: "正在加载数据",
  view: "数据视图",
  search: "搜索内容",
  sort: "排序方式",
  originalOrder: "原始顺序",
  retry: "重试",
  ...props.labels,
}));
const modes = computed(() => [
  { value: "list" as const, label: labels.value.list },
  { value: "grid" as const, label: labels.value.grid },
]);
const views = useChoiceModel(
  {
    get modelValue() {
      return props.view;
    },
  },
  () => props.defaultView,
);
const pages = useChoiceModel(
  {
    get modelValue() {
      return props.page;
    },
  },
  () => 1,
);
const view = views.current;
const page = pages.current;
const pageSizes = useChoiceModel(
  {
    get modelValue() {
      return props.pageSize;
    },
  },
  () => 10,
);
const queries = useChoiceModel(
  {
    get modelValue() {
      return props.search;
    },
  },
  () => "",
);
const sorts = useChoiceModel(
  {
    get modelValue() {
      return props.sort;
    },
  },
  () => null as string | null,
);
const size = computed(() =>
  Number.isFinite(pageSizes.current.value)
    ? Math.max(1, Math.floor(pageSizes.current.value))
    : 10,
);
const sizeOptions = computed(() => [
  ...new Set(
    (props.pageSizeOptions ?? []).filter(
      (value) => Number.isInteger(value) && value > 0,
    ),
  ),
]);
const sortChoices = computed(() => [
  { value: "", label: labels.value.originalOrder },
  ...(props.sortOptions ?? [])
    .filter(({ key }) => key.length > 0)
    .map(({ key, label }) => ({ value: key, label })),
]);
const local = computed(() => props.total === undefined);
const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase();
function matches(value: unknown, keyword: string) {
  return (
    (typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean") &&
    normalize(String(value)).includes(keyword)
  );
}
const columns = computed(() =>
  Number.isFinite(props.gridColumns)
    ? Math.max(1, Math.min(12, Math.floor(props.gridColumns)))
    : 3,
);
const items = computed(() => {
  const keys = new Set<string | number>();
  return props.items.map((item, index) => {
    const value =
      typeof props.itemKey === "function"
        ? props.itemKey(item, index)
        : item != null && props.itemKey !== undefined
          ? item[props.itemKey]
          : undefined;
    const validKey =
      (typeof value === "string" || typeof value === "number") &&
      !keys.has(value);
    const key = validKey ? `key:${typeof value}:${value}` : `index:${index}`;
    if (validKey) keys.add(value);
    return { key, item, index };
  });
});
const filtered = computed(() => {
  if (!local.value) return items.value;
  const word = queries.current.value.trim();
  const needle = normalize(word);
  const matching = !word
    ? items.value
    : items.value.filter(({ item }) =>
        props.searchMethod
          ? props.searchMethod(word, item)
          : item !== null && typeof item === "object"
            ? Object.values(item).some((value) => matches(value, needle))
            : matches(item, needle),
      );
  const sorter = props.sortOptions?.find(
    ({ key }) => key === sorts.current.value,
  )?.compare;
  return sorter
    ? [...matching].sort((a, b) => sorter(a.item, b.item))
    : matching;
});
const totalCount = computed(
  () =>
    props.total ?? (props.localPagination ? filtered.value.length : undefined),
);
const displayed = computed(() => {
  if (!local.value || !props.localPagination) return filtered.value;
  const last = Math.max(1, Math.ceil(filtered.value.length / size.value));
  const start = (Math.min(last, Math.max(1, page.value || 1)) - 1) * size.value;
  return filtered.value.slice(start, start + size.value);
});
function changeView(next: HysDataViewMode) {
  void views.commit(
    next,
    (accepted) => emit("update:view", accepted),
    () => {},
  );
}
function changePage(next: number) {
  void pages.commit(
    next,
    (accepted) => emit("update:page", accepted),
    () => {},
  );
}
async function search(next: string) {
  if (
    await queries.commit(
      next,
      (value) => emit("update:search", value),
      () => {},
    )
  )
    changePage(1);
}
async function sort(next: string) {
  if (
    await sorts.commit(
      next || null,
      (value) => emit("update:sort", value),
      () => {},
    )
  )
    changePage(1);
}
const retry = () => emit("retry");
</script>

<template>
  <section v-bind="skin" class="hys-data-view">
    <div class="hys-data-view-toolbar">
      <slot name="toolbar" :view="view" :page="page" />
      <HysSearch
        v-if="searchable"
        class="hys-data-view-search"
        size="sm"
        :model-value="queries.current.value"
        :placeholder="labels.search"
        :aria-label="labels.search"
        @update:model-value="search"
      />
      <HysSelect
        v-if="sortChoices.length > 1"
        class="hys-data-view-sort"
        size="sm"
        :model-value="sorts.current.value ?? ''"
        :options="sortChoices"
        :aria-label="labels.sort"
        :native-label-tooltip="false"
        @update:model-value="sort"
      />
      <HysSegmented
        :model-value="view"
        :options="modes"
        :aria-label="labels.view"
        size="sm"
        @update:model-value="changeView"
      />
    </div>
    <div v-if="loading" class="hys-data-view-feedback" aria-busy="true">
      <slot name="loading"
        ><HysSkeleton :loading-text="labels.loading" :lines="3"
      /></slot>
    </div>
    <div v-else-if="error" class="hys-data-view-feedback">
      <slot name="error" :message="error" :retry="retry">
        <HysEmpty :description="error"
          ><template #description
            ><span role="alert">{{ error }}</span></template
          ><HysButton size="sm" variant="secondary" @click="retry">{{
            labels.retry
          }}</HysButton></HysEmpty
        >
      </slot>
    </div>
    <div v-else-if="!displayed.length" class="hys-data-view-feedback">
      <slot name="empty"><HysEmpty :description="labels.empty" /></slot>
    </div>
    <ul
      v-else
      class="hys-data-view-items"
      :data-view="view"
      :style="{ '--hys-data-columns': columns }"
    >
      <li
        v-for="entry in displayed"
        :key="entry.key"
        class="hys-data-view-item"
      >
        <HysCard v-if="view === 'grid'" class="hys-data-view-card">
          <slot name="grid-item" :item="entry.item" :index="entry.index">
            <slot
              name="item"
              :item="entry.item"
              :index="entry.index"
              :view="view"
              >{{ entry.item }}</slot
            >
          </slot>
        </HysCard>
        <slot v-else name="list-item" :item="entry.item" :index="entry.index">
          <slot
            name="item"
            :item="entry.item"
            :index="entry.index"
            :view="view"
            >{{ entry.item }}</slot
          >
        </slot>
      </li>
    </ul>
    <HysPagination
      v-if="totalCount !== undefined"
      :total="totalCount"
      :page="page"
      :page-size="size"
      :page-size-options="sizeOptions"
      :show-size-changer="!!sizeOptions.length"
      :loading="loading"
      :hide-on-single-page="!sizeOptions.length"
      @update:page="changePage"
      @update:page-size="
        pageSizes.commit(
          $event,
          (value) => emit('update:pageSize', value),
          () => {},
        )
      "
    />
  </section>
</template>

<style scoped>
.hys-data-view {
  display: grid;
  min-width: 0;
  gap: 12px;
}
.hys-data-view-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.hys-data-view-toolbar > :last-child {
  margin-inline-start: auto;
}
.hys-data-view-search {
  flex: 1 1 150px;
  max-width: 260px;
  min-width: 0;
}
.hys-data-view-sort {
  flex: 0 1 155px;
  min-width: 0;
}
.hys-data-view-items {
  display: grid;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 10px;
}
.hys-data-view-items[data-view="grid"] {
  grid-template-columns: repeat(
    auto-fill,
    minmax(
      min(
        100%,
        max(184px, calc((100% + 10px) / var(--hys-data-columns) - 10px))
      ),
      1fr
    )
  );
}
.hys-data-view-item {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-data-view-items[data-view="list"] > .hys-data-view-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--hys-ui-theme-border);
}
.hys-data-view-card {
  height: 100%;
}
.hys-data-view-feedback {
  min-width: 0;
  padding: 12px;
}
</style>
