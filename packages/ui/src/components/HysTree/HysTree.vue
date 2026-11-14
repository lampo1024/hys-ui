<script
  setup
  lang="ts"
  generic="
    V extends HysTreeValue = string,
    N extends object = TreeNode,
    K extends HysTreeKey = N extends { id: infer I extends HysTreeKey }
      ? I
      : HysTreeKey
  "
>
import PopupMotion from '../../motion/PopupMotion';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  provide,
  ref,
  shallowRef,
  useId,
  watch,
  type InjectionKey,
} from "vue";
import {
  ChevronRight,
  ChevronDown,
  LoaderCircle,
  Search,
  GripVertical,
} from "lucide-vue-next";
import HysInput from "../HysInput/HysInput.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysButton from "../HysButton/HysButton.vue";
import { useHysRootAttrs } from "../../config";
import {
  useHysControlState,
  useHysFormItemContext,
  fieldKey,
  type HysFieldContext,
} from "../../composables/formContext";
import { useTree } from "../../composables/useTree";
import {
  type HysTreeProps,
  type HysTreeKey,
  type HysTreeValue,
  type TreeNode,
  type HysTreeRecord,
  type HysTreeCheckInfo,
  type HysTreeSelectInfo,
  type HysTreeDropInfo,
  type HysTreeDropPosition,
  type HysTreeNodeContext,
} from "../../composables/tree";
export type { TreeNode } from "../../composables/tree";
const props = withDefaults(defineProps<HysTreeProps<N, V>>(), {
  searchable: true,
  rowHeight: 38,
  viewportHeight: 340,
  overscan: 4,
  selectable: true,
  selectOnClickNode: true,
  highlightCurrent: true,
  showIcon: true,
  indent: 20,
  blockNode: true,
  dragExpandDelay: 700,
  validateEvent: true,
});
defineSlots<{
  node?: (context: HysTreeNodeContext<N>) => any;
  default?: (context: HysTreeNodeContext<N>) => any;
  icon?: (context: HysTreeNodeContext<N>) => any;
  switcher?: (context: HysTreeNodeContext<N>) => any;
  actions?: (context: HysTreeNodeContext<N>) => any;
  empty?: (context: { query: string }) => any;
  loading?: () => any;
  contextmenu?: (context: {
    node: N;
    key: HysTreeKey;
    close: () => void;
  }) => any;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: V];
  "update:checkedKeys": [keys: HysTreeKey[]];
  "update:expandedKeys": [keys: HysTreeKey[]];
  "update:loadedKeys": [keys: HysTreeKey[]];
  "update:searchValue": [query: string];
  "update:nodes": [nodes: readonly N[]];
  select: [node: N, info: HysTreeSelectInfo<N>];
  check: [keys: HysTreeKey[], info: HysTreeCheckInfo<N>];
  "check-change": [info: HysTreeCheckInfo<N>];
  "selection-change": [info: HysTreeSelectInfo<N>];
  "node-click": [node: N, event: MouseEvent];
  "node-expand": [
    node: N,
    info: { key: HysTreeKey; expanded: boolean; expandedKeys: HysTreeKey[] },
  ];
  "node-collapse": [
    node: N,
    info: { key: HysTreeKey; expanded: boolean; expandedKeys: HysTreeKey[] },
  ];
  "node-drop": [info: HysTreeDropInfo<N, K>];
  "node-drag-start": [info: { node: N; event: DragEvent }];
  "node-drag-over": [info: HysTreeDropInfo<N, K>];
  "node-drag-end": [info: { node: N; event?: Event }];
  "node-contextmenu": [
    info: { node: N; x: number; y: number; event: MouseEvent },
  ];
  "load-error": [info: { node: N; error: unknown }];
  "children-loaded": [info: { node: N; children: readonly N[] }];
  load: [info: { node: N; children: readonly N[]; loadedKeys: HysTreeKey[] }];
  "data-change": [
    info: { nodes: readonly N[]; action: string; key?: HysTreeKey },
  ];
  search: [query: string];
  scroll: [event: Event];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const attrs = useHysRootAttrs(),
  control = useHysControlState(props),
  field = useHysFormItemContext(),
  id = useId(),
  element = ref<HTMLElement>(),
  root = ref<HTMLElement>(),
  search = ref<InstanceType<typeof HysInput>>();
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
const store = useTree(
  props,
  control.disabled,
  (name, ...args) =>
    (emit as (n: string, ...args: any[]) => void)(name, ...args),
  () => {
    if (props.validateEvent) void field.validate("change");
  },
);
const {
  index,
  visible,
  words,
  busy,
  live,
  query,
  expanded,
  selection,
  selected,
  multiple,
  checked,
  halfChecked,
  loadingKeys,
  failures,
  matches,
  expandNode,
  setChecked,
  selectNode,
  filter,
} = store;
const height = computed(() =>
    Number.isFinite(props.rowHeight)
      ? Math.min(240, Math.max(24, props.rowHeight))
      : 38,
  ),
  viewport = computed(() =>
    Number.isFinite(props.viewportHeight)
      ? Math.min(1600, Math.max(80, props.viewportHeight))
      : 340,
  ),
  overscan = computed(() =>
    Number.isFinite(props.overscan)
      ? Math.min(30, Math.max(0, Math.floor(props.overscan)))
      : 4,
  ),
  indent = computed(() =>
    Number.isFinite(props.indent)
      ? Math.min(80, Math.max(0, props.indent))
      : 20,
  ),
  scrollTop = ref(0),
  actualHeight = ref(0),
  focused = ref<HysTreeKey | null>(null),
  start = computed(() =>
    props.virtual
      ? Math.max(0, Math.floor(scrollTop.value / height.value) - overscan.value)
      : 0,
  ),
  end = computed(() =>
    props.virtual
      ? Math.min(
          visible.value.length,
          Math.ceil(
            (scrollTop.value + (actualHeight.value || viewport.value)) /
              height.value,
          ) + overscan.value,
        )
      : visible.value.length,
  ),
  rendered = computed(() => visible.value.slice(start.value, end.value)),
  enabled = computed(() => visible.value.filter((r) => !r.disabled)),
  tabKey = computed(() =>
    focused.value !== null &&
    visible.value.some((r) => r.key === focused.value && !r.disabled)
      ? focused.value
      : enabled.value[0]?.key,
  );
