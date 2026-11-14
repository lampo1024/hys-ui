<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useId,
  watch,
  type CSSProperties,
} from "vue";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  LoaderCircle,
  Pin,
  Plus,
  Star,
  X,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../../config";
import { useContainerWidth } from "../../../composables/useContainerWidth";
import { useMotion } from "../../../motion/useMotion";
import type { HysContextMenuItem } from "../../../composables/menu";
import TabsPanels from "../TabsPanels/TabsPanels.vue";
import TabsSlot from "../TabsSlot/TabsSlot";
import {
  bounded,
  tabIdToken,
  tabLength,
  tabToken,
  type TabDeclaration,
} from "../tabsItems";
import { useTabsPersistence } from "../tabsPersistence";
import { useTabsNav } from "../useTabsNav";
import { useTabsOverlays } from "../useTabsOverlays";
import { useTabsPanels } from "../useTabsPanels";
import { useTabsPointer } from "../useTabsPointer";
import { useTabsState } from "../useTabsState";
import type {
  HysTabItem,
  HysTabMenuAction,
  HysTabScope,
  HysTabSource,
  HysTabsProps,
  HysTabsSlots,
  HysTabValue,
  TabsEmit,
} from "../tabsTypes";

const props = defineProps<{
  options: HysTabsProps;
  declarations: TabDeclaration[];
  declarative: boolean;
  slots: HysTabsSlots;
  emit: TabsEmit;
}>();
const settings = () => props.options;
const TabsMore = defineAsyncComponent(() => import("../TabsMore/TabsMore.vue"));
const skin = useHysRootAttrs(),
  id = useId();
const root = ref<HTMLElement>(),
  header = ref<HTMLElement>();
const {
  menu,
  prompts,
  menuComponent,
  promptComponent,
  showMenu,
  closeMenu,
  prompt,
} = useTabsOverlays(props.emit);
const width = useContainerWidth(root);
const placement = computed(() => {
  const wanted =
    props.options.placement ?? (props.options.vertical ? "left" : "top");
  return props.options.responsive &&
    width.value > 0 &&
    width.value < bounded(props.options.breakpoint, 560, 2400) &&
    (wanted === "left" || wanted === "right")
    ? "top"
    : wanted;
});
const vertical = computed(
  () => placement.value === "left" || placement.value === "right",
);
const { effectiveMotion } = useMotion();
const motion = computed(
  () => props.options.animated !== false && effectiveMotion.value !== "off",
);
const declarativeMode = computed(
  () => props.declarative || props.declarations.length > 0,
);
const state = useTabsState(
  settings,
  () => props.declarations.map((entry) => entry.item),
  () => declarativeMode.value,
  props.emit,
  async (items, signal) => (await prompt())?.confirm(items, signal) ?? false,
);
const active = state.active,
  items = state.visible;
const panels = useTabsPanels(
  settings,
  () => items.value,
  () => active.value,
  props.emit,
);
const nav = useTabsNav(
  settings,
  () => items.value,
  () => active.value,
  () => vertical.value,
  () => motion.value,
  (step, source) => stepTab(step, source),
);
const navElement = nav.nav,
  track = nav.track;
const persistence = useTabsPersistence(
  settings,
  state,
  () => navElement.value,
  props.emit,
);
const byToken = computed(
  () => new Map(items.value.map((item) => [tabToken(item.value), item])),
);
const declarationSlots = computed(
  () =>
    new Map(props.declarations.map((entry) => [entry.item.value, entry.slots])),
);
const tabId = (value: HysTabValue) => id + "-tab-" + tabIdToken(value);
const panelId = (value: HysTabValue) => id + "-panel-" + tabIdToken(value);
const focused = ref<HysTabValue>(),
  preview = ref<HysTabValue>(),
  context = ref<HysTabValue>();
