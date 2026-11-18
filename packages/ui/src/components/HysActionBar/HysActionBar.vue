<script setup lang="ts">
import {
  computed,
  shallowRef,
  useTemplateRef,
  watch,
  type Component,
  type VNodeChild,
} from "vue";
import type { HysMenuItem } from "../HysMenu/HysMenu.vue";
import type { HysMenuKey } from "../../composables/menu";
import { useContainerWidth } from "../../composables/useContainerWidth";
import { useHysRootAttrs } from "../../config";
import HysButton, { type HysButtonVariant } from "../HysButton/HysButton.vue";
import HysDropdown from "../HysDropdown/HysDropdown.vue";
import HysPopconfirm from "../HysPopconfirm/HysPopconfirm.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysProgress from "../HysProgress/HysProgress.vue";
import { Ellipsis } from "../HysIcon/svgIcons";
import { shortcutMatches } from "../../composables/shortcutMatch";

export interface HysActionBarItem {
  key: HysMenuKey;
  label: string;
  icon?: Component;
  variant?: HysButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** 禁用时显示的业务原因，直显按钮以提示浮层呈现，更多菜单在操作下方呈现。 */
  disabledReason?: string;
  /** 聚焦操作栏时激活操作的快捷键，例如 Alt+A。 */
  shortcut?: string;
  /** 在选择数低于此值时禁用，默认至少选中一项。0 允许空选择时使用。 */
  minSelection?: number;
  /** 在选择数超过此值时禁用。 */
  maxSelection?: number;
  /** 暂时隐藏操作。 */
  hidden?: boolean;
  /** 同名操作在更多菜单内使用同一组标题。 */
  group?: string;
  /** 始终放入更多操作菜单。 */
  overflow?: boolean;
  /** 危险操作默认确认。true 使用默认文案，false 明确跳过确认。 */
  confirm?:
    | boolean
    | {
        title?: string;
        description?: string;
        confirmText?: string;
        cancelText?: string;
      };
}
export interface HysActionBarProps {
  /** 已选择数量，由父组件维护。 */
  selectedCount?: number;
  /** 按配置顺序展示的操作，key 必须唯一。 */
  actions?: readonly HysActionBarItem[];
  /** 请求处理中，阻止任何操作与清空。 */
  loading?: boolean;
  /** 无选择时展示操作栏，各操作仍遵守自身的选择数量限制。默认 false。 */
  visibleWhenEmpty?: boolean;
  /** 宽容器最多直显的操作数，默认 3。窄容器会进一步折叠。 */
  maxVisibleActions?: number;
  /** 可操作的记录总数，用于选择进度及全选。 */
  totalCount?: number;
  /** 批处理进度，单位百分比。 */
  progress?: number;
  /** 提供撤销上一操作的入口和文字。 */
  undoText?: string;
  /** 显示由调用方处理的全选入口。 */
  showSelectAll?: boolean;
  /** 普通布局、吸顶、吸底或视口下方浮动。 */
  placement?: "inline" | "top" | "bottom" | "floating";
  /** 覆盖文案。selected 支持 {count}，confirmTitle 支持 {action}。 */
  labels?: Partial<{
    selected: string;
    clear: string;
    more: string;
    confirmTitle: string;
    confirm: string;
    cancel: string;
    selectedTotal: string;
    selectAll: string;
  }>;
}
const props = withDefaults(defineProps<HysActionBarProps>(), {
  selectedCount: 0,
  actions: () => [],
  maxVisibleActions: 3,
});
const emit = defineEmits<{
  action: [key: HysMenuKey];
  clearSelection: [];
  /** 用户请求选中全部时发出记录总数，由应用更新选择。 */
  selectAll: [total: number];
  /** 用户激活撤销入口时发出。 */
  undo: [];
}>();
defineSlots<{
  left?: (scope: { selectedCount: number }) => VNodeChild;
  right?: (scope: { selectedCount: number }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const root = useTemplateRef<HTMLElement>("root");
const overflowTrigger = useTemplateRef("overflowTrigger");
const width = useContainerWidth(computed(() => root.value ?? undefined));
const count = computed(() =>
  Number.isFinite(props.selectedCount)
    ? Math.max(0, Math.floor(props.selectedCount))
    : 0,
);
const labels = computed(() => ({
  selected: "已选择 {count} 项",
  clear: "清空选择",
  more: "更多操作",
  confirmTitle: "确认{action}？",
  confirm: "确定",
  cancel: "取消",
  selectedTotal: "已选择 {count} / {total} 项",
  selectAll: "选择全部 {total} 项",
  ...props.labels,
}));
const total = computed(() =>
  Number.isFinite(props.totalCount)
    ? Math.max(0, Math.floor(props.totalCount!))
    : undefined,
);
const canSelectAll = computed(
  () =>
    props.showSelectAll &&
    total.value !== undefined &&
    total.value > count.value,
);
const enabled = (item: HysActionBarItem) => {
  const min = Number.isFinite(item.minSelection)
    ? Math.max(0, Math.floor(item.minSelection!))
    : 1;
  const max = Number.isFinite(item.maxSelection)
    ? Math.max(0, Math.floor(item.maxSelection!))
    : Infinity;
  return (
    !props.loading &&
    !item.disabled &&
    !item.loading &&
    count.value >= min &&
    count.value <= max
  );
};
const all = computed(() => {
  const items = new Map<HysMenuKey, HysActionBarItem>();
  for (const item of props.actions)
    if (!item.hidden && !items.has(item.key)) items.set(item.key, item);
  return [...items.values()];
});
const visible = computed(() => {
  const configured = Number.isFinite(props.maxVisibleActions)
    ? Math.max(0, Math.floor(props.maxVisibleActions))
    : 3;
  const limit =
    width.value > 0 && width.value < 480 ? Math.min(1, configured) : configured;
  return all.value.filter((item) => !item.overflow).slice(0, limit);
});
const overflowActions = computed(() => all.value.filter(item => !visible.value.includes(item)));
const overflow = computed<HysMenuItem[]>(() => {
  const rows: HysMenuItem[] = [];
  const groups = new Map<string, HysMenuItem[]>();
  for (const item of overflowActions.value) {
    const disabled = !enabled(item);
    const row: HysMenuItem = {
      key: item.key,
      label: item.label,
      icon: item.icon,
      shortcut: item.shortcut,
      danger: item.variant === "danger",
      description: disabled ? item.disabledReason : undefined,
      loading: item.loading,
      disabled,
    };
    if (!item.group) { rows.push(row); continue; }
    let group = groups.get(item.group);
    if (!group) {
      group = [];
      groups.set(item.group, group);
      rows.push({ type: "group", label: item.group, children: group });
    }
    group.push(row);
  }
  return rows;
});
const request = shallowRef<{
  key: HysMenuKey;
  count: number;
  anchor: HTMLElement;
}>();
const requestedAction = computed(() => {
  if (
    !request.value ||
    request.value.count !== count.value ||
    !request.value.anchor.isConnected
  )
    return;
  const item = all.value.find((action) => action.key === request.value?.key);
  if (item && enabled(item)) return item;
});
const config = computed(() => {
  const item = requestedAction.value;
  return typeof item?.confirm === "object" ? item.confirm : undefined;
});
watch(requestedAction, (item) => {
  if (!item) request.value = undefined;
});
function activate(item: HysActionBarItem, anchor?: HTMLElement) {
  if (!enabled(item)) return;
  if (item.confirm ?? item.variant === "danger") {
    if (anchor) request.value = { key: item.key, count: count.value, anchor };
  } else emit("action", item.key);
}
function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || event.isComposing ||
    (event.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) return;
  const item = all.value.find(item => enabled(item) && shortcutMatches(event, item.shortcut));
  if (!item) return;
  const anchor = root.value?.querySelector<HTMLElement>('[data-action-order="' + visible.value.indexOf(item) + '"]') ?? overflowTrigger.value?.element;
  event.preventDefault();
  activate(item, anchor);
}
function fromOverflow(key: HysMenuKey) {
  const item = all.value.find((action) => action.key === key);
  if (item) activate(item, overflowTrigger.value?.element);
}
function confirm() {
  const item = requestedAction.value;
  if (item) emit("action", item.key);
}
</script>

<template>
  <section
    v-if="count || visibleWhenEmpty || canSelectAll || undoText || progress !== undefined"
    ref="root"
    v-bind="skin"
    class="hys-action-bar" :data-placement="placement ?? 'inline'" @keydown="keydown"
  >
    <div class="hys-action-bar-selection">
      <span role="status">{{
        (total === undefined ? labels.selected : labels.selectedTotal)
          .replace("{count}", String(count))
          .replace("{total}", String(total))
      }}</span>
      <slot name="left" :selected-count="count" />
      <HysButton
        v-if="count"
        size="sm"
        variant="ghost"
        :disabled="loading"
        @click="emit('clearSelection')"
      >
        {{ labels.clear }}
      </HysButton>
      <HysButton
        v-if="canSelectAll"
        size="sm"
        variant="text"
        :disabled="loading"
        @click="emit('selectAll', total!)"
      >
        {{ labels.selectAll.replace("{total}", String(total)) }}
      </HysButton>
    </div>
    <div class="hys-action-bar-actions">
      <HysProgress v-if="progress !== undefined" class="hys-action-progress" :value="progress" :stroke-width="5" aria-label="批处理进度" />
      <HysButton v-if="undoText" size="sm" variant="text" :disabled="loading" @click="emit('undo')">{{ undoText }}</HysButton>
      <HysTooltip v-for="(item, index) in visible" :key="item.key"
        :disabled="enabled(item) || !item.disabledReason" :text="item.disabledReason"
        :tabindex="!enabled(item) && item.disabledReason ? 0 : undefined">
      <HysButton
        size="sm"
        :variant="item.variant ?? 'secondary'"
        :icon="item.icon"
        :data-action-order="index" :aria-keyshortcuts="item.shortcut"
        :disabled="!enabled(item)"
        :loading="item.loading"
        @click="activate(item, $event.currentTarget as HTMLElement)"
        >{{ item.label }} <kbd v-if="item.shortcut">{{ item.shortcut }}</kbd></HysButton
      >
      </HysTooltip>
      <HysDropdown
        v-if="overflow.length"
        :items="overflow"
        :aria-label="labels.more"
        :disabled="loading"
        @select="fromOverflow"
      >
        <template #trigger="{ disabled }">
          <HysButton
            ref="overflowTrigger"
            size="sm"
            variant="secondary"
            :icon="Ellipsis"
            :disabled="disabled"
            >{{ labels.more }}</HysButton
          >
        </template>
      </HysDropdown>
      <slot name="right" :selected-count="count" />
    </div>
    <HysPopconfirm
      v-if="request && requestedAction"
      trigger="manual"
      :open="true"
      :reference="request.anchor"
      :tone="requestedAction.variant === 'danger' ? 'danger' : 'neutral'"
      :title="
        config?.title ??
        labels.confirmTitle.replace('{action}', requestedAction.label)
      "
      :description="config?.description"
      :confirm-text="config?.confirmText ?? labels.confirm"
      :cancel-text="config?.cancelText ?? labels.cancel"
      @update:open="!$event && (request = undefined)"
      @confirm="confirm"
    />
  </section>
</template>

<style scoped>
.hys-action-bar[data-placement="top"] { position: sticky; top: 0; z-index: 2; }
.hys-action-bar[data-placement="bottom"] { position: sticky; bottom: 0; z-index: 2; }
.hys-action-bar[data-placement="floating"] { position: fixed; inset-inline: max(12px, calc((100% - 720px)/2)); bottom: calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 20; box-shadow: 0 6px 24px #0002; }
.hys-action-bar,
.hys-action-bar-selection,
.hys-action-bar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.hys-action-bar {
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--hys-ui-theme-surface-alt);
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: var(--hys-ui-radius, 8px);
  color: var(--hys-ui-theme-text);
}
.hys-action-progress { min-inline-size: 104px; }
kbd { font-size: .82em; opacity: .7; }
.hys-action-bar-selection > [role="status"] {
  font-weight: 600;
  margin-inline: 2px;
}
</style>
