<script setup lang="ts">
import { useId, useTemplateRef, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import { useHysControlState } from "../../composables/formContext";
import type { HysMenuKey } from "../../composables/menu";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import MenuItems from "./MenuItems.vue";
import MenuPopupStrip from "./MenuPopupStrip.vue";
import type {
  NavigationMenuItem,
  NavigationMenuMode,
  NavigationMenuProps,
  NavigationMenuSelection,
} from "./menuTypes";
import { useMenuNavigation } from "./useMenuNavigation";

export type HysMenuProps = NavigationMenuProps;
export type HysMenuItem = NavigationMenuItem;
export type HysMenuMode = NavigationMenuMode;
export type HysMenuSelection = NavigationMenuSelection;

const props = withDefaults(defineProps<HysMenuProps>(), { mode: "vertical", overflow: true });
const emit = defineEmits<{
  "update:selectedKeys": [keys: readonly HysMenuKey[]];
  "update:openKeys": [keys: readonly HysMenuKey[]];
  select: [key: HysMenuKey, context: HysMenuSelection];
}>();
defineSlots<{
  /** 自定义每个可操作项的标签，默认使用 label。 */
  item?: (scope: {
    item: HysMenuItem;
    label: string;
    selected: boolean;
  }) => VNodeChild;
  /** 自定义不存在匹配项时显示的内容。 */
  empty?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const { disabled } = useHysControlState(props);
const root = useTemplateRef<HTMLElement>("root");
const id = useId();
const strip = useTemplateRef("strip");
const navigation = useMenuNavigation(props, root, disabled, {
  select: (key, context) => emit("select", key, context),
  expand: (keys) => emit("update:openKeys", keys),
  selectKeys: (keys) => emit("update:selectedKeys", keys),
});
/** 聚焦首个或最后一个可操作项。 */
function focus(edge: "first" | "last" = "first") {
  if (strip.value) strip.value.focus(edge);
  else navigation.focus(edge);
}
defineExpose({ focus });
</script>

<template>
  <component
    :is="mode === 'actions' ? 'div' : 'nav'"
    ref="root"
    v-bind="skin"
    class="hys-menu"
    :role="mode === 'actions' ? 'menu' : undefined"
    :aria-label="ariaLabel ?? (mode === 'actions' ? '操作菜单' : '导航菜单')"
    :tabindex="mode === 'actions' ? -1 : undefined"
    @keydown="!strip && navigation.keydown($event)"
  >
    <MenuPopupStrip v-if="mode !== 'actions' && (mode === 'horizontal' || collapsed)"
      ref="strip" :navigation="navigation" :collapsed="collapsed" :overflow="overflow !== false" :empty-text="emptyText">
      <template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template>
      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    </MenuPopupStrip>
    <HysScrollbar v-else direction="vertical" :max-height="maxHeight">
      <MenuItems
        :rows="navigation.graph.value.roots"
        :actions="mode === 'actions'"
        :selection-mode="selectionMode"
        :id-base="id"
        :depth="0"
        :navigation="navigation"
      >
        <template v-if="$slots.item" #item="scope"
          ><slot name="item" v-bind="scope"
        /></template>
      </MenuItems>
      <div
        v-if="!navigation.graph.value.roots.some(navigation.isShown)"
        class="hys-menu-empty"
        role="status"
      >
        <slot name="empty">{{ emptyText ?? "没有匹配的菜单项" }}</slot>
      </div>
    </HysScrollbar>
  </component>
</template>

<style scoped>
.hys-menu {
  min-width: 0;
  color: var(--hys-ui-theme-text);
  font-size: 13px;
}
.hys-menu-empty {
  padding: 8px 10px;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
</style>
