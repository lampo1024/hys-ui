<script setup lang="ts">
import {
  computed,
  nextTick,
  reactive,
  ref,
  toRefs,
  useTemplateRef,
  watch,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { useHysControlState } from "../../composables/formContext";
import { useChoiceModel } from "../../composables/choiceModel";
import {
  menuKeys,
  menuKeysEqual,
  type HysMenuKey,
} from "../../composables/menu";
import type {
  HysPopupPlacement,
  HysPopupTrigger,
} from "../../composables/popupSurface";
import { usePopupSurface } from "../../composables/usePopupSurface";
import PopupReference from "../../internal/PopupReference";
import PopupSurfacePanel from "../../internal/PopupSurfacePanel.vue";
import type { HysPopupMotionProps } from "../../motion/popup";
import HysButton from "../HysButton/HysButton.vue";
import HysSearch from "../HysSearch/HysSearch.vue";
import { ChevronDown } from "../HysIcon/svgIcons";
import HysMenu, {
  type HysMenuItem,
  type HysMenuSelection,
} from "../HysMenu/HysMenu.vue";

export interface HysDropdownProps extends HysPopupMotionProps {
  /** 操作项、分组和子菜单。可用 default 插槽替换内容。 */
  items?: readonly HysMenuItem[];
  /** 受控浮层状态，支持 v-model:open。 */
  open?: boolean;
  /** 非受控的初始浮层状态。 */
  defaultOpen?: boolean;
  /** 点击或悬停开启，默认 click。悬停模式也支持点击及键盘进入。 */
  trigger?: "click" | "hover";
  /** 优先放置方向，空间不足时由共享浮层重新定位。默认 bottom-end。 */
  placement?: HysPopupPlacement;
  /** 禁止打开菜单。 */
  disabled?: boolean;
  /** 默认触发按钮文字，默认「更多操作」。 */
  label?: string;
  /** 菜单的可访问名称。 */
  ariaLabel?: string;
  /** 菜单最大高度，默认 300px。 */
  maxHeight?: number | string;
  /** 选择后关闭。默认普通操作和单选关闭，多选保持打开。 */
  closeOnSelect?: boolean;
  /** 启用带选中标记的单选或多选菜单。 */
  selectionMode?: "single" | "multiple";
  /** 受控选中键，支持 v-model:selectedKeys。 */
  selectedKeys?: readonly HysMenuKey[];
  /** 非受控选中键初始值，关闭浮层后保留。 */
  defaultSelectedKeys?: readonly HysMenuKey[];
  /** 在菜单上方显示关键词搜索。 */
  searchable?: boolean;
  /** 搜索框占位与可访问名称，默认「搜索选项」。 */
  searchLabel?: string;
  /** 无匹配项时的提示文案。 */
  emptyText?: string;
}

const props = withDefaults(defineProps<HysDropdownProps>(), {
  open: undefined,
  trigger: "click",
  placement: "bottom-end",
  label: "更多操作",
  maxHeight: 300,
  closeOnSelect: undefined,
  searchLabel: "搜索选项",
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [key: HysMenuKey, context: HysMenuSelection];
  /** 单选或多选值变化时发出选中的键。 */
  "update:selectedKeys": [keys: readonly HysMenuKey[]];
}>();
defineSlots<{
  /** 替换触发器，建议返回一个 HysButton。 */
  trigger?: (scope: { open: boolean; disabled: boolean }) => VNodeChild;
  /** 完整替换菜单，提供关闭函数。 */
  default?: (scope: { close: () => Promise<boolean> }) => VNodeChild;
  /** 自定义菜单项标签。 */
  item?: (scope: {
    item: HysMenuItem;
    label: string;
    selected: boolean;
  }) => VNodeChild;
}>();

const skin = useHysRootAttrs();
const { disabled } = useHysControlState(props);
const menu = useTemplateRef("menu");
const custom = useTemplateRef<HTMLElement>("custom");
const searchInput = useTemplateRef("searchInput");
const query = ref("");
const focusRequest = ref<"first" | "last" | "search">();
const defaultFocus = () =>
  props.searchable ? ("search" as const) : ("first" as const);
const selection = useChoiceModel(
  {
    get modelValue() {
      return props.selectedKeys;
    },
  },
  () => menuKeys(props.defaultSelectedKeys),
  menuKeysEqual,
);
const showSelection = computed(() =>
  Boolean(
    props.selectionMode || props.selectedKeys || props.defaultSelectedKeys,
  ),
);
function updateSelection(next: readonly HysMenuKey[]) {
  if (showSelection.value)
    void selection.commit(
      next,
      (keys) => emit("update:selectedKeys", keys),
      () => {},
    );
}
const options = reactive({
  ...toRefs(props),
  trigger: computed<HysPopupTrigger[]>(() =>
    props.trigger === "hover" ? ["hover", "click"] : ["click"],
  ),
  enterable: true,
  hideDelay: 140,
  showDelay: 100,
  maxWidth: "calc(100vw - 16px)",
  ariaLabel: undefined,
});
const surface = usePopupSurface(options, "popover", (event, value) => {
  if (event === "update:open") emit("update:open", value);
});
const menuId = surface.id + "-menu";

function customOptions() {
  return Array.from(
    custom.value?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]):not(:disabled), button:not(:disabled), a[href]',
    ) ?? [],
  ).filter((node) => node.getAttribute("aria-disabled") !== "true");
}
function focusMenu(edge: "first" | "last" | "search") {
  if (edge === "search" && searchInput.value) {
    searchInput.value.focus();
    return;
  }
  if (menu.value) {
    menu.value.focus(edge === "last" ? "last" : "first");
    return;
  }
  const nodes = customOptions();
  ((edge === "last" ? nodes.at(-1) : nodes[0]) ?? custom.value)?.focus();
}
function customKey(event: KeyboardEvent) {
  if (
    event.altKey ||
    event.metaKey ||
    event.ctrlKey ||
    event.isComposing ||
    event.defaultPrevented
  )
    return;
  const nodes = customOptions();
  if (!nodes.length) return;
  const current = nodes.findIndex(
    (node) => node === event.target || node.contains(event.target as Node),
  );
  let target: HTMLElement | undefined;
  if (event.key === "Home") target = nodes[0];
  else if (event.key === "End") target = nodes.at(-1);
  else if (event.key === "ArrowDown")
    target = nodes[(current + 1) % nodes.length];
  else if (event.key === "ArrowUp")
    target =
      nodes[
        (current < 0 ? nodes.length - 1 : current - 1 + nodes.length) %
          nodes.length
      ];
  if (target) {
    event.preventDefault();
    target.focus();
  }
}

