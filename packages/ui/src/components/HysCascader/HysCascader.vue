<script
  setup
  lang="ts"
  generic="
    V extends HysCascaderValue = string[],
    N extends object = HysCascaderNode
  "
>
import PopupMotion from '../../motion/PopupMotion';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  provide,
  ref,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
  type InjectionKey,
} from "vue";
import { ChevronDown, Search, X, LoaderCircle } from "lucide-vue-next";
import HysInput from "../HysInput/HysInput.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysCascaderColumn from "./HysCascaderColumn.vue";
import { useHysRootAttrs } from "../../config";
import { useFloating } from "../../composables/useFloating";
import {
  fieldKey,
  useHysControlState,
  useHysFormItemContext,
  type HysFieldContext,
} from "../../composables/formContext";
import { useCascader } from "../../composables/useCascader";
import {
  cascaderToken,
  type HysCascaderProps,
  type HysCascaderValue,
  type HysCascaderNode,
  type HysCascaderKey,
  type HysCascaderPath,
  type CascaderEntry,
  type HysCascaderItem,
  type HysCascaderOptionContext,
  type HysCascaderChange,
} from "../../composables/cascader";
export type { HysCascaderNode } from "../../composables/cascader";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysCascaderProps<N, V>>(), {
  open: undefined,
  showAllLevels: true,
  separator: " / ",
  placeholder: "选择分类",
  emitPath: true,
  removable: true,
  maxTagCount: 3,
  showCheckedStrategy: "child",
  showPrefix: true,
  checkOnClickLeaf: true,
  clearSearchAfterSelect: true,
  expandTrigger: "click",
  hoverDelay: 150,
  showFooter: true,
  popupMatchWidth: true,
  appendTo: "body",
  columnWidth: 180,
  listHeight: 256,
  overscan: 4,
  searchLimit: 50,
  validateEvent: true,
});
defineSlots<{
  option?: (scope: HysCascaderOptionContext<N>) => any;
  suggestion?: (scope: HysCascaderOptionContext<N>) => any;
  display?: (scope: { item: HysCascaderItem<N> }) => any;
  tag?: (scope: {
    item: HysCascaderItem<N>;
    remove: () => Promise<boolean>;
  }) => any;
  "max-tag-placeholder"?: (scope: {
    items: HysCascaderItem<N>[];
    count: number;
  }) => any;
  prefix?: () => any;
  suffix?: () => any;
  "clear-icon"?: () => any;
  "remove-icon"?: () => any;
  "expand-icon"?: (scope: HysCascaderOptionContext<N>) => any;
  header?: () => any;
  footer?: (scope: {
    items: HysCascaderItem<N>[];
    clear: () => Promise<boolean>;
    close: () => void;
  }) => any;
  empty?: (scope: { query: string; level: number }) => any;
  loading?: (scope: { level: number }) => any;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: V];
  change: [value: V, info: HysCascaderChange<N>];
  "value-change": [value: V, info: HysCascaderChange<N>];
  "update:open": [value: boolean];
  "visible-change": [value: boolean];
  "update:searchValue": [value: string];
  search: [value: string];
  "search-error": [error: unknown, query: string];
  "update:expandedPath": [path: HysCascaderKey[]];
  expandChange: [path: HysCascaderKey[], nodes: N[]];
  "node-expand": [node: N, context: { path: HysCascaderKey[] }];
  "node-collapse": [node: N, context: { path: HysCascaderKey[] }];
  "load-error": [info: { node: N; path: HysCascaderKey[]; error: unknown }];
  "children-loaded": [info: { node: N; path: HysCascaderKey[]; children: N[] }];
  load: [info: { node: N; path: HysCascaderKey[]; children: N[] }];
  "root-load": [nodes: readonly N[]];
  "root-load-error": [error: unknown];
  select: [path: HysCascaderKey[], nodes: N[], event?: Event];
  "remove-tag": [path: HysCascaderKey[], node?: N];
  clear: [];
  limit: [limit: number];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  scroll: [info: { level: number; event: Event }];
}>();
const attrs = useAttrs(),
  rootAttrs = useHysRootAttrs(),
  control = useHysControlState(props),
  field = useHysFormItemContext(),
  trigger = ref<HTMLElement>(),
  panel = ref<HTMLElement>(),
  search = ref<InstanceType<typeof HysInput>>(),
  columnsElement = ref<HTMLElement>(),
  id = useId(),
  wrappingLabel = ref(""),
  live = ref(true);
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
let focusInside = false,
  hasOpened = false,
  openEpoch = 0,
  restoreRequested = false,
  hoverTimer: ReturnType<typeof setTimeout> | undefined;