let frame = 0,
  savedTop = 0,
  observer: ResizeObserver | undefined,
  viewTicket = 0;
function observe() {
  observer?.disconnect();
  if (props.virtual && root.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver((entries) => {
      actualHeight.value = entries[0]?.contentRect.height || 0;
    });
    observer.observe(root.value);
  }
}
function stopView() {
  viewTicket++;
  cancelAnimationFrame(frame);
  frame = 0;
  observer?.disconnect();
  observer = undefined;
}
async function restoreView() {
  const ticket = ++viewTicket;
  await nextTick();
  if (!live.value || ticket !== viewTicket || !root.value) return;
  root.value.scrollTop = savedTop;
  scrollTop.value = root.value.scrollTop;
  observe();
}
onActivated(restoreView);
watch([root, () => props.virtual], restoreView);
function onScroll(e: Event) {
  if (!live.value || !root.value?.isConnected) return;
  savedTop = root.value.scrollTop;
  if (props.virtual && !frame)
    frame = requestAnimationFrame(() => {
      frame = 0;
      scrollTop.value = savedTop;
    });
  emit("scroll", e);
}
function resetScroll() {
  savedTop = 0;
  scrollTop.value = 0;
  if (root.value) root.value.scrollTop = 0;
}
watch(query, resetScroll);
watch(
  () => visible.value.length,
  () => {
    if (root.value) {
      const max = Math.max(
        0,
        visible.value.length * height.value -
          (actualHeight.value || viewport.value),
      );
      if (props.virtual && savedTop > max) {
        savedTop = max;
        scrollTop.value = max;
        root.value.scrollTop = max;
      }
    }
  },
);
const rowElements = new Map<HysTreeKey, HTMLElement>();
function bindRow(key: HysTreeKey, value: unknown) {
  if (value instanceof HTMLElement) rowElements.set(key, value);
  else rowElements.delete(key);
}
async function scrollTo(options: {
  key?: HysTreeKey;
  top?: number;
  align?: "top" | "bottom" | "auto";
  offset?: number;
  behavior?: ScrollBehavior;
}) {
  if (busy.value) return;
  if (options.key !== undefined) {
    await store.setExpandedKeys([
      ...new Set([...store.rawExpanded.value, ...store.ancestors(options.key)]),
    ]);
    await nextTick();
  }
  const port = root.value;
  if (!port) return;
  let top = options.top ?? port.scrollTop;
  if (options.key !== undefined) {
    const at = visible.value.findIndex((r) => r.key === options.key);
    if (at < 0) return;
    if (props.virtual) {
      const y = at * height.value,
        bottom = y + height.value,
        h = actualHeight.value || viewport.value;
      top =
        options.align === "top"
          ? y
          : options.align === "bottom"
            ? bottom - h
            : y < port.scrollTop
              ? y
              : bottom > port.scrollTop + h
                ? bottom - h
                : port.scrollTop;
    } else {
      const row = rowElements.get(options.key);
      if (row) {
        const y =
            row.getBoundingClientRect().top -
            port.getBoundingClientRect().top +
            port.scrollTop,
          bottom = y + row.offsetHeight;
        top =
          options.align === "top"
            ? y
            : options.align === "bottom"
              ? bottom - port.clientHeight
              : y < port.scrollTop
                ? y
                : bottom > port.scrollTop + port.clientHeight
                  ? bottom - port.clientHeight
                  : port.scrollTop;
      }
    }
  }
  top = Math.max(0, Number.isFinite(top) ? top + (options.offset ?? 0) : 0);
  savedTop = top;
  scrollTop.value = top;
  if (options.behavior === "smooth" && port.scrollTo)
    port.scrollTo({ top, behavior: "smooth" });
  else port.scrollTop = top;
  await nextTick();
}
async function focus(key?: HysTreeKey) {
  if (busy.value) return;
  const chosen =
    key ??
    (focused.value !== null ? focused.value : undefined) ??
    enabled.value[0]?.key;
  if (chosen === undefined) {
    search.value?.focus();
    return;
  }
  const row = index.value.map.get(chosen);
  if (!row || row.disabled) return;
  await scrollTo({ key: chosen });
  if (!live.value || !visible.value.some((r) => r.key === chosen)) return;
  focused.value = chosen;
  await nextTick();
  rowElements.get(chosen)?.focus({ preventScroll: !!props.virtual });
}
function context(row: HysTreeRecord<N>): HysTreeNodeContext<N> {
  return {
    node: row.node,
    key: row.key,
    label: row.label,
    depth: row.depth,
    expanded:
      expanded.value.has(row.key) ||
      (!!query.value.trim() && props.filterMode !== "highlight"),
    selected: selection.value.has(row.key),
    checked: checked.value.has(row.key),
    indeterminate: halfChecked.value.has(row.key),
    disabled: busy.value || row.disabled,
    loading: loadingKeys.value.has(row.key),
    leaf: !row.hasChildren,
  };
}
const nativeInteractive = (
  target: EventTarget | null,
  row: HTMLElement | null,
) =>
  target instanceof Element &&
  !!target.closest(
    'button,input,textarea,select,a,[contenteditable="true"],[role="button"]',
  ) &&
  target !== row;
