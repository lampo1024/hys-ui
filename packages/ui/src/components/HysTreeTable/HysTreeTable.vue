<script setup lang="ts" generic="T extends object">
import { useTemplateRef, type VNodeChild } from "vue";
import type {
  HysTableColumn,
  HysTableKey,
  HysTableLocale,
  HysTableSort,
  HysTableLoadContext,
} from "../../composables/table";
import { useChoiceModel } from "../../composables/choiceModel";
import HysSearch from "../HysSearch/HysSearch.vue";
import HysTable from "../HysTable/HysTable.vue";

export interface HysTreeTableProps<T extends object> {
  /** 树根行。每一层的行使用相同的列定义。 */
  data: readonly T[];
  /** 复用 HysTable 的列定义。可排序列会在同级内排序。 */
  columns: readonly HysTableColumn<T>[];
  /** 稳定的行键字段路径或取值函数，默认 id。跨层级也需唯一。 */
  rowKey?: string | ((row: T) => HysTableKey);
  /** 读取子项数组的字段路径，默认 children。 */
  childrenKey?: string;
  /** 受控展开键，支持 v-model:expandedKeys。 */
  expandedKeys?: readonly HysTableKey[];
  /** 非受控初始展开键。 */
  defaultExpandedKeys?: readonly HysTableKey[];
  /** 非受控时默认展开所有有后代的行。 */
  defaultExpandAll?: boolean;
  /** 各层缩进的像素值，默认 18。 */
  indent?: number;
  /** 开启独立的行选择，返回 true 时允许选择该行。 */
  selectable?: boolean | ((row: T, index: number) => boolean);
  /** 受控已选键，支持 v-model:selectedRowKeys。 */
  selectedRowKeys?: readonly HysTableKey[];
  /** 表格滚动视口的最大高度。 */
  maxHeight?: number | string;
  /** 表格宽度不足时允许在表格内横向滚动。 */
  scrollWidth?: number | string;
  /** 禁用选择和展开操作。默认 false。 */
  disabled?: boolean;
  /** 加载期间显示状态行，默认 false。 */
  loading?: boolean;
  /** 覆盖行展开、收起以及加载、空状态等文本。 */
  locale?: Partial<HysTableLocale>;
  /** 表格尺寸，默认 md。 */
  size?: "sm" | "md" | "lg";
  /** 显示树内搜索框，匹配后保留祖先路径并临时展开。 */
  searchable?: boolean;
  /** 受控关键词，支持 v-model:search。 */
  search?: string;
  /** 指定参与本地搜索的列键。 */
  searchColumns?: readonly string[];
  /** 自定义单行是否命中搜索。 */
  searchMethod?: (search: string, row: T) => boolean;
  /** 搜索框名称，默认「搜索节点」。 */
  searchLabel?: string;
  /** independent 独立选择（默认），cascade 联动已加载的父子节点。 */
  selectionMode?: "independent" | "cascade";
  /** 指示尚未加载、仍可展开的行的布尔值字段，默认 hasChildren。 */
  hasChildrenKey?: string;
  /** 延迟读取分支，接收节点、层级和 AbortSignal，失败时可重试。 */
  loadChildren?: (
    row: T,
    context: HysTableLoadContext,
  ) => readonly T[] | Promise<readonly T[]>;
}
type Cell<T extends object> = {
  row: T;
  column: HysTableColumn<T>;
  value: unknown;
  index: number;
};
const props = withDefaults(defineProps<HysTreeTableProps<T>>(), {
  rowKey: "id",
  childrenKey: "children",
  indent: 18,
  size: "md",
  searchLabel: "搜索节点",
  selectionMode: "independent",
  hasChildrenKey: "hasChildren",
});
const emit = defineEmits<{
  "update:expandedKeys": [keys: HysTableKey[]];
  "update:selectedRowKeys": [keys: HysTableKey[]];
  expand: [row: T, keys: HysTableKey[]];
  collapse: [row: T, keys: HysTableKey[]];
  rowClick: [row: T, index: number, event: MouseEvent];
  /** 关键词改变时发出新字符串。 */
  "update:search": [search: string];
  /** 分支异步加载成功时发出父行和返回的子项。 */
  load: [parent: T, children: readonly T[]];
  /** 分支异步加载失败时发出父行和异常。 */
  loadError: [parent: T, error: unknown];
}>();
const slots = defineSlots<{
  "body-cell"?: (scope: Cell<T>) => VNodeChild;
  "header-cell"?: (scope: {
    column: HysTableColumn<T>;
    sorts: readonly HysTableSort[];
  }) => VNodeChild;
  "expand-icon"?: (scope: {
    row: T;
    index: number;
    expanded: boolean;
    loading: boolean;
    depth: number;
  }) => VNodeChild;
  empty?: () => VNodeChild;
  loading?: () => VNodeChild;
}>();
const table = useTemplateRef("table");
const filter = useChoiceModel(
  {
    get modelValue() {
      return props.search;
    },
  },
  () => "",
);
function updateSearch(value: string) {
  void filter.commit(
    value,
    (next) => emit("update:search", next),
    () => {},
  );
}
function change(row: T, expanded: boolean, keys: HysTableKey[]) {
  if (expanded) emit("expand", row, keys);
  else emit("collapse", row, keys);
}
defineExpose({
  /** 展开、收起或切换可展开的行。受控值被接受时返回 true。 */
  toggleRowExpansion: (row: T | HysTableKey, expanded?: boolean) =>
    table.value?.toggleRowExpansion(row, expanded) ?? Promise.resolve(false),
  /** 聚焦当前可见的行，未展开的子行返回 false。 */
  focusRow: (row: T | HysTableKey) => table.value?.focusRow(row) ?? false,
  /** 主动加载节点并在已失败时重试，返回操作是否成功。 */
  loadRow: (row: T | HysTableKey) =>
    table.value?.loadRow(row, true) ?? Promise.resolve(false),
});
</script>