const floating = useFloating(trigger, panel, {
    get placement() {
      return props.placement;
    },
    matchWidth: () => (props.popupMatchWidth ? true : "min"),
    width: () => props.popupWidth,
    requestOpen: (next, restore) => {
      if (!next) restoreRequested = !!restore;
      emit("update:open", next);
      return props.open === undefined ? undefined : false;
    },
  }),
  open = floating.open,
  active = computed(() => live.value && (props.inline || open.value));
const store = useCascader(
  props,
  control.disabled,
  active,
  (name, ...args) =>
    (emit as (name: string, ...args: any[]) => void)(name, ...args),
  () => {
    void field.validate("change");
  },
);
const { items, multiple, blocked, words } = store,
  query = store.engine.query;
const menuVisible = computed(() => props.inline || open.value),
  panelStyle = computed<CSSProperties>(() =>
    props.inline
      ? {
          ...props.popupStyle,
          position: "static",
          width: "100%",
          maxWidth: "100%",
          boxShadow: "none",
        }
      : {
          ...props.popupStyle,
          ...floating.style.value,
          maxHeight: "min(65dvh,calc(100dvh - 20px))",
        },
  ),
  rootStyle = computed<CSSProperties>(() => ({
    "--hys-ui-cascader-control-height":
      (control.size.value === "sm"
        ? 30
        : control.size.value === "lg"
          ? 44
          : 38) + "px",
  }));
const searching = computed(() => !!props.filterable && !!query.value.trim()),
  rowsDisabled = computed(
    () => blocked.value || store.checking.value || store.rootPending.value,
  ),
  tagLimit = computed(() =>
    Number.isFinite(props.maxTagCount)
      ? Math.max(0, Math.floor(props.maxTagCount))
      : Infinity,
  ),
  visibleItems = computed(() => items.value.slice(0, tagLimit.value)),
  omitted = computed(() => items.value.slice(tagLimit.value)),
  canClear = computed(
    () =>
      props.clearable &&
      !blocked.value &&
      items.value.some((item) => !item.disabled),
  );
type ColumnView = {
  focus: (key?: string) => Promise<void>;
  element?: HTMLElement;
};
const views = new Map<number, ColumnView>();
function bindView(level: number, view: unknown) {
  if (view) views.set(level, view as ColumnView);
  else views.delete(level);
}
function bindInline(element: unknown) {
  if (props.inline)
    trigger.value = element instanceof HTMLElement ? element : undefined;
}
function columnKey(level: number) {
  return level ? cascaderToken(store.browsing.value.slice(0, level)) : "root";
}
function context(entry: CascaderEntry<N>): HysCascaderOptionContext<N> {
  const row = store.engine.tree.index.value.map.get(entry.value);
  return {
    ...store.item(entry.value),
    node: entry.raw,
    level: entry.path.length - 1,
    leaf: !row?.hasChildren,
    expanded: store.engine.tree.expanded.value.has(entry.value),
    checked: multiple.value
      ? store.engine.tree.checked.value.has(entry.value)
      : store.modelKeys.value.includes(entry.value),
    indeterminate: store.engine.tree.halfChecked.value.has(entry.value),
    loading: store.engine.tree.loadingKeys.value.has(entry.value),
  };
}
const hasChildren = (entry: CascaderEntry<N>) =>
  !!store.engine.tree.index.value.map.get(entry.value)?.hasChildren;
const rowHeight = computed(
  () =>
    props.itemHeight ??
    (control.size.value === "sm" ? 30 : control.size.value === "lg" ? 42 : 36),
);
const rowError = (entry: CascaderEntry<N>) =>
  store.engine.tree.failures.value.get(entry.value);
const label = (text: string, itemLabel: string) =>
  text.replace("{label}", itemLabel);