const roving = computed(() => {
  const keys = state.enabled.value;
  return (
    keys.find((item) => item.value === focused.value)?.value ??
    keys.find((item) => item.value === active.value)?.value ??
    keys[0]?.value
  );
});
const hasPanels = computed(
  () =>
    declarativeMode.value ||
    !!props.options.workbench ||
    !!props.slots.empty ||
    !!props.slots.panel ||
    items.value.some(
      (item) => item.load || item.component || item.content !== undefined,
    ),
);
const panelVisible = computed(() => hasPanels.value || !!props.slots.default);
const contextItem = computed(() =>
  context.value === undefined
    ? undefined
    : state.byKey.value.get(context.value),
);
const previewItem = computed(() =>
  preview.value === undefined
    ? undefined
    : state.byKey.value.get(preview.value),
);
const menusEnabled = computed(
  () =>
    props.options.contextMenu ??
    props.options.workbench ??
    !!props.slots.contextmenu,
);
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
function clearHover() {
  clearTimeout(hoverTimer);
  if (preview.value !== undefined) {
    preview.value = undefined;
    props.emit("previewChange", undefined);
  }
}
function hover(item: HysTabItem, event: PointerEvent) {
  if (
    event.pointerType === "touch" ||
    item.disabled ||
    props.options.disabled ||
    item.value === active.value
  )
    return;
  clearHover();
  if (props.options.trigger !== "hover" && !props.options.preview) return;
  hoverTimer = setTimeout(
    () => {
      if (props.options.preview && props.options.trigger !== "hover") {
        preview.value = item.value;
        props.emit("previewChange", item.value);
      } else void state.select(item.value, "hover");
    },
    bounded(props.options.hoverDelay, props.options.preview ? 180 : 0, 5000),
  );
}
function focus(value = active.value) {
  const tab =
    state.enabled.value.find((item) => item.value === value) ??
    state.enabled.value[0];
  if (tab) {
    focused.value = tab.value;
    nav.focus(tab.value);
  }
}
function clicked(item: HysTabItem, event: MouseEvent) {
  if (props.options.disabled || item.disabled) return;
  clearHover();
  props.emit("tabClick", item.value, event);
  void state.select(item.value, "click");
}
function stepTab(step: number, source: HysTabSource) {
  const list = state.enabled.value;
  if (!list.length) return;
  const at = list.findIndex((item) => item.value === active.value);
  const next =
    list[
      at < 0
        ? step > 0
          ? 0
          : list.length - 1
        : (at + step + list.length) % list.length
    ];
  void state.select(next.value, source);
}
async function closeFocused(value: HysTabValue = active.value) {
  const hadFocus =
    !!navElement.value?.contains(document.activeElement) || !!menu.value?.open;
  const result = await state.close(value);
  if (hadFocus && result && !state.byKey.value.has(value))
    await nextTick(() => focus());
  return result;
}
async function closeBatch(action: HysTabMenuAction, item: HysTabItem) {
  if (
    action !== "left" &&
    action !== "right" &&
    action !== "others" &&
    action !== "all"
  )
    return;
  const hadFocus = !!menu.value?.open;
  await state.closeMany(action, item.value);
  if (hadFocus && !state.byKey.value.has(item.value))
    await nextTick(() => focus());
}
function openContext(
  item: HysTabItem,
  event: MouseEvent | KeyboardEvent | PointerEvent,
) {
  if (props.options.disabled || item.disabled) return;
  props.emit("tabContextmenu", item.value, event);
  if (!menusEnabled.value) return;
  event.preventDefault();
  context.value = item.value;
  focus(item.value);
  const rect = nav.button(item.value)?.getBoundingClientRect();
  const point =
    event instanceof MouseEvent &&
    event.type !== "keydown" &&
    (event.clientX || event.clientY)
      ? { x: event.clientX, y: event.clientY }
      : { x: rect?.left ?? 0, y: rect?.bottom ?? 0 };
  void showMenu(point);
}
const pointer = useTabsPointer(
  settings,
  nav,
  (token) => byToken.value.get(token),
  state.canMove,
  state.move,
  () => vertical.value,
  (item, event) => {
    props.emit("tabLongpress", item.value, event);
    openContext(item, event);
  },
  (step) => stepTab(step, "swipe"),
  () => motion.value,
);
const ghostElement = pointer.ghostElement;
const ownsGesture = (event: PointerEvent) =>
  (event.target as Element).closest(".hys-ui-tabs-root") === root.value;