function click(e: MouseEvent, row: HysTreeRecord<N>) {
  if (
    nativeInteractive(e.target, e.currentTarget as HTMLElement) ||
    busy.value ||
    row.disabled
  )
    return;
  focused.value = row.key;
  emit("node-click", row.node, e);
  if (props.selectOnClickNode) void selectNode(row, e);
  if (
    props.checkable &&
    (props.checkOnClickNode || (props.checkOnClickLeaf && !row.hasChildren))
  )
    void setChecked(
      row.key,
      !checked.value.has(row.key),
      !props.checkStrictly,
      e,
    );
  if (props.expandOnClickNode && row.hasChildren)
    void expandNode(row.key, !expanded.value.has(row.key));
}
function dblclick(e: MouseEvent, row: HysTreeRecord<N>) {
  if (
    props.expandOnDoubleClick &&
    !props.expandOnClickNode &&
    !nativeInteractive(e.target, e.currentTarget as HTMLElement) &&
    row.hasChildren
  )
    void expandNode(row.key, !expanded.value.has(row.key));
}
function keydown(e: KeyboardEvent, row: HysTreeRecord<N>) {
  if (
    e.isComposing ||
    e.keyCode === 229 ||
    nativeInteractive(e.target, e.currentTarget as HTMLElement) ||
    busy.value
  )
    return;
  const at = enabled.value.findIndex((r) => r.key === row.key);
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
    e.preventDefault();
    const n =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? enabled.value.length - 1
          : Math.max(
              0,
              Math.min(
                enabled.value.length - 1,
                at + (e.key === "ArrowDown" ? 1 : -1),
              ),
            );
    void focus(enabled.value[n]?.key);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (row.hasChildren && !expanded.value.has(row.key))
      void expandNode(row.key);
    else if (row.hasChildren) void focus(enabled.value[at + 1]?.key);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (row.hasChildren && expanded.value.has(row.key))
      void expandNode(row.key, false);
    else if (row.parent !== undefined) void focus(row.parent);
  } else if (e.key === "Enter") {
    e.preventDefault();
    void selectNode(row, e);
  } else if (e.key === " ") {
    e.preventDefault();
    props.checkable
      ? void setChecked(
          row.key,
          !checked.value.has(row.key),
          !props.checkStrictly,
          e,
        )
      : void selectNode(row, e);
  } else if (e.key === "Escape") {
    e.preventDefault();
    if (menu.value) closeMenu();
    else if (dragged.value !== null) endDrag(e);
    else if (props.allowDeselect) void store.setSelectedKeys([]);
  }
}
function searchKeys(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229)
    e.preventDefault();
  else if (e.key === "ArrowDown" && !e.isComposing) {
    e.preventDefault();
    void focus(enabled.value[0]?.key);
  }
}
const dragged = ref<HysTreeKey | null>(null),
  dropTarget = ref<HysTreeKey | null>(null),
  dropPosition = ref<HysTreeDropPosition>("inside");