function render(item: HysCascaderItem<N>) {
  return props.displayRender?.(item) ?? item.label;
}
function tagText(item: HysCascaderItem<N>) {
  return props.maxTagTextLength !== undefined && props.maxTagTextLength >= 0
    ? item.label.slice(0, props.maxTagTextLength) +
        (item.label.length > props.maxTagTextLength ? "…" : "")
    : undefined;
}
function controlAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !["class", "style"].includes(key)),
  );
}
function syncLabel() {
  const label = trigger.value?.closest("label");
  if (!label) return;
  const copy = label.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".hys-ui-cascader-wrap").forEach((el) => el.remove());
  wrappingLabel.value = (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}
function cancelHover() {
  clearTimeout(hoverTimer);
  hoverTimer = undefined;
}
async function focusColumn(level: number, key?: string) {
  if (!views.has(level)) await nextTick();
  if (!active.value || rowsDisabled.value) return;
  await views.get(level)?.focus(key);
  const view = views.get(level)?.element,
    root = columnsElement.value;
  if (view && root) {
    const left =
      view.getBoundingClientRect().left -
      root.getBoundingClientRect().left +
      root.scrollLeft;
    if (left < root.scrollLeft) root.scrollLeft = left;
    else if (left + view.offsetWidth > root.scrollLeft + root.clientWidth)
      root.scrollLeft = left + view.offsetWidth - root.clientWidth;
  }
}
async function expandEntry(entry: CascaderEntry<N>, moveFocus = false) {
  if (rowsDisabled.value || entry.disabled) return false;
  cancelHover();
  const epoch = openEpoch;
  const ok = await store.expandPath(entry.path);
  await nextTick();
  if (!active.value || epoch !== openEpoch) return false;
  floating.update();
  if (moveFocus && ok) await focusColumn(entry.path.length);
  return ok;
}
function hover(entry: CascaderEntry<N> | null) {
  cancelHover();
  if (
    props.expandTrigger !== "hover" ||
    !entry ||
    !hasChildren(entry) ||
    rowsDisabled.value ||
    entry.disabled
  )
    return;
  hoverTimer = setTimeout(
    () => {
      hoverTimer = undefined;
      void expandEntry(entry);
    },
    Math.max(0, Math.min(1000, props.hoverDelay)),
  );
}
async function choose(
  entry: CascaderEntry<N>,
  event?: Event,
  explicit?: boolean,
) {
  if (rowsDisabled.value || entry.disabled) return;
  cancelHover();
  const epoch = openEpoch;
  const wasBranch = hasChildren(entry);
  if (wasBranch && explicit === undefined && !searching.value)
    if (!(await expandEntry(entry))) return;
  if (!active.value || epoch !== openEpoch) return;
  const clickChecks =
    explicit !== undefined ||
    searching.value ||
    (props.changeOnSelect && !multiple.value) ||
    props.checkOnClickNode ||
    !props.showPrefix ||
    (!hasChildren(entry) && props.checkOnClickLeaf);
  if (
    !clickChecks ||
    (!multiple.value && !store.anyLevel.value && hasChildren(entry))
  )
    return;
  const accepted = await store.pick(entry.value, event, explicit);
  if (!active.value || epoch !== openEpoch) return;
  if (
    !multiple.value &&
    (accepted || store.modelKeys.value.includes(entry.value)) &&
    !hasChildren(entry) &&
    !props.inline
  )
    floating.close(true);
  else if (
    !multiple.value &&
    props.checkStrictly &&
    explicit !== undefined &&
    accepted &&
    !props.inline
  )
    floating.close(true);
}
async function retry(entry: CascaderEntry<N>) {
  if (await store.reloadNode(entry.path)) await focusColumn(entry.path.length);
}
function keyboard(
  event: KeyboardEvent,
  entry: CascaderEntry<N>,
  level: number,
) {
  if (event.isComposing || event.keyCode === 229 || rowsDisabled.value) return;
  const target = event.target as HTMLElement;
  if (
    target.closest("button") ||
    (target.matches("input") && ["Enter", " "].includes(event.key))
  )
    return;
  const list = searching.value
      ? store.searchResults.value
      : (store.columns.value[level] ?? []),
    enabled = list.filter((row) => !row.disabled),
    at = enabled.findIndex((row) => row.value === entry.value);
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? enabled.length - 1
          : (at + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) %
            enabled.length;
    void focusColumn(level, enabled[next]?.value);
  } else if (event.key === "ArrowRight" && !searching.value) {
    event.preventDefault();
    if (hasChildren(entry)) void expandEntry(entry, true);
  } else if (event.key === "ArrowLeft" && !searching.value && level > 0) {
    event.preventDefault();
    void focusColumn(level - 1, cascaderToken(entry.path.slice(0, level)));
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (multiple.value || props.checkStrictly)
      void choose(entry, event, !context(entry).checked);
    else if (hasChildren(entry)) void expandEntry(entry, true);
    else void choose(entry, event);
  }
}
function searchKeys(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || rowsDisabled.value) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const level = searching.value ? -1 : 0,
      list = searching.value
        ? store.searchResults.value
        : (store.columns.value[0] ?? []),
      enabled = list.filter((entry) => !entry.disabled);
    void focusColumn(
      level,
      event.key === "ArrowUp" ? enabled.at(-1)?.value : enabled[0]?.value,
    );
  }
}
async function expand(focusPanel = true, force = false): Promise<boolean> {
  if (!live.value || control.disabled.value || props.readonly) return false;
  const epoch = openEpoch,
    wasOpen = open.value,
    firstOpen = !hasOpened;
  if (!props.inline) await floating.show(force);
  await nextTick();
  if (!active.value || epoch !== openEpoch) return false;
  if (!props.inline && !wasOpen && hasOpened && !props.retainSearch)
    store.filter("");
  hasOpened = true;
  if (
    !firstOpen &&
    !wasOpen &&
    !props.inline &&
    props.expandedPath === undefined
  )
    await store.engine.tree.setExpandedKeys([]);
  if (!store.browsing.value.length && store.selectedPaths.value[0]?.length)
    void store.expandPath(store.selectedPaths.value[0]);
  await nextTick();
  if (!active.value || epoch !== openEpoch) return false;
  if (focusPanel) {
    if (props.filterable) search.value?.focus();
    else await focusColumn(0);
  }
  return true;
}
function hide(restore = false) {
  if (!props.inline) floating.close(restore);
}
function toggle(event: MouseEvent) {
  if ((event.target as Element)?.closest("button")) return;
  if (open.value) hide();
  else void expand();
}
function triggerKeys(event: KeyboardEvent) {
  if (
    event.isComposing ||
    event.keyCode === 229 ||
    event.target !== trigger.value
  )
    return;
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    void expand();
  } else if (event.key === "Backspace" && multiple.value && !blocked.value) {
    const item = [...items.value].reverse().find((item) => !item.disabled);
    if (item) {
      event.preventDefault();
      void store.removeTag(item.path);
    }
  }
}
async function clear() {
  const ok = await store.clear();
  if (ok && !props.inline) hide(true);
  return ok;
}
function focus(event: FocusEvent) {
  if (!focusInside) {
    focusInside = true;
    emit("focus", event);
  }
  if (
    event.target === trigger.value &&
    props.showOnFocus &&
    !floating.restoringFocus.value &&
    !props.inline
  )
    void expand(false);
}
async function blur(event: FocusEvent) {
  await nextTick();
  if (!live.value) return;
  const next = document.activeElement;
  if (trigger.value?.contains(next) || panel.value?.contains(next)) return;
  if (focusInside) {
    focusInside = false;
    emit("blur", event);
    if (props.validateEvent) void field.validate("blur");
  }
}
async function scrollTo(path: HysCascaderPath) {
  if (await expand(false)) {
    if (await store.expandPath(path))
      await focusColumn(path.length - 1, cascaderToken(path));
  }
}
async function setExpandedPath(path: HysCascaderPath) {
  return (await expand(false)) ? store.expandPath(path) : false;
}
watch(
  () => props.open,
  (value) => {
    if (!live.value || props.inline) return;
    if (value) void expand(false, true);
    else {
      const restore = restoreRequested;
      restoreRequested = false;
      floating.close(restore, true);
    }
  },
);
watch(open, (value) => {
  emit("visible-change", value);
  if (!value) {
    openEpoch++;
    cancelHover();
    if (!props.retainSearch) store.filter("");
  }
});
watch(
  [control.disabled, () => props.readonly],
  ([disabled, readonly]) => {
    if (disabled || readonly) {
      cancelHover();
      floating.close(false, true);
      if (props.open) emit("update:open", false);
    }
  },
  { flush: "sync" },
);
watch(
  [
    items,
    query,
    store.browsing,
    () => control.size.value,
    () => props.popupWidth,
    () => props.popupMatchWidth,
  ],
  () => {
    void nextTick().then(() => floating.update());
  },
);
watch(store.browsing, cancelHover);
watch(store.rootPending, (pending) => {
  if (
    !pending &&
    active.value &&
    !blocked.value &&
    !store.rootError.value &&
    !store.browsing.value.length &&
    store.selectedPaths.value[0]?.length
  )
    void store.expandPath(store.selectedPaths.value[0]);
});
onMounted(() => {
  syncLabel();
  if (props.inline && store.selectedPaths.value[0]?.length)
    void store.expandPath(store.selectedPaths.value[0]);
  else if (props.open ?? props.defaultOpen) void expand(false, true);
  if (props.autofocus && !control.disabled.value) trigger.value?.focus();
});
onUpdated(syncLabel);
onActivated(() => {
  live.value = true;
  if (props.open && !props.inline) void expand(false, true);
});
function cleanup() {
  live.value = false;
  openEpoch++;
  focusInside = false;
  cancelHover();
  floating.close(false, true);
}
onBeforeUnmount(cleanup);
onDeactivated(cleanup);
defineExpose({
  element: trigger,
  open: active,
  focus: () => {
    if (!control.disabled.value) trigger.value?.focus();
  },
  blur: () => {
    hide();
    if (
      trigger.value?.contains(document.activeElement) ||
      panel.value?.contains(document.activeElement)
    )
      (document.activeElement as HTMLElement)?.blur();
  },
  show: () => expand(),
  hide,
  clear,
  clearCheckedNodes: clear,
  removeTag: store.removeTag,
  setValue: store.setValue,
  filter: store.filter,
  getSelectedItems: () => [...items.value],
  getCheckedNodes: store.getCheckedNodes,
  getExpandedPath: () => [...store.browsing.value],
  setExpandedPath,
  reloadNode: store.reloadNode,
  reloadRoot: store.reloadRoot,
  scrollTo,
});
</script>
<template>
  <div
    :ref="bindInline"
    v-bind="rootAttrs"
    class="hys-ui-cascader-wrap"
    :class="[
      $attrs.class,
      'hys-ui-cascader-' + control.size.value,
      { 'hys-ui-cascader-inline-managed': inline },
    ]"
    :style="[$attrs.style as CSSProperties, rootStyle]"
    :id="inline ? ($attrs.id as string) || field.id.value || id : undefined"
    :role="inline ? 'group' : undefined"
    :data-hys-ui-field-managed="inline ? '' : undefined"
    :aria-label="
      inline
        ? ariaLabel || field.label.value || wrappingLabel || words.panel
        : undefined
    "
    :aria-invalid="
      (inline && (status === 'error' || field.invalid.value)) || undefined
    "
    :aria-describedby="inline ? field.describedBy.value : undefined"
    :aria-disabled="(inline && control.disabled.value) || undefined"
    :tabindex="inline ? (control.disabled.value ? -1 : 0) : undefined"
    @keydown="inline && triggerKeys($event)"
    @focusin="inline && focus($event)"
    @focusout="inline && blur($event)"
  >
    <button
      hidden
      type="button"
      tabindex="-1"
      aria-hidden="true"
      :disabled="control.disabled.value"
      @click.prevent="
        trigger?.focus();
        expand();
      "
    />
    <div
      v-if="!inline"
      ref="trigger"
      v-bind="controlAttrs()"
      :id="($attrs.id as string) || field.id.value || id"
      data-hys-ui-field-managed
      role="combobox"
      aria-haspopup="dialog"
      :aria-controls="open ? id + '-panel' : undefined"
      :aria-expanded="open"
      :aria-label="
        ariaLabel ||
        field.label.value ||
        wrappingLabel ||
        placeholder ||
        words.panel
      "
      :aria-disabled="control.disabled.value || undefined"
      :aria-readonly="readonly || undefined"
      :aria-invalid="status === 'error' || field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
      :aria-required="field.required.value || undefined"
      :aria-busy="loading || store.checking.value || undefined"
      :tabindex="control.disabled.value ? -1 : 0"
      class="hys-ui-cascader-control"
      :class="{
        'hys-ui-cascader-control-disabled': control.disabled.value,
        'hys-ui-cascader-control-error':
          status === 'error' || field.invalid.value,
        'hys-ui-cascader-control-warning': status === 'warning',
        'hys-ui-cascader-control-success': status === 'success',
      }"
      @click="toggle"
      @keydown="triggerKeys"
      @focusin="focus"
      @focusout="blur"
    >
      <span v-if="$slots.prefix" class="hys-ui-cascader-prefix"
        ><slot name="prefix"
      /></span>
      <span v-if="!items.length" class="hys-ui-cascader-placeholder">{{
        placeholder
      }}</span>
      <div v-else-if="multiple" class="hys-ui-cascader-tags">
        <template v-for="item in visibleItems" :key="cascaderToken(item.path)"
          ><slot
            name="tag"
            :item="item"
            :remove="() => store.removeTag(item.path)"
            ><span
              class="hys-ui-cascader-tag"
              :class="{ 'hys-ui-cascader-tag-disabled': item.disabled }"
              ><span class="hys-ui-cascader-tag-label"
                ><template v-if="tagText(item) !== undefined">{{
                  tagText(item)
                }}</template
                ><component :is="() => render(item)" v-else /></span
              ><button
                v-if="removable"
                type="button"
                class="hys-ui-cascader-tag-remove"
                :disabled="blocked || item.disabled"
                :aria-label="label(words.remove, item.label)"
                @mousedown.prevent
                @click.stop="store.removeTag(item.path)"
              >
                <slot name="remove-icon"
                  ><X :size="12"
                /></slot></button></span></slot
        ></template>
        <HysTooltip
          v-if="omitted.length"
          :text="
            omitted
              .slice(0, 20)
              .map((item) => item.label)
              .join('、')
          "
          ><span
            class="hys-ui-cascader-tag hys-ui-cascader-more"
            :aria-label="words.more.replace('{count}', String(omitted.length))"
            ><slot
              name="max-tag-placeholder"
              :items="omitted"
              :count="omitted.length"
              >+{{ omitted.length }}</slot
            ></span
          ></HysTooltip
        >
      </div>
      <span v-else class="hys-ui-cascader-value"
        ><slot name="display" :item="items[0]"
          ><component :is="() => render(items[0])" /></slot
      ></span>
      <span class="hys-ui-cascader-indicators"
        ><LoaderCircle
          v-if="loading || store.checking.value"
          :size="15"
          class="hys-ui-icon-spin" /><button
          v-if="canClear"
          type="button"
          class="hys-ui-cascader-clear"
          :aria-label="words.clear"
          @mousedown.prevent
          @click.stop="clear"
        >
          <slot name="clear-icon"><X :size="14" /></slot></button
        ><slot name="suffix"
          ><ChevronDown
            :size="16"
            class="hys-ui-cascader-chevron"
            :class="{ 'hys-ui-cascader-chevron-open': open }" /></slot
      ></span>
    </div>
    <template v-if="name"
      ><input
        v-for="item in items"
        :key="cascaderToken(item.path)"
        type="hidden"
        :name="name"
        :form="form"
        :value="emitPath ? JSON.stringify(item.path) : item.value"
        :disabled="control.disabled.value"
    /></template>
    <Teleport
      :to="appendTo === false || inline ? 'body' : appendTo"
      :disabled="appendTo === false || inline"
    >
      <PopupMotion :disabled="inline" :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="floating.placement.value"><div
        v-if="menuVisible"
        :id="id + '-panel'"
        ref="panel"
        v-bind="rootAttrs"
        class="hys-ui-cascader-menu hys-ui-scrollbar"
        :class="[
          popupClass,
          'hys-ui-cascader-' + control.size.value,
          {
            'hys-ui-cascader-inline': inline,
            'hys-ui-cascader-menu-disabled': control.disabled.value,
          },
        ]"
        :style="panelStyle"
        :role="inline ? 'group' : 'dialog'"
        :aria-label="words.panel"
        :aria-busy="
          loading ||
          store.rootPending.value ||
          store.checking.value ||
          undefined
        "
        @focusin="focus"
        @focusout="blur"
      >
        <header v-if="$slots.header" class="hys-ui-cascader-header">
          <slot name="header" />
        </header>
        <HysInput
          v-if="filterable"
          ref="search"
          :model-value="query"
          class="hys-ui-cascader-search"
          :aria-label="words.search"
          :placeholder="words.search"
          :disabled="blocked"
          :size="control.size.value"
          clearable
          @update:model-value="store.filter"
          @keydown="searchKeys"
          ><template #prefix><Search :size="14" /></template
        ></HysInput>
        <div
          v-if="
            loading ||
            store.rootPending.value ||
            (searching && store.filterPending.value)
          "
          class="hys-ui-cascader-status"
          role="status"
        >
          <slot name="loading" :level="0"
            ><LoaderCircle :size="17" class="hys-ui-icon-spin" />{{
              words.loading
            }}</slot
          >
        </div>
        <div
          v-else-if="
            store.rootError.value || (searching && store.filterError.value)
          "
          class="hys-ui-cascader-status hys-ui-cascader-error"
          role="alert"
        >
          <span>{{ words.loadError }}</span
          ><HysButton
            size="sm"
            variant="ghost"
            @click="
              store.rootError.value ? store.reloadRoot() : store.retrySearch()
            "
            >{{ words.retry }}</HysButton
          >
        </div>
        <template v-else-if="searching">
          <HysCascaderColumn
            v-if="store.searchResults.value.length"
            :ref="(view) => bindView(-1, view)"
            :rows="store.searchResults.value"
            :level="-1"
            :label="words.search"
            :multiple="multiple"
            :strict="checkStrictly"
            :show-prefix="showPrefix"
            :disabled="rowsDisabled"
            :search="true"
            :size="control.size.value"
            :virtual="virtual"
            :list-height="listHeight"
            :item-height="rowHeight"
            :overscan="overscan"
            :context="context"
            :has-children="hasChildren"
            :error="rowError"
            :retry-text="words.retry"
            :expand-label="(entry) => label(words.expand, entry.label)"
            @choose="choose"
            @keyboard="keyboard"
            @retry="retry"
            @scroll="emit('scroll', { level: -1, event: $event })"
            ><template v-if="$slots.suggestion" #suggestion="scope"
              ><slot name="suggestion" v-bind="scope" /></template
          ></HysCascaderColumn>
          <div v-else class="hys-ui-cascader-status" role="status">
            <slot name="empty" :query="query" :level="0">{{
              words.noMatch
            }}</slot>
          </div>
        </template>
        <div v-else ref="columnsElement" class="hys-ui-cascader-columns hys-ui-scrollbar">
          <template
            v-for="(rows, level) in store.columns.value"
            :key="columnKey(level)"
          >
            <HysCascaderColumn
              v-if="rows.length"
              :ref="(view) => bindView(level, view)"
              :rows="rows"
              :level="level"
              :label="words.level.replace('{level}', String(level + 1))"
              :active-key="
                store.browsing.value[level] === undefined
                  ? undefined
                  : cascaderToken(store.browsing.value.slice(0, level + 1))
              "
              :multiple="multiple"
              :strict="checkStrictly"
              :show-prefix="showPrefix"
              :disabled="rowsDisabled"
              :size="control.size.value"
              :virtual="virtual"
              :list-height="listHeight"
              :item-height="rowHeight"
              :overscan="overscan"
              :column-width="columnWidth"
              :context="context"
              :has-children="hasChildren"
              :error="rowError"
              :retry-text="words.retry"
              :expand-label="(entry) => label(words.expand, entry.label)"
              @choose="choose"
              @expand="expandEntry"
              @hover="hover"
              @keyboard="keyboard"
              @retry="retry"
              @scroll="emit('scroll', { level, event: $event })"
              ><template v-if="$slots.option" #option="scope"
                ><slot name="option" v-bind="scope" /></template
              ><template v-if="$slots['expand-icon']" #expand-icon="scope"
                ><slot name="expand-icon" v-bind="scope" /></template
            ></HysCascaderColumn>
            <div
              v-else
              class="hys-ui-cascader-empty-column"
              :style="{
                minWidth:
                  typeof columnWidth === 'number'
                    ? columnWidth + 'px'
                    : columnWidth,
              }"
            >
              <div class="hys-ui-cascader-status" role="status">
                <template
                  v-if="
                    level &&
                    store.engine.tree.loadingKeys.value.has(columnKey(level))
                  "
                  ><LoaderCircle :size="16" class="hys-ui-icon-spin" />{{
                    words.loading
                  }}</template
                ><template
                  v-else-if="
                    level &&
                    store.engine.tree.failures.value.has(columnKey(level))
                  "
                  >{{ words.loadError }}</template
                ><slot v-else name="empty" :query="query" :level="level">{{
                  words.empty
                }}</slot>
              </div>
            </div>
          </template>
        </div>
        <footer
          v-if="$slots.footer || (showFooter && (!inline || clearable))"
          class="hys-ui-cascader-footer"
        >
          <slot
            name="footer"
            :items="items"
            :clear="clear"
            :close="() => hide(true)"
            ><HysButton
              v-if="clearable"
              size="sm"
              variant="ghost"
              :disabled="blocked || !items.some((item) => !item.disabled)"
              @click="clear"
              >{{ words.clear }}</HysButton
            ><HysButton
              v-if="!inline"
              size="sm"
              variant="secondary"
              @click="hide(true)"
              >{{ words.close }}</HysButton
            ></slot
          >
        </footer>
      </div></PopupMotion>
    </Teleport>
  </div>
