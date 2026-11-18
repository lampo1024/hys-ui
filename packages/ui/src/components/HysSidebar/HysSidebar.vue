<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysDrawer from "../HysDrawer/HysDrawer.vue";
import HysMenu, { type HysMenuItem, type HysMenuSelection } from "../HysMenu/HysMenu.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysSearch from "../HysSearch/HysSearch.vue";
import HysResizablePanel from "../HysResizablePanel/HysResizablePanel.vue";
import { Menu } from "../HysIcon/svgIcons";

type Key = string | number;
export interface HysSidebarProps {
  /** 菜单项，沿用 HysMenu 的树形结构。 */
  items: readonly HysMenuItem[];
  /** 内嵌、固定在视口起始侧或由抽屉承载。 */
  placement?: "inline" | "fixed" | "drawer";
  /** 视口宽度不超过该像素数时切到抽屉。 */
  drawerAt?: number;
  /** 当前路由路径，透传给 HysMenu 用于高亮。 */
  activePath?: string;
  /** 受控收起状态，配合 v-model:collapsed。 */
  collapsed?: boolean;
  /** 非受控初始收起状态。 */
  defaultCollapsed?: boolean;
  /** 抽屉的受控显示状态。 */
  open?: boolean;
  /** 完整模式宽度，单位像素，默认 240。启用宽度调节时范围为 180–640。 */
  width?: number;
  /** 在完整导航中显示搜索。 */
  searchable?: boolean;
  /** 在展开的内嵌或固定导航上启用键盘与拖拽宽度调节。 */
  resizable?: boolean;
  /** 非受控模式下记忆折叠状态。不同导航使用不同的存储键。 */
  storageKey?: string;
  /** 窄模式宽度，单位像素，默认 64。 */
  collapsedWidth?: number;
  /** 受控选中的菜单键。 */
  selectedKeys?: readonly Key[];
  /** 受控展开的菜单键。 */
  openKeys?: readonly Key[];
  /** 导航名称和抽屉标题。 */
  title?: string;
}
const props = withDefaults(defineProps<HysSidebarProps>(), {
  placement: "inline", collapsedWidth: 64, title: "侧边导航", collapsed: undefined, open: undefined,
});
const emit = defineEmits<{
  /** 点击折叠入口时请求更新。 */
  "update:collapsed": [collapsed: boolean];
  /** 抽屉打开或关闭时发出。 */
  "update:open": [open: boolean];
  /** 调整导航宽度时发出像素值。 */
  "update:width": [width: number];
  /** 菜单选中键变化时发出。 */
  "update:selectedKeys": [keys: readonly Key[]];
  /** 菜单展开键变化时发出。 */
  "update:openKeys": [keys: readonly Key[]];
  /** 激活叶子项时发出键和菜单上下文。 */
  select: [key: Key, context: HysMenuSelection];
}>();
defineSlots<{
  /** 标题或工作区入口，含当前折叠状态。 */
  header?: (scope: { collapsed: boolean }) => VNodeChild;
  /** 位于菜单底部，用于用户信息或快捷入口。 */
  footer?: (scope: { collapsed: boolean }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const localCollapsed = ref(!!props.defaultCollapsed);
const localOpen = ref(false);
const localSelected = ref<readonly Key[]>([]);
const localExpanded = ref<readonly Key[]>([]);
const query = ref("");
const narrow = ref(false);
const placement = computed(() => narrow.value ? "drawer" : props.placement);
let media: MediaQueryList | undefined;
function viewportChanged() { narrow.value = media?.matches ?? false; }
function observeWidth() {
  media?.removeEventListener("change", viewportChanged);
  media = typeof window.matchMedia === "function" && Number.isFinite(props.drawerAt)
    ? window.matchMedia("(max-width: " + Math.max(0, props.drawerAt!) + "px)") : undefined;
  media?.addEventListener("change", viewportChanged);
  viewportChanged();
}
onMounted(observeWidth);
onBeforeUnmount(() => media?.removeEventListener("change", viewportChanged));
watch(() => props.drawerAt, observeWidth);
const localWidth = ref(240);
const wide = computed(() => {
  const width = props.width ?? localWidth.value;
  const minimum = props.resizable ? 180 : 44;
  return Number.isFinite(width) ? Math.max(minimum, Math.min(640, width)) : 240;
});
onMounted(() => {
  if (props.collapsed !== undefined || !props.storageKey) return;
  try {
    const saved = localStorage.getItem(props.storageKey);
    if (saved === "1" || saved === "0") localCollapsed.value = saved === "1";
  } catch { /* Storage is optional. */ }
});
function resize(width: number) {
  localWidth.value = width;
  emit("update:width", width);
}
const compact = computed(() => placement.value !== "drawer" && (props.collapsed ?? localCollapsed.value));
const shown = computed(() => props.open ?? localOpen.value);
const widthPx = computed(() => Math.max(44, Math.min(640, compact.value ? props.collapsedWidth : wide.value)) + "px");
function toggle() {
  localCollapsed.value = !compact.value;
  emit("update:collapsed", localCollapsed.value);
  if (props.collapsed === undefined && props.storageKey) {
    try { localStorage.setItem(props.storageKey, localCollapsed.value ? "1" : "0"); } catch { /* Storage is optional. */ }
  }
}
watch(compact, (compact) => { if (compact) query.value = ""; });
function setOpen(open: boolean) {
  localOpen.value = open;
  emit("update:open", open);
}
function selectKeys(keys: readonly Key[]) {
  localSelected.value = keys;
  emit("update:selectedKeys", keys);
}
function expandKeys(keys: readonly Key[]) {
  localExpanded.value = keys;
  emit("update:openKeys", keys);
}

function select(key: Key, context: HysMenuSelection) {
  emit("select", key, context);
  if (placement.value === "drawer") setOpen(false);
}
</script>
<template>
  <div v-bind="skin" class="hys-sidebar-shell" :class="'placement-' + placement" :style="{ '--hys-sidebar-width': widthPx }">
    <HysButton v-if="placement === 'drawer'" variant="secondary" :icon="Menu" :aria-expanded="shown" @click="setOpen(true)">{{ title }}</HysButton>
    <HysDrawer v-if="placement === 'drawer'" :open="shown" placement="left" :title="title" :width="widthPx" @update:open="setOpen">
      <slot name="header" :collapsed="false" />
      <HysSearch v-if="searchable" v-model="query" class="drawer-search" placeholder="搜索导航" aria-label="搜索导航" size="sm" />
      <HysMenu :items="items" :search="query" :active-path="activePath" :selected-keys="selectedKeys" :open-keys="openKeys" :aria-label="title"
        :default-selected-keys="localSelected" :default-open-keys="localExpanded"
        @update:selected-keys="selectKeys" @update:open-keys="expandKeys" @select="select" />
      <slot name="footer" :collapsed="false" />
    </HysDrawer>
    <component :is="resizable && !compact ? HysResizablePanel : 'div'" v-else class="sizing"
      v-bind="resizable && !compact ? { modelValue: wide, minWidth: 180, maxWidth: 640, resizeLabel: '调整导航宽度' } : {}"
      @update:model-value="resize">
    <aside class="sidebar" :aria-label="title">
      <div class="head">
        <slot name="header" :collapsed="compact"><strong v-if="!compact">{{ title }}</strong></slot>
        <HysButton variant="ghost" size="sm" :icon="Menu" :aria-label="compact ? '展开导航' : '收起导航'" :aria-expanded="!compact" @click="toggle" />
      </div>
      <HysSearch v-if="searchable && !compact" v-model="query" class="sidebar-search" placeholder="搜索导航" aria-label="搜索导航" size="sm" />
      <HysScrollbar class="scroll" direction="vertical">
        <HysMenu :items="items" :search="query" :active-path="activePath" :selected-keys="selectedKeys" :open-keys="openKeys" :aria-label="title" :collapsed="compact"
          :default-selected-keys="localSelected" :default-open-keys="localExpanded"
        @update:selected-keys="selectKeys" @update:open-keys="expandKeys" @select="select" />
      </HysScrollbar>
      <div v-if="$slots.footer" class="foot"><slot name="footer" :collapsed="compact" /></div>
    </aside>
    </component>
  </div>
</template>
<style scoped>
.hys-sidebar-shell { inline-size: var(--hys-sidebar-width); max-inline-size: 100%; min-width: 0; }
.placement-fixed { position: fixed; inset-block: 0; inset-inline-start: 0; z-index: 10; }
.placement-drawer { inline-size: auto; }
.sidebar { display: flex; flex-direction: column; height: 100%; max-height: 100dvh; min-height: 0; color: var(--hys-ui-theme-text); background: var(--hys-ui-theme-surface); border: 1px solid var(--hys-ui-theme-border); border-radius: var(--hys-ui-radius, 8px); }
.head, .foot { display: flex; align-items: center; gap: 8px; justify-content: space-between; padding: 8px; overflow-wrap: anywhere; }
 .sizing { height: 100%; }
.sidebar-search { margin: 4px 10px 8px; }
.drawer-search { margin-block-end: 10px; }
.scroll { flex: 1; min-height: 0; }
.scroll :deep(.hys-ui-scrollbar-viewport) { max-height: min(60dvh, 400px); }
.placement-fixed .scroll :deep(.hys-ui-scrollbar-viewport) { max-height: 100%; }
</style>
