<script setup lang="ts" generic="N extends object = HysContextMenuItem">
import {
  computed,
  onUpdated,
  ref,
  useAttrs,
  useId,
  type CSSProperties,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { useContextMenu } from "../../composables/useContextMenu";
import type {
  HysContextMenuItem,
  HysContextMenuProps,
  HysContextMenuSlots,
  HysMenuKey,
  HysMenuSelectInfo,
} from "../../composables/menu";
import PopupMotion from "../../motion/PopupMotion";
import HysMenuPanel from "./HysMenuPanel.vue";
import HysMenuSlot from "./HysMenuSlot";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysContextMenuProps<N>>(), {
  trigger: "contextmenu",
  open: undefined,
  items: () => [],
  hideOnClick: true,
  autofocus: true,
  loopNavigation: true,
  placement: "bottom-start",
  appendTo: "body",
  minWidth: 190,
  maxWidth: 360,
  maxHeight: 320,
  submenuTrigger: "hover",
  direction: "ltr",
  emptyText: "暂无操作",
  loadingText: "加载中…",
  backText: "返回",
  ariaLabel: "操作菜单",
});
const slots = defineSlots<HysContextMenuSlots<N>>();
const forwarded = computed(() =>
  (["item", "icon", "link", "empty", "loading"] as const).filter(
    (name) => !!slots[name],
  ),
);
const emit = defineEmits<{
  select: [
    value: N extends { value: infer V extends HysMenuKey } ? V : HysMenuKey,
    info: HysMenuSelectInfo<N>,
  ];
  "update:open": [value: boolean];
  visibleChange: [value: boolean];
  "update:openPath": [value: HysMenuKey[]];
  openPathChange: [value: HysMenuKey[]];
  "update:checkedKeys": [value: HysMenuKey[]];
  checkedChange: [value: HysMenuKey[], info?: HysMenuSelectInfo<N>];
  "update:selectedKeys": [value: HysMenuKey[]];
  selectionChange: [value: HysMenuKey[], info?: HysMenuSelectInfo<N>];
}>();
const root = ref<HTMLElement>(),
  layer = ref<HTMLElement>(),
  panel = ref<HTMLElement>(),
  id = "hys-menu-" + useId(),
  skin = useHysRootAttrs(),
  attrs = useAttrs();