let dragNode: N | undefined,
  hoverTimer: ReturnType<typeof setTimeout> | undefined,
  hoverKey: HysTreeKey | null = null;
function clearHover() {
  clearTimeout(hoverTimer);
  hoverTimer = undefined;
  hoverKey = null;
}
function globalCancel(e: Event) {
  if (e.type === "blur" || (e instanceof KeyboardEvent && e.key === "Escape"))
    endDrag(e);
}
function endDrag(e?: Event) {
  const node = dragNode;
  dragged.value = null;
  dropTarget.value = null;
  dragNode = undefined;
  clearHover();
  window.removeEventListener("blur", globalCancel);
  window.removeEventListener("keydown", globalCancel, true);
  if (node) emit("node-drag-end", { node, event: e });
}
function dragstart(e: DragEvent, row: HysTreeRecord<N>) {
  if (
    busy.value ||
    !props.draggable ||
    row.disabled ||
    props.allowDrag?.(row.node) === false ||
    nativeInteractive(e.target, e.currentTarget as HTMLElement)
  ) {
    e.preventDefault();
    return;
  }
  endDrag();
  dragged.value = row.key;
  dragNode = row.node;
  e.dataTransfer?.setData("text/plain", String(row.key));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  window.addEventListener("blur", globalCancel);
  window.addEventListener("keydown", globalCancel, true);
  emit("node-drag-start", { node: row.node, event: e });
}
function canDrop(row: HysTreeRecord<N>, position: HysTreeDropPosition) {
  const from = dragged.value;
  if (
    from === null ||
    from === row.key ||
    busy.value ||
    !props.draggable ||
    row.disabled ||
    !dragNode ||
    index.value.map.get(from)?.node !== dragNode
  )
    return false;
  if (
    store.ancestors(row.key).includes(from) ||
    (position === "inside" && row.leaf)
  )
    return false;
  return props.allowDrop?.(dragNode, row.node, position) !== false;
}
function dragover(e: DragEvent, row: HysTreeRecord<N>) {
  const box = (e.currentTarget as HTMLElement).getBoundingClientRect(),
    fraction = (e.clientY - box.top) / (box.height || 1),
    position =
      fraction < 0.25 ? "before" : fraction > 0.75 ? "after" : "inside";
  if (!canDrop(row, position)) {
    dropTarget.value = null;
    clearHover();
    return;
  }
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dropTarget.value = row.key;
  dropPosition.value = position;
  emit("node-drag-over", {
    dragId: dragged.value! as K,
    targetId: row.key as K,
    dragNode: dragNode!,
    targetNode: row.node,
    position,
    event: e,
  });
  if (
    position === "inside" &&
    row.hasChildren &&
    !expanded.value.has(row.key) &&
    hoverKey !== row.key
  ) {
    clearHover();
    hoverKey = row.key;
    if (Number.isFinite(props.dragExpandDelay) && props.dragExpandDelay >= 0)
      hoverTimer = setTimeout(() => {
        hoverTimer = undefined;
        if (dropTarget.value === row.key && canDrop(row, "inside"))
          void expandNode(row.key);
      }, props.dragExpandDelay);
  } else if (position !== "inside") clearHover();
}
function dragleave(e: DragEvent, row: HysTreeRecord<N>) {
  if (
    !(e.relatedTarget instanceof Node) ||
    !(e.currentTarget as HTMLElement).contains(e.relatedTarget)
  ) {
    if (dropTarget.value === row.key) dropTarget.value = null;
    clearHover();
  }
}
function drop(e: DragEvent, row: HysTreeRecord<N>) {
  if (dropTarget.value === row.key && canDrop(row, dropPosition.value)) {
    e.preventDefault();
    emit("node-drop", {
      dragId: dragged.value! as K,
      targetId: row.key as K,
      position: dropPosition.value,
      dragNode: dragNode!,
      targetNode: row.node,
      event: e,
    });
  }
  endDrag(e);
}
watch(
  () => [busy.value, props.draggable, props.nodes] as const,
  () => {
    if (
      busy.value ||
      !props.draggable ||
      (dragged.value !== null &&
        index.value.map.get(dragged.value)?.node !== dragNode)
    )
      endDrag();
  },
  { flush: "sync" },
);
const menu = shallowRef<{ node: N; key: HysTreeKey; x: number; y: number }>(),
  menuPanel = ref<HTMLElement>(),
  menuReturn = ref<HysTreeKey>();
