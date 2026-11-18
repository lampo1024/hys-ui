<script setup lang="ts">
import { computed, defineAsyncComponent, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch, type VNodeChild } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import { ChevronDown, Ellipsis } from "../HysIcon/svgIcons";
import { menuSafeRel, type MenuRow } from "../../composables/menu";
import type { NavigationMenuItem, NavigationMenuSelection } from "./menuTypes";
import type { useMenuNavigation } from "./useMenuNavigation";

type Row = MenuRow<NavigationMenuItem>;
const Dropdown = defineAsyncComponent(() => import("../HysDropdown/HysDropdown.vue"));
const props = defineProps<{ navigation: ReturnType<typeof useMenuNavigation>; collapsed?: boolean; overflow?: boolean; emptyText?: string }>();
defineSlots<{
  item?: (scope: { item: NavigationMenuItem; label: string; selected: boolean }) => VNodeChild;
  empty?: () => VNodeChild;
}>();
const root = ref<HTMLElement>();
function focusable() {
  return Array.from(root.value?.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]") ?? []).filter(node => !node.closest("[inert]"));
}
function focus(edge: "first" | "last" = "first") {
  const targets = focusable();
  (edge === "last" ? targets.at(-1) : targets[0])?.focus();
}
function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const targets = focusable();
  const at = targets.indexOf(event.target as HTMLElement);
  if (at < 0 || !targets.length) return;
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    focus(event.key === "End" ? "last" : "first");
    return;
  }
  const rtl = root.value && getComputedStyle(root.value).direction === "rtl";
  const next = props.collapsed ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const prev = props.collapsed ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  if (event.key !== next && event.key !== prev) return;
  event.preventDefault();
  targets[(at + (event.key === next ? 1 : -1) + targets.length) % targets.length]?.focus();
}
defineExpose({ focus });
const rows = computed(() => {
  function collect(source: readonly Row[]): Row[] {
    return source.filter(props.navigation.isShown).flatMap(row => row.type === "group" ? collect(row.children) : row.type === "item" ? [row] : []);
  }
  return collect(props.navigation.graph.value.roots);
});
const fitting = ref(Infinity);
const responsive = computed(() => !props.collapsed && props.overflow);
const overflowRows = computed(() => rows.value.slice(fitting.value));
const activeKeys = computed(() => props.navigation.graph.value.all.flatMap(
  row => row.key !== undefined && props.navigation.isSelected(row) ? [row.key] : [],
));
function badge(row: Row) {
  return "badge" in row.raw ? row.raw.badge : undefined;
}
function label(row: Row) {
  const count = badge(row);
  return count == null ? row.label : row.label + " · " + count;
}
function current(row: Row) {
  return props.navigation.isSelected(row) || props.navigation.isActiveBranch(row);
}
let observer: ResizeObserver | undefined;
function measure() {
  const list = root.value;
  if (!list || !responsive.value) { fitting.value = Infinity; return; }
  const widths = Array.from(list.querySelectorAll<HTMLElement>(":scope > .cell")).map(cell => cell.offsetWidth);
  const available = list.clientWidth - 6;
  const total = widths.reduce((width, cell) => width + cell + 4, -4);
  if (total <= available) { fitting.value = Infinity; return; }
  let space = available - 50;
  let count = 0;
  for (const width of widths) {
    if (width + 4 > space) break;
    space -= width + 4;
    count++;
  }
  fitting.value = count;
}
function observe() {
  observer?.disconnect();
  const list = root.value;
  if (!list) return;
  measure();
  if (typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(measure);
  observer.observe(list);
  for (const node of list.querySelectorAll(":scope > .cell")) observer.observe(node);
}
onMounted(observe);
onActivated(observe);
onDeactivated(() => observer?.disconnect());
onBeforeUnmount(() => observer?.disconnect());
watch([rows, responsive], observe, { flush: "post" });
function item(row: Row): NavigationMenuItem {
  return "children" in row.raw
    ? { ...row.raw, disabled: props.navigation.isDisabled(row), children: content(row) }
    : "key" in row.raw ? { ...row.raw, disabled: props.navigation.isDisabled(row) } : row.raw;
}
function content(row: Row): NavigationMenuItem[] {
  return row.children.filter(props.navigation.isShown).map(item);
}
function href(row: Row) {
  const value = row.href?.trim();
  if (!value || props.navigation.isDisabled(row)) return;
  const scheme = value.replace(/[\u0000-\u0020]/gu, "").match(/^([a-z][a-z\d+.-]*):/iu)?.[1]?.toLowerCase();
  if (!scheme || ["http", "https", "mailto", "tel"].includes(scheme)) return value;
}
function select(key: string | number, context: NavigationMenuSelection) {
  const row = props.navigation.graph.value.all.find(row => row.key === key);
  if (row) props.navigation.choose(row, context.event);
}
</script>
<template>
  <ul ref="root" class="strip" @keydown="keydown" :class="{ compact: collapsed, responsive }">
    <li v-for="(row, index) in rows" :key="row.id" class="cell" :inert="index >= fitting || undefined">
      <Dropdown v-if="navigation.hasChildren(row)" :items="content(row)" :disabled="navigation.isDisabled(row)"
        :placement="collapsed ? 'right-start' : 'bottom-start'" :trigger="collapsed ? 'hover' : 'click'" :aria-label="row.label"
        :selected-keys="activeKeys" @select="select">
        <template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template>
        <template #trigger>
          <HysButton size="sm" variant="ghost" :disabled="navigation.isDisabled(row)" :icon="row.icon ?? ChevronDown"
            :aria-label="collapsed ? label(row) : undefined" :class="{ current: current(row) }">
            <slot v-if="!collapsed" name="item" :item="row.raw" :label="row.label" :selected="navigation.isSelected(row)">{{ row.label }}</slot>
            <span v-if="badge(row) != null" class="badge">{{ badge(row) }}</span>
          </HysButton>
        </template>
      </Dropdown>
      <HysTooltip v-else :disabled="!collapsed" :text="label(row)">
        <component :is="href(row) ? 'a' : HysButton" class="leaf" :class="{ current: navigation.isSelected(row) }"
          :href="href(row)" :target="href(row) ? row.target : undefined" :rel="href(row) ? menuSafeRel(row.target, row.rel) : undefined"
          :icon="href(row) ? undefined : row.icon" :disabled="href(row) ? undefined : navigation.isDisabled(row)"
          variant="ghost" size="sm" :aria-current="navigation.isSelected(row) ? 'page' : undefined" :aria-label="collapsed ? label(row) : undefined"
          @click="navigation.choose(row, $event)">
          <component v-if="href(row) && row.icon" :is="row.icon" class="icon" aria-hidden="true" />
          <slot v-if="!collapsed" name="item" :item="row.raw" :label="row.label" :selected="navigation.isSelected(row)">{{ row.label }}</slot>
          <template v-else-if="!row.icon">{{ row.label.slice(0, 1) }}</template>
          <span v-if="badge(row) != null" class="badge">{{ badge(row) }}</span>
        </component>
      </HysTooltip>
    </li>
    <li v-if="overflowRows.length" class="more">
      <Dropdown aria-label="更多导航" placement="bottom-end" :items="overflowRows.map(item)" :selected-keys="activeKeys" @select="select">
        <template #trigger><HysButton :icon="Ellipsis" variant="ghost" size="sm" aria-label="更多导航" :class="{ current: overflowRows.some(current) }" /></template>
        <template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template>
      </Dropdown>
    </li>
    <li v-if="!rows.length" class="empty" role="status">
      <slot name="empty">{{ emptyText ?? "没有匹配的菜单项" }}</slot>
    </li>
  </ul>
</template>
<style scoped>
.strip { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 3px; margin: 0; list-style: none; }
.strip.responsive { position: relative; flex-wrap: nowrap; }
.strip.responsive .cell { flex: none; white-space: nowrap; }
.cell[inert] { position: absolute; visibility: hidden; pointer-events: none; }
.strip.compact { flex-flow: column nowrap; align-items: stretch; }
.cell { display: flex; align-items: center; }
.badge {
  margin-inline-start: 5px;
  padding-inline: 5px;
  border-radius: 5px;
  background: var(--hys-ui-theme-surface-alt);
  color: var(--hys-ui-theme-muted);
  font-size: 11px;
}
.compact .leaf, .compact .cell :deep(.hys-ui-btn) { position: relative; }
.compact .badge { position: absolute; inset-block-start: 0; inset-inline-end: 0; margin: 0; font-size: 9px; }
.empty { padding: 8px; color: var(--hys-ui-theme-muted); overflow-wrap: anywhere; }
.compact .cell { justify-content: center; }
.leaf { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 30px; }
a.leaf { padding: 4px 8px; text-decoration: none; color: var(--hys-ui-theme-text); border-radius: var(--hys-ui-radius, 8px); }
a.leaf:hover { background: var(--hys-ui-theme-surface-alt); }
.current { color: var(--hys-ui-theme-primary) !important; }
.icon { width: 16px; height: 16px; }
</style>