<template>
  <HysTable
    ref="table"
    :rows="data"
    :columns="columns"
    :row-key="rowKey"
    :children-key="childrenKey"
    tree-mode
    :expanded-row-keys="expandedKeys"
    :default-expanded-row-keys="defaultExpandedKeys"
    :default-expand-all="defaultExpandAll"
    :indent="indent"
    :selected-row-keys="selectedRowKeys"
    :selectable="selectable"
    :check-strictly="selectionMode !== 'cascade'"
    :search="filter.current.value"
    :search-columns="searchColumns"
    :search-method="searchMethod"
    :has-children-key="hasChildrenKey"
    :load-children="loadChildren"
    :max-height="maxHeight"
    :scroll-width="scrollWidth"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :locale="locale"
    keyboard-navigation
    @update:expanded-row-keys="emit('update:expandedKeys', $event)"
    @update:selected-row-keys="emit('update:selectedRowKeys', $event)"
    @expand-change="change"
    @row-click="(row, index, event) => emit('rowClick', row, index, event)"
    @load="(parent, children) => emit('load', parent, children)"
    @load-error="(parent, error) => emit('loadError', parent, error)"
  >
    <template v-if="searchable" #title>
      <HysSearch
        class="hys-tree-table-search"
        :model-value="filter.current.value"
        :aria-label="searchLabel"
        :placeholder="searchLabel"
        :disabled="disabled"
        size="sm"
        @update:model-value="updateSearch"
      />
    </template>
    <template v-if="slots['body-cell']" #body-cell="scope"
      ><slot name="body-cell" v-bind="scope"
    /></template>
    <template v-if="slots['header-cell']" #header-cell="scope"
      ><slot name="header-cell" v-bind="scope"
    /></template>
    <template v-if="slots['expand-icon']" #expand-icon="scope"
      ><slot name="expand-icon" v-bind="scope"
    /></template>
    <template v-if="slots.empty" #empty><slot name="empty" /></template>
    <template v-if="slots.loading" #loading><slot name="loading" /></template>
  </HysTable>
</template>

<style scoped>
.hys-tree-table-search {
  width: min(100%, 270px);
}
</style>