function closeMenu(restore = true) {
  menu.value = undefined;
  if (restore && menuReturn.value !== undefined) void focus(menuReturn.value);
}
async function openMenu(e: MouseEvent, row: HysTreeRecord<N>) {
  if (!props.contextMenu || busy.value || row.disabled) return;
  e.preventDefault();
  menuReturn.value = row.key;
  menu.value = {
    node: row.node,
    key: row.key,
    x: Math.max(8, Math.min(e.clientX, window.innerWidth - 230)),
    y: Math.max(8, Math.min(e.clientY, window.innerHeight - 155)),
  };
  emit("node-contextmenu", {
    node: row.node,
    x: e.clientX,
    y: e.clientY,
    event: e,
  });
  await nextTick();
  menuPanel.value?.querySelector<HTMLElement>('button,[tabindex="0"]')?.focus();
}
function menuKeys(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
  } else if (e.key === "Tab") closeMenu(false);
  else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
    e.preventDefault();
    const items = [
        ...(menuPanel.value?.querySelectorAll<HTMLElement>(
          "[role=menuitem]:not(:disabled)",
        ) ?? []),
      ],
      at = items.indexOf(document.activeElement as HTMLElement),
      n =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? items.length - 1
            : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
              items.length;
    items[n]?.focus();
  }
}
function focusIn(e: FocusEvent) {
  if (
    !(e.relatedTarget instanceof Node) ||
    !element.value?.contains(e.relatedTarget)
  )
    emit("focus", e);
}
function blur(e: FocusEvent) {
  if (
    e.relatedTarget instanceof Node &&
    (element.value?.contains(e.relatedTarget) ||
      menuPanel.value?.contains(e.relatedTarget))
  )
    return;
  emit("blur", e);
  if (props.validateEvent) void field.validate("blur");
}
function cleanup() {
  endDrag();
  closeMenu(false);
  stopView();
}
watch(busy, (v) => {
  if (v) closeMenu(false);
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  element,
  getNode: store.getNode,
  getNodeInfo: store.getNodeInfo,
  getCheckedKeys: store.getCheckedKeys,
  getCheckedNodes: store.getCheckedNodes,
  getHalfCheckedKeys: store.getHalfCheckedKeys,
  getHalfCheckedNodes: () => store.checkInfo().halfCheckedNodes,
  setCheckedKeys: store.setCheckedKeys,
  setCheckedNodes: (nodes: readonly N[], leafOnly = false) =>
    store.setCheckedKeys(
      nodes.flatMap((node) => store.getNodeInfo(node)?.key ?? []),
      leafOnly,
    ),
  setChecked: store.setChecked,
  getCurrentKey: store.getCurrentKey,
  getCurrentNode: store.getCurrentNode,
  getSelectedKeys: () => [...selected.value],
  setCurrentKey: store.setCurrentKey,
  setCurrentNode: (node: N | null, expandParents = true) =>
    store.setCurrentKey(
      node === null ? null : (store.getNodeInfo(node)?.key ?? null),
      expandParents,
    ),
  setSelectedKeys: store.setSelectedKeys,
  getExpandedKeys: () => [...expanded.value],
  setExpandedKeys: store.setExpandedKeys,
  expandNode,
  expandAll: () =>
    store.setExpandedKeys(
      index.value.rows.filter((r) => r.hasChildren).map((r) => r.key),
    ),
  collapseAll: () => store.setExpandedKeys([]),
  filter,
  reloadNode: store.reloadNode,
  updateKeyChildren: store.updateKeyChildren,
  append: store.append,
  insertBefore: store.insertBefore,
  insertAfter: store.insertAfter,
  remove: store.remove,
  scrollTo,
  focus,
});
</script>
<template>
  <div
    ref="element"
    v-bind="attrs"
    class="hys-ui-pf-tree"
    :class="{
      'hys-ui-pf-tree-disabled': control.disabled.value,
      'hys-ui-tree-inline': !blockNode,
    }"
    :data-size="control.size.value"
    @focusin="focusIn"
    @focusout="blur"
  >
    <HysInput
      v-if="searchable"
      ref="search"
      class="hys-ui-tree-search"
      data-hys-ui-form-internal
      :model-value="query"
      :placeholder="searchPlaceholder || words.search"
      :aria-label="words.search"
      :disabled="busy"
      :size="control.size.value"
      clearable
      @update:model-value="filter"
      @keydown="searchKeys"
      ><template #prefix><Search :size="15" aria-hidden="true" /></template
    ></HysInput>
    <div
      ref="root"
      :id="field.id.value || id"
      role="tree"
      data-hys-ui-field-managed
      :tabindex="busy ? -1 : 0"
      @focus.self="focus()"
      :aria-label="ariaLabel || field.label.value || words.tree"
      :aria-multiselectable="multiple || checkable || undefined"
      :aria-disabled="busy || undefined"
      :aria-busy="loading || loadingKeys.size > 0 || undefined"
      :aria-invalid="field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
      class="hys-ui-pf-tree-list hys-ui-scrollbar"
      :class="{ 'hys-ui-tree-virtual': virtual }"
      :style="{
        maxHeight: viewport + 'px',
        height: virtual ? viewport + 'px' : undefined,
        '--hys-ui-tree-indent': indent + 'px',
        '--hys-ui-tree-row-height': height + 'px',
      }"
      @scroll="onScroll"
    >
      <div v-if="loading" class="hys-ui-tree-loading" role="status">
        <slot name="loading"
          ><LoaderCircle
            :size="18"
            class="hys-ui-icon-spin"
            aria-hidden="true"
          />{{ words.loading }}</slot
        >
      </div>
      <div
        class="hys-ui-tree-space"
        :style="
          virtual ? { height: visible.length * height + 'px' } : undefined
        "
      >
        <div
          class="hys-ui-tree-rows"
          :style="
            virtual
              ? {
                  position: 'absolute',
                  top: start * height + 'px',
                  insetInline: '0',
                }
              : undefined
          "
        >
          <div
            v-for="row in rendered"
            :key="typeof row.key + ':' + row.key"
            :ref="(v) => bindRow(row.key, v)"
            class="hys-ui-pf-tree-row"
            :class="[
              typeof nodeClass === 'function' ? nodeClass(row.node) : nodeClass,
              {
                'hys-ui-pf-tree-selected':
                  highlightCurrent && selection.has(row.key),
                'hys-ui-pf-tree-line': showLine,
                'hys-ui-pf-tree-drop': dropTarget === row.key,
                'hys-ui-tree-matched': query.trim() && matches.has(row.key),
                'hys-ui-tree-row-disabled': row.disabled,
                'hys-ui-tree-row-dragging': dragged === row.key,
              },
            ]"
            :style="[
              { '--hys-ui-tree-depth': row.depth },
              typeof nodeStyle === 'function' ? nodeStyle(row.node) : nodeStyle,
            ]"
            role="treeitem"
            :aria-level="row.depth + 1"
            :aria-posinset="row.pos"
            :aria-setsize="row.size"
            :aria-expanded="row.hasChildren ? context(row).expanded : undefined"
            :aria-selected="
              selectable && row.selectable ? selection.has(row.key) : undefined
            "
            :aria-disabled="busy || row.disabled || undefined"
            :aria-checked="
              checkable && row.checkable
                ? halfChecked.has(row.key)
                  ? 'mixed'
                  : checked.has(row.key)
                : undefined
            "
            :tabindex="!busy && tabKey === row.key ? 0 : -1"
            :draggable="
              draggable &&
              !busy &&
              !row.disabled &&
              allowDrag?.(row.node) !== false
            "
            :data-tree-id="row.key"
            :data-tree-key="typeof row.key + ':' + row.key"
            :data-drop-position="
              dropTarget === row.key ? dropPosition : undefined
            "
            @focus="focused = row.key"
            @keydown="keydown($event, row)"
            @click="click($event, row)"
            @dblclick="dblclick($event, row)"
            @dragstart="dragstart($event, row)"
            @dragover="dragover($event, row)"
            @dragleave="dragleave($event, row)"
            @drop="drop($event, row)"
            @dragend="endDrag"
            @contextmenu="openMenu($event, row)"
          >
            <button
              v-if="row.hasChildren"
              type="button"
              class="hys-ui-pf-tree-expander"
              :aria-label="
                (context(row).expanded ? words.collapse : words.expand) +
                ' ' +
                row.label
              "
              :disabled="busy || row.disabled"
              tabindex="-1"
              @click.stop="expandNode(row.key, !expanded.has(row.key))"
            >
              <slot name="switcher" v-bind="context(row)"
                ><LoaderCircle
                  v-if="loadingKeys.has(row.key)"
                  :size="15"
                  class="hys-ui-icon-spin"
                  aria-hidden="true" /><component
                  v-else
                  :is="context(row).expanded ? ChevronDown : ChevronRight"
                  :size="15"
                  aria-hidden="true"
              /></slot></button
            ><span v-else class="hys-ui-pf-tree-spacer"
              ><slot name="switcher" v-bind="context(row)"
            /></span>
            <HysCheckbox
              v-if="checkable && row.checkable"
              :tabindex="-1"
              :model-value="checked.has(row.key)"
              :indeterminate="halfChecked.has(row.key)"
              :disabled="busy || row.checkboxDisabled"
              :aria-label="words.check + ' ' + row.label"
              @click.stop
              @update:model-value="
                (on) => setChecked(row.key, on, !checkStrictly)
              "
            />
            <span
              v-if="showIcon && (row.icon || $slots.icon)"
              class="hys-ui-tree-icon"
              aria-hidden="true"
              ><slot name="icon" v-bind="context(row)">{{
                row.icon
              }}</slot></span
            >
            <span class="hys-ui-pf-tree-label"
              ><slot name="node" v-bind="context(row)"
                ><slot v-bind="context(row)"
                  ><component
                    :is="() => renderContent!(context(row))"
                    v-if="renderContent"
                  /><template v-else>{{ row.label }}</template></slot
                ></slot
              ></span
            >
            <button
              v-if="failures.has(row.key)"
              type="button"
              class="hys-ui-tree-retry"
              :disabled="busy || row.disabled"
              @click.stop="store.reloadNode(row.key)"
            >
              {{ words.loadError }} · {{ words.retry }}
            </button>
            <span v-if="$slots.actions" class="hys-ui-tree-actions" @click.stop
              ><slot name="actions" v-bind="context(row)" /></span
            ><GripVertical
              v-if="draggable"
              class="hys-ui-tree-grip"
              :size="13"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div v-if="!visible.length && !loading" class="hys-ui-pf-tree-empty">
        <slot name="empty" :query="query">{{
          query.trim() ? words.noMatch : emptyText || words.empty
        }}</slot>
      </div>
    </div>
    <Teleport to="body"><div v-if="menu"
          v-bind="attrs"
          class="hys-ui-tree-menu-backdrop"
          @click="closeMenu()"
          @contextmenu.prevent="closeMenu()"
        /><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" @inactive="closeMenu"><div v-if="menu"
          ref="menuPanel"
          v-bind="attrs"
          class="hys-ui-tree-context"
          :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
          role="menu"
          @keydown="menuKeys"
        >
          <slot
            name="contextmenu"
            :node="menu.node"
            :key="menu.key"
            :close="closeMenu"
            ><HysButton
              role="menuitem"
              variant="ghost"
              :disabled="busy"
              @click="
                store.setCurrentKey(menu.key);
                closeMenu();
              "
              >{{ words.select }}</HysButton
            ><HysButton
              role="menuitem"
              variant="ghost"
              :disabled="busy || !index.map.get(menu.key)?.hasChildren"
              @click="
                expandNode(menu.key, !expanded.has(menu.key));
                closeMenu();
              "
              >{{
                expanded.has(menu.key) ? words.collapse : words.expand
              }}</HysButton
            ><HysButton role="menuitem" variant="ghost" @click="closeMenu()">{{
              words.close
            }}</HysButton></slot
          >
        </div></PopupMotion></Teleport
    >
  </div>