function keydown(event: KeyboardEvent) {
  const element = (event.target as HTMLElement).closest<HTMLElement>(
    '[role="tab"]',
  );
  if ((event.target as HTMLElement).closest(".hys-ui-tab-close")) return;
  const value =
    (element?.dataset.tabKey &&
      byToken.value.get(element.dataset.tabKey)?.value) ??
    focused.value ??
    active.value;
  const list = state.enabled.value,
    at = list.findIndex((item) => item.value === value);
  const item = list[at];
  const keys = vertical.value
    ? ["ArrowUp", "ArrowDown"]
    : nav.rtl()
      ? ["ArrowRight", "ArrowLeft"]
      : ["ArrowLeft", "ArrowRight"];
  if (
    item &&
    (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))
  ) {
    openContext(item, event);
    return;
  }
  if (event.key === "Delete" && item && state.canClose(item)) {
    event.preventDefault();
    void closeFocused(item.value);
    return;
  }
  if (
    props.options.shortcuts &&
    event.altKey &&
    event.shiftKey &&
    ["PageUp", "PageDown"].includes(event.key)
  ) {
    event.preventDefault();
    stepTab(event.key === "PageUp" ? -1 : 1, "keyboard");
    return;
  }
  if (props.options.shortcuts && item && event.key === "F2") {
    event.preventDefault();
    void renamePrompt(item);
    return;
  }
  if (
    element &&
    (event.key === "Enter" || event.key === " ") &&
    props.options.activation === "manual"
  ) {
    event.preventDefault();
    if (item) void state.select(item.value, "keyboard");
    return;
  }
  if (!list.length || ![...keys, "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === keys[0] ? -1 : 1;
  if (
    item &&
    props.options.draggable &&
    event.altKey &&
    event.shiftKey &&
    keys.includes(event.key)
  ) {
    const target = list[at + direction];
    if (target)
      void state
        .move(item.value, target.value, direction > 0)
        .then((changed) => {
          if (changed) focus(item.value);
        });
    return;
  }
  const index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? list.length - 1
        : at < 0
          ? direction < 0
            ? list.length - 1
            : 0
          : (at + direction + list.length) % list.length;
  focus(list[index].value);
  if (props.options.activation !== "manual")
    void state.select(list[index].value, "keyboard");
}
async function renamePrompt(item: HysTabItem) {
  if (!state.canEdit() || item.readonly || item.disabled) return;
  const label = await (await prompt())?.rename(item);
  if (typeof label === "string") await state.rename(item.value, label);
}
function runAction(action: HysTabMenuAction) {
  const item = contextItem.value;
  if (!item) return;
  if (action === "reload") void panels.reload(item.value);
  else if (action === "pin") void state.pin(item.value);
  else if (action === "favorite") void state.favorite(item.value);
  else if (action === "rename") void renamePrompt(item);
  else if (action === "restore") void state.restore();
  else if (action === "current") void closeFocused(item.value);
  else void closeBatch(action, item);
}
const menuItems = computed<HysContextMenuItem[]>(() => {
  const item = contextItem.value;
  if (!item || props.slots.contextmenu) return [];
  const editable = state.canEdit() && !item.readonly;
  const at = items.value.findIndex((entry) => entry.value === item.value);
  return [
    { label: "刷新页签", value: "reload" },
    { label: "重命名", value: "rename", disabled: !editable },
    {
      label: item.pinned ? "取消固定" : "固定页签",
      value: "pin",
      disabled: !editable,
    },
    {
      label: item.favorite ? "取消收藏" : "收藏页签",
      value: "favorite",
      disabled: !editable,
    },
    { label: "", type: "divider", value: "divider" },
    { label: "关闭当前", value: "current", disabled: !state.canClose(item) },
    {
      label: "关闭左侧",
      value: "left",
      disabled: !items.value.slice(0, at).some(state.canClose),
    },
    {
      label: "关闭右侧",
      value: "right",
      disabled: !items.value.slice(at + 1).some(state.canClose),
    },
    {
      label: "关闭其他",
      value: "others",
      disabled: !items.value.some(
        (entry) => entry.value !== item.value && state.canClose(entry),
      ),
    },
    {
      label: "关闭所有可关闭项",
      value: "all",
      disabled: !state.all.value.some(state.canClose),
    },
    {
      label: "恢复最近关闭",
      value: "restore",
      disabled: !state.closed.value.length || !state.canEdit(),
    },
  ];
});
async function selectFromMenu(value: HysTabValue) {
  const accepted = await state.select(value, "menu");
  if (accepted) await nextTick(() => focus(value));
  return accepted;
}
const scope = (item: HysTabItem): HysTabScope => ({
  item,
  active: active.value === item.value,
});
const showClose = (item: HysTabItem) =>
  !item.pinned &&
  !item.readonly &&
  !props.options.readonly &&
  (item.closable ??
    (props.options.closable ||
      props.options.editable ||
      props.options.workbench));
const fixed = computed(() => !!props.options.fixed && !vertical.value);
const barSize = ref(0);
const barStart = ref(0);
const barWidth = ref(0);
let observer: ResizeObserver | undefined;
function measureBar() {
  if (!fixed.value || !root.value || !header.value) return;
  const rect = root.value.getBoundingClientRect();
  barStart.value = rect.left;
  barWidth.value = rect.width;
  barSize.value = header.value.offsetHeight;
}
function stopBar() {
  observer?.disconnect();
  observer = undefined;
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", measureBar);
    window.removeEventListener("scroll", measureBar, true);
  }
}
function observeBar() {
  stopBar();
  if (!fixed.value || !root.value || !header.value) return;
  measureBar();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(measureBar);
    observer.observe(root.value);
    observer.observe(header.value);
  }
  window.addEventListener("resize", measureBar);
  window.addEventListener("scroll", measureBar, {
    passive: true,
    capture: true,
  });
}
watch([fixed, root, header], observeBar, { flush: "post" });
onActivated(observeBar);
const style = computed<CSSProperties>(() => ({
  "--hys-tab-width": tabLength(props.options.tabWidth),
  "--hys-tab-height": tabLength(props.options.tabHeight),
  "--hys-tab-max-width": tabLength(props.options.tabMaxWidth),
  "--hys-tab-gap": tabLength(props.options.gap),
  "--hys-tab-radius": tabLength(props.options.radius),
  "--hys-tab-bar-offset": tabLength(props.options.barOffset),
  "--hys-tab-panel-height": tabLength(props.options.panelHeight),
  "--hys-tab-panel-max": tabLength(props.options.panelMaxHeight),
  "--hys-tab-duration": bounded(props.options.duration, 160, 5000) + "ms",
  "--hys-tab-ease":
    props.options.easing ??
    (props.options.animation === "spring"
      ? "cubic-bezier(.22,1.5,.45,1)"
      : undefined),
  "--hys-tab-custom-animation": props.options.animationName,
  "--hys-tab-fixed-width": barWidth.value + "px",
  "--hys-tab-fixed-left": barStart.value + "px",
  "--hys-tab-bar-height": barSize.value + "px",
}));
watch(active, () => {
  clearHover();
  if (!navElement.value?.contains(document.activeElement))
    focused.value = undefined;
});
onDeactivated(() => {
  clearHover();
  stopBar();
});
onBeforeUnmount(() => {
  clearHover();
  stopBar();
});
function tabLeaving(element: Element) {
  element.setAttribute("aria-hidden", "true");
  element.querySelector('[role="tab"]')?.setAttribute("aria-selected", "false");
  if (element instanceof HTMLElement) element.inert = true;
}
defineExpose({
  active,
  recent: state.recent,
  closed: computed(() => state.closed.value.map((entry) => entry.item)),
  select: state.select,
  focus,
  scrollToActiveTab: nav.scrollTo,
  add: state.add,
  close: closeFocused,
  closeMany: state.closeMany,
  rename: state.rename,
  pin: state.pin,
  favorite: state.favorite,
  move: state.move,
  restore: state.restore,
  preload: panels.preload,
  reload: panels.reload,
  save: persistence.save,
});
</script>