</template>
<style scoped>
.hys-ui-cascader-wrap {
  min-width: 0;
  width: 100%;
  position: relative;
  font-size: 13px;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-cascader-control {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: var(--hys-ui-cascader-control-height);
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 9px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: inherit;
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}
.hys-ui-cascader-control:hover:not(.hys-ui-cascader-control-disabled) {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-control:focus-visible,
.hys-ui-cascader-control[aria-expanded="true"] {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 12%,
      transparent
    );
}
.hys-ui-cascader-control-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-cascader-control-error {
  border-color: var(--hys-ui-danger, var(--hys-ui-theme-danger));
}
.hys-ui-cascader-control-warning {
  border-color: var(--hys-ui-warning, var(--hys-ui-theme-warning));
}
.hys-ui-cascader-control-success {
  border-color: var(--hys-ui-success, var(--hys-ui-theme-success));
}
.hys-ui-cascader-placeholder,
.hys-ui-cascader-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}
.hys-ui-cascader-placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-cascader-indicators {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-cascader-chevron {
  transition: transform 0.16s ease;
}
.hys-ui-cascader-chevron-open {
  transform: rotate(180deg);
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-clear,
.hys-ui-cascader-tag-remove {
  border: 0;
  background: transparent;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  border-radius: 4px;
  width: 18px;
  height: 18px;
  flex: none;
}
.hys-ui-cascader-clear:focus-visible,
.hys-ui-cascader-tag-remove:focus-visible {
  outline: 1px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-clear:hover,
.hys-ui-cascader-tag-remove:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}
.hys-ui-cascader-tag-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-ui-cascader-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.hys-ui-cascader-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  padding: 2px 5px 2px 7px;
  min-height: 22px;
  box-sizing: border-box;
  border-radius: 5px;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-size: 12px;
  line-height: 1.5;
}
.hys-ui-cascader-tag-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-cascader-tag-disabled {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-cascader-more {
  padding-inline: 7px;
}
.hys-ui-cascader-menu {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 11px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: 0 14px 40px #14254821;
  padding: 7px;
  gap: 7px;
  font-size: 13px;
  overflow: auto;
  overscroll-behavior: contain;
}
.hys-ui-cascader-columns {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow-x: auto;
  overscroll-behavior: contain;
  flex: 0 0 auto;
  position: relative;
}
.hys-ui-cascader-empty-column {
  flex: 1 0 180px;
  max-width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  border-inline-end: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-cascader-empty-column:last-child {
  border: 0;
}
.hys-ui-cascader-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
  min-height: 40px;
}
.hys-ui-cascader-error {
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger));
}
.hys-ui-cascader-header,
.hys-ui-cascader-footer {
  padding: 5px;
  flex: none;
}
.hys-ui-cascader-header {
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-cascader-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-cascader-search {
  flex: none;
  min-width: 0;
}
.hys-ui-cascader-inline {
  position: static;
  box-shadow: none;
}
.hys-ui-cascader-inline-managed:focus-visible {
  outline: 1px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-sm .hys-ui-cascader-control {
  padding: 4px 10px;
  font-size: 12px;
}
.hys-ui-cascader-lg .hys-ui-cascader-control {
  padding: 8px 14px;
  font-size: 15px;
}
.hys-ui-cascader-sm .hys-ui-cascader-tag {
  min-height: 20px;
  font-size: 11px;
}
.hys-ui-cascader-lg .hys-ui-cascader-tag {
  min-height: 26px;
  font-size: 13px;
}
</style>