watch(
  surface.open,
  (open) => {
    if (!open) {
      focusRequest.value = undefined;
      query.value = "";
    } else if (props.trigger === "click") focusRequest.value ??= defaultFocus();
  },
  { flush: "sync" },
);
watch(
  [surface.open, () => surface.style.value.visibility, focusRequest],
  ([open, visibility, edge]) => {
    if (!open || visibility !== "visible" || !edge) return;
    focusMenu(edge);
    focusRequest.value = undefined;
  },
  { flush: "post" },
);

function activate(event: MouseEvent) {
  if (!surface.open.value || props.trigger === "hover") {
    focusRequest.value = defaultFocus();
  }
  const wasOpen = surface.open.value;
  surface.click(event);
  if (wasOpen && props.trigger === "hover")
    void nextTick(() => {
      if (surface.open.value) focusMenu(defaultFocus());
    });
}

function triggerKey(event: KeyboardEvent) {
  if (disabled.value || event.defaultPrevented || event.isComposing) return;
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const edge = event.key === "ArrowUp" ? "last" : "first";
  focusRequest.value = edge;
  if (surface.open.value) focusMenu(edge);
  else void surface.show();
}

function close() {
  return surface.request(false, true);
}
function select(key: HysMenuKey, context: HysMenuSelection) {
  emit("select", key, context);
  if (props.closeOnSelect ?? props.selectionMode !== "multiple") void close();
}
</script>

<template>
  <span
    :ref="(el) => (surface.wrapper.value = el as HTMLElement)"
    v-bind="{ ...skin, ...surface.wrapperAttrs.value }"
    class="hys-dropdown"
    :aria-haspopup="surface.nativeReference.value ? undefined : 'menu'"
    :aria-controls="
      surface.open.value && !surface.nativeReference.value ? menuId : undefined
    "
    @pointerenter="surface.pointerEnter"
    @pointerleave="surface.pointerLeave"
    @focusin="surface.focusIn"
    @focusout="surface.focusOut"
    @click="activate"
    @keydown="triggerKey"
  >
    <PopupReference
      :id="menuId"
      :open="surface.open.value"
      kind="menu"
      @element="surface.referenceElement.value = $event"
    >
      <slot name="trigger" :open="surface.open.value" :disabled="disabled">
        <HysButton
          variant="secondary"
          :disabled="disabled"
          :icon="ChevronDown"
          icon-position="right"
          >{{ label }}</HysButton
        >
      </slot>
    </PopupReference>

    <PopupSurfacePanel
      :surface="surface"
      :options="options"
      kind="popover"
      panel-role="presentation"
    >
      <div
        v-if="$slots.default"
        :id="menuId"
        ref="custom"
        role="menu"
        :aria-label="ariaLabel ?? label"
        tabindex="-1"
        @keydown="customKey"
      >
        <slot :close="close" />
      </div>
      <div v-else class="hys-dropdown-options">
        <HysSearch
          v-if="searchable"
          ref="searchInput"
          v-model="query"
          class="hys-dropdown-search"
          size="sm"
          :placeholder="searchLabel"
          :aria-label="searchLabel"
          @keydown.down.prevent="focusMenu('first')"
        />
        <HysMenu
          :id="menuId"
          ref="menu"
          :items="items ?? []"
          mode="actions"
          :aria-label="ariaLabel ?? label"
          :max-height="maxHeight"
          :search="query"
          :selection-mode="selectionMode"
          :selected-keys="showSelection ? selection.current.value : undefined"
          :empty-text="emptyText"
          @update:selected-keys="updateSelection"
          @select="select"
        >
          <template v-if="$slots.item" #item="scope"
            ><slot name="item" v-bind="scope"
          /></template>
        </HysMenu>
      </div>
    </PopupSurfacePanel>
  </span>
</template>

<style scoped>
.hys-dropdown {
  display: inline-flex;
  vertical-align: middle;
  position: relative;
  max-width: 100%;
}
.hys-dropdown:focus-visible {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: 3px;
  border-radius: 4px;
}
.hys-dropdown-search {
  inline-size: min(220px, calc(100vw - 50px));
  margin-block-end: 5px;
}
</style>