</template>
<style scoped>
.hys-ui-pf-tree {
  font-size: 13px;
  min-width: 0;
  color: var(--hys-ui-text-primary, var(--hys-ui-theme-text-primary, #26344a));
}
.hys-ui-tree-search {
  margin-bottom: 10px;
}
.hys-ui-pf-tree-list {
  overflow: auto;
  overscroll-behavior: contain;
  position: relative;
  isolation: isolate;
}
.hys-ui-tree-space,
.hys-ui-tree-rows {
  position: relative;
  min-width: 0;
}
.hys-ui-pf-tree-row {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: var(--hys-ui-tree-row-height);
  padding: 6px 10px 6px
    calc(8px + var(--hys-ui-tree-depth) * var(--hys-ui-tree-indent));
  border-radius: 7px;
  margin-block: 3px;
  cursor: pointer;
  outline-offset: -2px;
}
.hys-ui-pf-tree-row:hover {
  background: var(
    --hys-ui-surface-hover,
    var(--hys-ui-theme-surface-hover, #f3f6fb)
  );
}
.hys-ui-pf-tree-row:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary, #3674e9));
}
.hys-ui-pf-tree-selected {
  background: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft, #eaf0ff)
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary, #3674e9));
  font-weight: 600;
}
.hys-ui-pf-tree-selected:hover {
  background: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft, #eaf0ff)
  );
}
.hys-ui-tree-matched .hys-ui-pf-tree-label {
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  text-underline-offset: 4px;
}
.hys-ui-pf-tree-expander,
.hys-ui-pf-tree-spacer {
  width: 22px;
  height: 22px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hys-ui-pf-tree-expander {
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.hys-ui-pf-tree-expander:hover {
  background: var(
    --hys-ui-surface-hover,
    var(--hys-ui-theme-surface-hover, #eef3fc)
  );
}
.hys-ui-pf-tree-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-tree-row-disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
.hys-ui-pf-tree-disabled .hys-ui-pf-tree-row {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-tree-icon,
.hys-ui-tree-grip {
  display: inline-flex;
  flex: none;
  color: var(
    --hys-ui-text-secondary,
    var(--hys-ui-theme-text-secondary, #8a96ab)
  );
}
.hys-ui-tree-grip {
  opacity: 0;
}
.hys-ui-pf-tree-row:hover .hys-ui-tree-grip,
.hys-ui-pf-tree-row:focus-visible .hys-ui-tree-grip {
  opacity: 1;
}
.hys-ui-tree-row-dragging {
  opacity: 0.45;
}
.hys-ui-pf-tree-drop[data-drop-position="inside"] {
  outline: 2px dashed var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-pf-tree-drop[data-drop-position="before"]:before,
.hys-ui-pf-tree-drop[data-drop-position="after"]:after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  z-index: 2;
}
.hys-ui-pf-tree-drop[data-drop-position="before"]:before {
  top: 0;
}
.hys-ui-pf-tree-drop[data-drop-position="after"]:after {
  bottom: 0;
}
.hys-ui-pf-tree-line:before {
  content: "";
  position: absolute;
  left: calc(19px + (var(--hys-ui-tree-depth) - 1) * var(--hys-ui-tree-indent));
  height: 100%;
  border-left: 1px dashed
    var(--hys-ui-border, var(--hys-ui-theme-border, #d7deea));
  opacity: 0.8;
}
.hys-ui-pf-tree-line[aria-level="1"]:before {
  display: none;
}
.hys-ui-tree-virtual {
  overflow-anchor: none;
}
.hys-ui-tree-virtual .hys-ui-pf-tree-row {
  height: var(--hys-ui-tree-row-height);
  min-height: var(--hys-ui-tree-row-height);
  margin: 0;
  padding-block: 0;
}
.hys-ui-pf-tree-empty {
  padding: 24px;
  text-align: center;
  color: var(--hys-ui-text-secondary, var(--hys-ui-theme-text-secondary, #778));
}
.hys-ui-tree-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: absolute;
  inset: 0;
  min-height: 80px;
  z-index: 5;
  background: color-mix(
    in srgb,
    var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff)) 85%,
    transparent
  );
}
.hys-ui-tree-retry {
  border: 0;
  background: transparent;
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #d24a50));
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.hys-ui-tree-actions {
  display: flex;
  gap: 4px;
  flex: none;
}
.hys-ui-tree-inline .hys-ui-pf-tree-label {
  flex: none;
}
.hys-ui-pf-tree[data-size="sm"] {
  font-size: 12px;
}
.hys-ui-pf-tree[data-size="lg"] {
  font-size: 14px;
}
.hys-ui-tree-context {
  position: fixed;
  z-index: 10001;
  min-width: 200px;
  max-width: calc(100vw - 16px);
  padding: 6px;
  display: grid;
  gap: 3px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border, #d7deea));
  border-radius: 10px;
  box-shadow: 0 12px 32px #0002;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  color: var(--hys-ui-text-primary, var(--hys-ui-theme-text-primary, #26344a));
}
.hys-ui-tree-context :deep(button) {
  justify-content: flex-start;
  text-align: left;
}
.hys-ui-tree-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: transparent;
}
@media (prefers-reduced-motion: no-preference) {
  .hys-ui-pf-tree-row {
    transition:
      background 0.12s ease,
      opacity 0.12s ease;
  }
}
[data-hys-motion="off"] .hys-ui-pf-tree-row {
  transition: none;
}
</style>
