<script setup lang="ts">
import { computed, ref, type Component, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysAvatar from "../HysAvatar/HysAvatar.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import HysOverflowText from "../HysOverflowText/HysOverflowText.vue";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";
import HysVirtualList from "../HysVirtualList/HysVirtualList.vue";
import HysSortableList from "../HysSortableList/HysSortableList.vue";
import HysBadge from "../HysBadge/HysBadge.vue";

export interface HysListItem {
  key: string | number;
  title: string;
  description?: string;
  avatar?: string;
  icon?: Component;
  meta?: string;
  group?: string;
  /** 标记尚未阅读的记录。 */
  unread?: boolean;
  disabled?: boolean;
}
export interface HysListProps {
  /** 列表项。相邻且 group 相同的条目共用标题。 */
  items: readonly HysListItem[];
  /** 由调用方控制的高亮项。 */
  selectedKeys?: readonly (string | number)[];
  /** 单选或多选。省略时只透传 itemClick 与高亮状态。 */
  selectionMode?: "single" | "multiple";
  /** 由虚拟列表渲染可见区。数字表示视口高度。 */
  virtual?: boolean | number;
  /** 启用拖拽排序。启用时采用 HysSortableList。 */
  sortable?: boolean;
  /** 在指针悬停以及键盘焦点进入行时才显示操作。 */
  hoverActions?: boolean;
  /** 显示加载更多入口。 */
  hasMore?: boolean;
  /** 列表项可由点击或键盘激活。 */
  interactive?: boolean;
  /** 显示列表边框。 */
  bordered?: boolean;
  /** 显示行间分隔线，默认 true。 */
  divided?: boolean;
  /** 使用紧凑的行内距。 */
  compact?: boolean;
  /** 描述的最大行数，默认 2。 */
  descriptionLines?: number;
  /** 显示条目骨架占位。 */
  loading?: boolean;
  /** 空列表说明。 */
  emptyText?: string;
}
const props = withDefaults(defineProps<HysListProps>(), { divided: true, descriptionLines: 2, emptyText: "暂无条目" });
const emit = defineEmits<{
  /** 激活可操作条目时发出数据和原始点击事件。 */
  itemClick: [item: HysListItem, event: MouseEvent];
  /** 单选或多选操作请求更新选择。 */
  "update:selectedKeys": [keys: (string | number)[]];
  /** 拖动行完成后请求更新条目顺序。 */
  "update:items": [items: HysListItem[]];
  /** 用户请求加载下一批条目。 */
  loadMore: [];
}>();
defineSlots<{
  /** 自定义条目主体。 */
  item?: (scope: { item: HysListItem; index: number }) => VNodeChild;
  /** 条目左侧图标或头像。 */
  leading?: (scope: { item: HysListItem }) => VNodeChild;
  /** 条目末尾的辅助信息和操作。 */
  actions?: (scope: { item: HysListItem }) => VNodeChild;
  /** 条目下方的可选扩展内容。 */
  extension?: (scope: { item: HysListItem; index: number }) => VNodeChild;
  /** 列表为空时的占位。 */
  empty?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const local = ref<(string | number)[]>([]);
const selected = computed(() => props.selectedKeys ?? local.value);
function action(item: HysListItem, event: MouseEvent) {
  if (props.selectionMode) {
    const previous = selected.value;
    const next = previous.includes(item.key) ? previous.filter(key => key !== item.key)
      : props.selectionMode === "single" ? [item.key] : [...previous, item.key];
    local.value = next;
    emit("update:selectedKeys", next);
  }
  emit("itemClick", item, event);
}
const rowNodes = computed(() => props.items.map((item, index) => ({ item, index, key: item.key })));
type Node = (typeof rowNodes.value)[number];
const keyOf = (node: Node) => node.key;
const disabledRow = (node: Node) => !!node.item.disabled;
const groupOf = (node: Node) => node.item.group ?? "";
</script>
<template>
  <div v-bind="skin" class="hys-list" :class="{ bordered, divided, compact, 'hover-actions': hoverActions }" :aria-busy="loading || undefined">
    <HysSkeleton v-if="loading && (!hasMore || !items.length)" :lines="3" />
    <slot v-else-if="!items.length" name="empty"><HysEmpty :description="emptyText" /></slot>
    <component v-else :is="sortable ? HysSortableList : virtual ? HysVirtualList : 'ul'"
      :model-value="sortable ? rowNodes : undefined" :items="virtual && !sortable ? rowNodes : undefined"
      :item-key="sortable ? 'key' : virtual ? keyOf : undefined"
      :item-disabled="sortable ? disabledRow : undefined"
      :height="typeof virtual === 'number' ? virtual : undefined" :dynamic="virtual && !sortable ? true : undefined"
      :group-by="virtual && !sortable ? groupOf : undefined" :has-more="virtual && !sortable ? hasMore : undefined"
      :loading="virtual && !sortable ? loading : undefined"
      @load-more="emit('loadMore')" @update:model-value="emit('update:items', $event.map((node: {item: HysListItem}) => node.item))">
      <template v-for="slotName in [sortable || virtual ? 'item' : 'default']" #[slotName]="scope">
        <component v-for="{ item, index, key } in scope?.item ? [scope.item] : rowNodes" :is="sortable || virtual ? 'div' : 'li'"
          :key="key" class="list-entry">
        <div v-if="(!virtual || sortable) && item.group && item.group !== items[index - 1]?.group" class="group">{{ item.group }}</div>
        <div class="row" :class="{ selected: selected.includes(item.key), disabled: item.disabled }">
          <slot name="leading" :item="item">
            <HysAvatar v-if="item.avatar" :src="item.avatar" :alt="item.title" size="sm" />
            <component :is="item.icon" v-else-if="item.icon" class="item-icon" aria-hidden="true" />
          </slot>
          <div class="body">
            <span v-if="item.unread" class="unread"><HysBadge dot announcement="未读"><span class="unread-label">未读</span></HysBadge></span>
            <slot name="item" :item="item" :index="index">
              <HysButton v-if="interactive || selectionMode" variant="text" size="sm" class="entry" :disabled="item.disabled"
                :aria-pressed="selectedKeys || selectionMode ? selected.includes(item.key) : undefined"
                @click="action(item, $event)">{{ item.title }}</HysButton>
              <HysOverflowText v-else :text="item.title" />
              <HysOverflowText v-if="item.description" class="description" :text="item.description" :lines="descriptionLines" />
            </slot>
          </div>
          <div v-if="$slots.actions || item.meta" class="meta" :class="{ actions: $slots.actions }"><slot name="actions" :item="item">{{ item.meta }}</slot></div>
        </div>
        <div v-if="$slots.extension" class="extension"><slot name="extension" :item="item" :index="index" /></div>
        </component>
      </template>
    </component>
    <HysButton v-if="hasMore" class="load-more" variant="secondary" size="sm" :loading="loading" @click="emit('loadMore')">加载更多</HysButton>
  </div>
</template>
<style scoped>
.hys-list { min-width: 0; color: var(--hys-ui-theme-text); }
ul { margin: 0; padding: 0; list-style: none; }
.bordered { border: 1px solid var(--hys-ui-theme-border); border-radius: var(--hys-ui-radius, 8px); }
.row { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 11px 12px; }
.compact .row { padding-block: 6px; }
.divided .list-entry:not(:last-child) { border-bottom: 1px solid var(--hys-ui-theme-border); }
.row:hover, .group { background: var(--hys-ui-theme-surface-alt); }
.row.selected { background: color-mix(in srgb, var(--hys-ui-theme-primary) 10%, transparent); }
.disabled { opacity: .65; }
.body { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.entry { text-align: start; white-space: normal; }
.description, .meta { color: var(--hys-ui-theme-muted); font-size: 13px; overflow-wrap: anywhere; }
.meta { max-width: 42%; }
.group { padding: 7px 12px; color: var(--hys-ui-theme-muted); font-size: 12px; }
@media (hover: hover) {
  .hover-actions .row:not(:hover):not(:focus-within) .actions {
    opacity: 0;
    pointer-events: none;
  }
}
.extension { padding: 0 12px 8px; }
.unread { display: inline-flex; vertical-align: middle; margin-inline-end: 6px; }
.unread-label { font-size: 11px; }
.load-more { margin: 6px 12px; }
.item-icon { width: 1.1em; height: 1.1em; }
</style>