const menu = useContextMenu(
  props,
  root,
  layer,
  panel,
  id,
  emit as (name: string, ...args: any[]) => void,
);
onUpdated(menu.measureTrigger);
const triggerAttrs = computed(() => ({
  "aria-haspopup": "menu" as const,
  "aria-expanded": menu.open.value,
  "aria-controls": menu.open.value ? id + "-menu-0" : undefined,
  "aria-disabled": menu.control.disabled.value || undefined,
  ...(menu.control.disabled.value ? { tabindex: -1 } : {}),
}));
const scope = computed(() => ({
  open: menu.open.value,
  show: menu.show,
  hide: menu.hide,
  toggle: menu.toggle,
  attrs: triggerAttrs.value,
}));
const finite = (value: number, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const maximum = computed(() => finite(props.maxWidth, 360, 80, 1600));
const bounds = computed<CSSProperties>(() => ({
  "--hys-ui-menu-min-width":
    finite(props.minWidth, 190, 80, maximum.value) + "px",
  "--hys-ui-menu-max-width": maximum.value + "px",
  "--hys-ui-menu-max-height": finite(props.maxHeight, 320, 80, 1600) + "px",
}));
function assign(level: number, value: unknown) {
  menu.setPanel(level, (value as { element?: HTMLElement } | null)?.element);
}
function surfaceStyle(level: number): CSSProperties {
  return {
    ...props.popupStyle,
    ...(level
      ? (menu.childStyles.value[level] ?? {
          position: "fixed",
          visibility: "hidden",
        })
      : menu.floating.style.value),
    ...bounds.value,
  };
}
defineExpose({
  element: root,
  open: menu.open,
  checkedKeys: menu.checkedKeys,
  selectedKeys: menu.selectedKeys,
  openPath: menu.openPath,
  focus: menu.focus,
  blur: () => {
    void menu.hide();
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (root.value?.contains(active) || layer.value?.contains(active))
    )
      active.blur();
  },
  show: menu.show,
  showAt: (x: number, y: number, focus = true) => menu.show({ x, y, focus }),
  hide: menu.hide,
  handleOpen: () => menu.show(),
  handleClose: menu.hide,
  toggle: menu.toggle,
  focusItem: menu.focusItem,
  openSubmenu: menu.openSubmenu,
  closeSubmenus: menu.closeSubmenus,
  setCheckedKeys: menu.setCheckedKeys,
  setSelectedKeys: menu.setSelectedKeys,
  getItems: menu.getItems,
});
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...skin, ...attrs, ...triggerAttrs }"
    class="hys-ui-menu-trigger"
    :class="{
      'hys-ui-menu-inline': !menu.triggers.value.includes('contextmenu'),
      'hys-ui-menu-disabled': menu.control.disabled.value,
    }"
    :tabindex="
      menu.control.disabled.value
        ? -1
        : menu.focusableChild.value
          ? undefined
          : 0
    "
    @contextmenu="menu.contextmenu"
    @click="menu.triggerClick"
    @keydown="menu.triggerKey"
    @pointerenter="menu.hoverRoot(true, $event)"
    @pointerleave="menu.hoverRoot(false, $event)"
    @focusin="menu.triggerFocus"
    @focusout="menu.focusOut"
  >
    <HysMenuSlot
      :content="$slots.default"
      :scope="scope"
      :node-attrs="triggerAttrs"
    />
  </div>
  <Teleport
    :to="appendTo === false ? 'body' : appendTo"
    :disabled="appendTo === false"
  >
    <div
      ref="layer"
      class="hys-ui-menu-layer"
      :style="{ zIndex: menu.floating.style.value.zIndex }"
      @pointerenter="menu.enterPanel"
      @pointerleave="menu.hoverRoot(false, $event)"
      @focusout="menu.focusOut"
    >
      <PopupMotion
        v-for="(rows, level) in menu.menus.value"
        :key="level"
        :popup-transition="popupTransition"
        :popup-transition-duration="popupTransitionDuration"
        :placement="
          level
            ? direction === 'rtl'
              ? 'left'
              : 'right'
            : menu.floating.placement.value
        "
        @inactive="menu.forceHide"
        @entered="menu.scheduleLayout(true)"
      >
        <HysMenuPanel
          v-if="menu.open.value && menu.live.value"
          :ref="(value) => assign(level, value)"
          v-bind="skin"
          :class="[
            popupClass,
            {
              'hys-ui-menu-covered': level < menu.menus.value.length - 1,
              'hys-ui-menu-arrow': !level && arrow,
            },
          ]"
          :data-size="menu.control.size.value"
          :data-level="level"
          :data-placement="level ? 'right' : menu.floating.placement.value"
          :style="surfaceStyle(level)"
          :rows="rows"
          :level="level"
          :id="id + '-menu-' + level"
          :root-id="id"
          :label="
            level
              ? menu.branches.value[level - 1]?.label || ariaLabel
              : ariaLabel
          "
          :parent-label="menu.branches.value[level - 1]?.label"
          :busy="menu.busy.value"
          :loading="!!loading"
          :direction="direction"
          :empty-text="emptyText"
          :loading-text="loadingText"
          :back-text="backText"
          :context="menu.context"
          :tabbable="menu.tabbable"
          @choose="menu.choose"
          @focus-row="(row) => menu.setActive(row)"
          @hover-row="menu.hoverRow"
          @keyboard="menu.keyboard(level, $event)"
          @back="menu.setPath(menu.openPath.value.slice(0, level - 1), true)"
          @scroll="menu.scheduleLayout()"
        >
          <template v-for="name in forwarded" #[name]="slotScope"
            ><slot :name="name" v-bind="slotScope || {}"
          /></template>
          <template v-if="!level && $slots.header" #header
            ><slot name="header" :close="() => menu.hide()"
          /></template>
          <template v-if="!level && $slots.footer" #footer
            ><slot name="footer" :close="() => menu.hide()"
          /></template>
        </HysMenuPanel>
      </PopupMotion>
    </div>
  </Teleport>
</template>
<style scoped>
.hys-ui-menu-trigger {
  max-width: 100%;
  outline: none;
}
.hys-ui-menu-trigger:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
  border-radius: 7px;
}
.hys-ui-menu-inline {
  display: inline-block;
  vertical-align: middle;
}
.hys-ui-menu-disabled {
  opacity: 0.55;
}
.hys-ui-menu-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.hys-ui-menu-arrow::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 16px;
  width: 8px;
  height: 8px;
  background: inherit;
  border-top: inherit;
  border-left: inherit;
  transform: rotate(45deg);
  pointer-events: none;
}
.hys-ui-menu-arrow[data-placement$="end"]::before {
  left: auto;
  right: 16px;
}
.hys-ui-menu-arrow[data-placement^="top"]::before {
  top: auto;
  bottom: -5px;
  transform: rotate(225deg);
}
.hys-ui-menu-arrow[data-placement="right"]::before {
  left: -5px;
  top: 18px;
  transform: rotate(-45deg);
}
.hys-ui-menu-arrow[data-placement="left"]::before {
  left: auto;
  right: -5px;
  top: 18px;
  transform: rotate(135deg);
}
@media (max-width: 650px) {
  .hys-ui-menu-covered {
    visibility: hidden !important;
    pointer-events: none !important;
  }
}
</style>