<template>
  <div
    ref="root"
    v-bind="skin"
    class="hys-ui-tabs-root"
    :style="style"
    :data-type="options.type"
    :data-size="options.size"
    :data-placement="placement"
    :data-vertical="vertical || undefined"
    :data-fixed="(fixed && barWidth > 0) || undefined"
    :data-sticky="options.sticky || undefined"
    :data-separator="options.separator || undefined"
    :data-motion="
      motion ? (options.animationName ? 'custom' : options.animation) : 'none'
    "
  >
    <div ref="header" class="hys-ui-tabs-header">
      <div v-if="slots.prefix" class="hys-ui-tabs-extra">
        <TabsSlot :render="slots.prefix" />
      </div>
      <button
        v-if="options.showScrollButtons && (pointer.scrollControls.value?.before ?? nav.before.value)"
        type="button"
        class="hys-ui-tab-control"
        :aria-label="vertical ? '向上滚动页签' : '向前滚动页签'"
        @click="nav.scroll(-1)"
      >
        <component
          :is="vertical ? ChevronUp : nav.rtl() ? ChevronRight : ChevronLeft"
          :size="16"
          aria-hidden="true"
        />
      </button>
      <div
        ref="navElement"
        class="hys-ui-tabs"
        role="tablist"
        :aria-label="options.ariaLabel || '页签'"
        :aria-busy="state.pending.value || undefined"
        :aria-orientation="vertical ? 'vertical' : 'horizontal'"
        :data-overflow="options.overflow ?? 'scroll'"
        :data-dragging="pointer.dragging.value !== undefined || undefined"
        :data-align="options.align ?? (options.centered ? 'center' : 'start')"
        :data-stretch="options.stretch || undefined"
        @keydown="keydown"
        @scroll.passive="
          nav.schedule();
          persistence.scrolled();
        "
        @wheel="nav.wheel"
        @pointerdown="pointer.down"
        @pointermove="pointer.motion"
        @pointerup="pointer.finish($event)"
        @pointercancel="pointer.cancel"
        @lostpointercapture="pointer.cancel"
        @pointerleave="
          pointer.dragging.value === undefined && pointer.cancel($event)
        "
        @click.capture="pointer.clickCapture"
      >
        <div ref="track" class="hys-tabs-track">
          <TransitionGroup
            tag="div"
            :css="motion"
            :name="motion ? 'hys-tabs-move' : 'hys-tabs-still'"
            class="hys-tabs-items"
            @before-leave="tabLeaving"
          >
            <div
              v-for="item in items"
              :key="tabToken(item.value)"
              :data-tab-group="tabToken(item.value)"
              class="hys-ui-tab-item"
              :class="item.class"
              :style="[
                {
                  '--hys-tab-item-width': tabLength(item.width),
                  '--hys-tab-item-color': item.color,
                },
                item.style,
              ]"
              :data-selected="active === item.value || undefined"
              :data-pinned="item.pinned || undefined"
              :data-dragging="
                pointer.dragging.value === item.value || undefined
              "
              :data-drop="
                pointer.drop.value?.value === item.value
                  ? pointer.drop.value.after
                    ? 'after'
                    : 'before'
                  : undefined
              "
            >
              <span
                v-if="
                  options.draggable && options.dragHandle && state.canMove(item)
                "
                class="hys-tab-drag-handle"
                aria-hidden="true"
                ><GripVertical :size="14"
              /></span>
              <button
                :id="tabId(item.value)"
                :ref="
                  (el) =>
                    nav.setButton(item.value, el as HTMLButtonElement | null)
                "
                type="button"
                role="tab"
                class="hys-tab-title"
                :class="{ 'hys-ui-active': active === item.value }"
                :data-tab-key="tabToken(item.value)"
                :aria-selected="active === item.value"
                :aria-controls="
                  hasPanels || (slots.default && active === item.value)
                    ? panelId(item.value)
                    : undefined
                "
                :aria-keyshortcuts="state.canClose(item) ? 'Delete' : undefined"
                :disabled="options.disabled || item.disabled"
                :tabindex="roving === item.value ? 0 : -1"
                :title="options.titleTooltip !== false ? item.label : undefined"
                @focus="focused = item.value"
                @click="clicked(item, $event)"
                @dblclick="
                  !item.disabled &&
                  !options.disabled &&
                  emit('tabDblclick', item.value, $event)
                "
                @contextmenu="openContext(item, $event)"
                @pointerenter="hover(item, $event)"
                @pointerleave="clearHover"
              >
                <Pin
                  v-if="item.pinned"
                  :size="13"
                  aria-hidden="true"
                  class="hys-tab-mark"
                />
                <TabsSlot
                  :render="declarationSlots.get(item.value)?.icon ?? slots.icon"
                  :scope="scope(item)"
                >
                  <component
                    v-if="item.icon"
                    :is="item.icon"
                    :size="15"
                    aria-hidden="true"
                  />
                </TabsSlot>
                <span class="hys-tab-label"
                  ><TabsSlot
                    :render="
                      declarationSlots.get(item.value)?.label ?? slots.label
                    "
                    :scope="scope(item)"
                    >{{ item.label }}</TabsSlot
                  ></span
                >
                <TabsSlot
                  :render="
                    declarationSlots.get(item.value)?.badge ?? slots.badge
                  "
                  :scope="scope(item)"
                >
                  <span v-if="item.badge !== undefined" class="hys-tab-badge">{{
                    item.badge
                  }}</span>
                </TabsSlot>
                <Star
                  v-if="item.favorite"
                  :size="12"
                  aria-hidden="true"
                  class="hys-tab-mark"
                />
                <TabsSlot :render="slots['status-icon']" :scope="scope(item)">
                  <component
                    v-if="item.statusIcon"
                    :is="item.statusIcon"
                    :size="14"
                    aria-hidden="true"
                  />
                  <LoaderCircle
                    v-else-if="item.status === 'loading'"
                    :size="13"
                    class="hys-tab-spinner"
                    aria-hidden="true"
                  />
                  <span
                    v-else-if="
                      item.dot || item.status || item.unread || item.dirty
                    "
                    class="hys-tab-dot"
                    :data-status="item.dirty ? 'warning' : item.status"
                    :aria-label="
                      item.dirty ? '未保存' : item.unread ? '未读' : item.status
                    "
                    role="img"
                  />
                </TabsSlot>
              </button>
              <button
                v-if="showClose(item)"
                type="button"
                class="hys-ui-tab-close"
                tabindex="-1"
                :aria-label="'关闭' + item.label"
                :aria-busy="state.closing.has(item.value) || undefined"
                :disabled="
                  !state.canClose(item) || state.closing.has(item.value)
                "
                @click="closeFocused(item.value)"
              >
                <TabsSlot :render="slots['close-icon']" :scope="scope(item)"
                  ><X :size="13" aria-hidden="true"
                /></TabsSlot>
              </button>
            </div>
          </TransitionGroup>
          <span
            v-if="options.type === 'line' && options.overflow !== 'wrap'"
            class="hys-tabs-indicator"
            :style="nav.indicator.value"
            aria-hidden="true"
          />
        </div>
      </div>
      <button
        v-if="options.showScrollButtons && (pointer.scrollControls.value?.after ?? nav.after.value)"
        type="button"
        class="hys-ui-tab-control"
        :aria-label="vertical ? '向下滚动页签' : '向后滚动页签'"
        @click="nav.scroll(1)"
      >
        <component
          :is="vertical ? ChevronDown : nav.rtl() ? ChevronLeft : ChevronRight"
          :size="16"
          aria-hidden="true"
        />
      </button>
      <TabsMore
        v-if="
          options.workbench ||
          ((options.overflow === 'menu' || options.overflow === 'clip') &&
            nav.hasOverflow.value)
        "
        :items="items"
        :overflow="nav.overflowed.value"
        :recent="state.recent.value"
        :active="active"
        :disabled="options.disabled"
        :search="options.moreSearch"
        :slots="slots"
        :select="selectFromMenu"
      />
      <button
        v-if="options.addable || options.editable || options.workbench"
        type="button"
        class="hys-ui-tab-control hys-ui-tab-add"
        aria-label="添加页签"
        :disabled="options.disabled || options.readonly"
        @click="state.add()"
      >
        <TabsSlot :render="slots['add-icon']"
          ><Plus :size="16" aria-hidden="true"
        /></TabsSlot>
      </button>
      <div v-if="slots.suffix" class="hys-ui-tabs-extra">
        <TabsSlot :render="slots.suffix" />
      </div>
      <div v-if="previewItem" class="hys-tab-preview" role="status">
        <TabsSlot :render="slots.preview" :scope="scope(previewItem)"
          >{{ previewItem.label
          }}<span v-if="previewItem.content">
            · {{ previewItem.content }}</span
          ></TabsSlot
        >
      </div>
    </div>
    <div
      v-if="panelVisible"
      class="hys-ui-tabs-content"
      :data-swipe="options.swipe || undefined"
      @pointerdown="ownsGesture($event) && pointer.swipeDown($event)"
      @pointerup="ownsGesture($event) && pointer.swipeUp($event)"
      @pointercancel="ownsGesture($event) && pointer.cancelSwipe()"
    >
      <TabsPanels
        :items="items"
        :declarations="declarations"
        :slots="slots"
        :active="active"
        :panels="panels"
        :panel-id="panelId"
        :tab-id="tabId"
        :declarative="declarativeMode"
        :force-panels="!!options.workbench || !!slots.empty"
      />
    </div>
    <component
      v-if="menusEnabled && menuComponent"
      :is="menuComponent"
      ref="menu"
      style="display: none"
      :trigger="[]"
      :items="menuItems"
      aria-label="页签操作"
      @select="(value: HysTabValue) => runAction(value as HysTabMenuAction)"
    >
      <template v-if="slots.contextmenu" #empty>
        <TabsSlot
          v-if="contextItem"
          :render="slots.contextmenu"
          :scope="{ item: contextItem, run: runAction, close: closeMenu }"
        />
      </template>
    </component>
    <component v-if="promptComponent" :is="promptComponent" ref="prompts" />
    <Teleport v-if="pointer.ghost.value" to="body">
      <div
        ref="ghostElement"
        v-bind="skin"
        class="hys-tab-drag-ghost"
        aria-hidden="true"
        :style="{
          width: pointer.ghost.value.width + 'px',
          height: pointer.ghost.value.height + 'px',
        }"
      >
        {{ pointer.ghost.value.label }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped src="../tabs.css"></style>
