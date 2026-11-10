<script
  setup
  lang="ts"
  generic="
    V extends HysTreeSelectValue = string,
    N extends object = HysTreeSelectNode
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
import { ChevronDown, LoaderCircle, Search, X } from "lucide-vue-next";
import HysInput from "../HysInput/HysInput.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysTreeSelectPanel from "./HysTreeSelectPanel.vue";
import { useFloating } from "../../composables/useFloating";
import { useHysRootAttrs } from "../../config";
import {
  fieldKey,
  useHysControlState,
  useHysFormItemContext,
  type HysFieldContext,
} from "../../composables/formContext";
import { useTreeSelect } from "../../composables/useTreeSelect";
import type {
  HysTreeKey,
  HysTreeCheckInfo,
  HysTreeNodeContext,
} from "../../composables/tree";
import type {
  HysTreeSelectProps,
  HysTreeSelectValue,
  HysTreeSelectNode,
  HysTreeSelectItem,
  HysTreeSelectChange,
} from "../../composables/treeSelect";
export type { HysTreeSelectNode } from "../../composables/treeSelect";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysTreeSelectProps<N, V>>(), {
  open: undefined,
  searchable: true,
  clearable: false,
  removable: true,
  maxTagCount: 3,
  defaultExpandAll: true,
  autoExpandParent: true,
  expandSelected: true,
  clearSearchAfterSelect: true,
  popupMatchWidth: true,
  appendTo: "body",
  listHeight: 256,
  overscan: 4,
  showIcon: true,
  indent: 18,
  showCheckedStrategy: "child",
  validateEvent: true,
});
defineSlots<{
  option?: (scope: HysTreeNodeContext<N>) => any;
  icon?: (scope: HysTreeNodeContext<N>) => any;
  switcher?: (scope: HysTreeNodeContext<N>) => any;
  tag?: (scope: {
    item: HysTreeSelectItem<N>;
    remove: () => Promise<boolean>;
  }) => any;
  "max-tag-placeholder"?: (scope: {
    items: HysTreeSelectItem<N>[];
    count: number;
  }) => any;
  prefix?: () => any;
  suffix?: () => any;
  header?: () => any;
  footer?: (scope: {
    items: HysTreeSelectItem<N>[];
    clear: () => Promise<boolean>;
    close: () => void;
  }) => any;
  empty?: (scope: { query: string }) => any;
  loading?: () => any;
  error?: (scope: { error: unknown; retry: () => Promise<void> }) => any;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: V];
  change: [value: V, info: HysTreeSelectChange<N>];
  "value-change": [value: V, info: HysTreeSelectChange<N>];
  select: [key: HysTreeKey, node: N, info: unknown];
  deselect: [key: HysTreeKey, node: N, info: unknown];
  check: [info: HysTreeCheckInfo<N>];
  clear: [];
  "remove-tag": [key: HysTreeKey, node: N | undefined];
  limit: [limit: number];
  "update:searchValue": [value: string];
  search: [query: string];
  "search-error": [error: unknown, query: string];
  "search-complete": [query: string];
  "update:open": [value: boolean];
  "visible-change": [value: boolean];
  "update:expandedKeys": [keys: HysTreeKey[]];
  "update:loadedKeys": [keys: HysTreeKey[]];
  "node-expand": [node: N, info: unknown];
  "node-collapse": [node: N, info: unknown];
  "load-error": [info: { node: N; error: unknown }];
  "children-loaded": [info: { node: N; children: readonly N[] }];
  load: [info: { node: N; children: readonly N[]; loadedKeys: HysTreeKey[] }];
  scroll: [event: Event];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const attrs = useAttrs(),
  rootAttrs = useHysRootAttrs(),
  control = useHysControlState(props),
  field = useHysFormItemContext(),
  trigger = ref<HTMLElement>(),
  panel = ref<HTMLElement>(),
  search = ref<InstanceType<typeof HysInput>>(),
  view = ref<{
    focus: (key?: HysTreeKey) => Promise<void>;
    scrollTo: (options: {
      key?: HysTreeKey;
      top?: number;
      align?: "top" | "bottom" | "auto";
    }) => Promise<void>;
    searchKeys: (event: KeyboardEvent) => Promise<void>;
    setActive: (key: HysTreeKey) => void;
    activeId?: string;
  }>(),
  id = useId(),
  wrappingLabel = ref("");
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
let live = true,
  focusInside = false,
  requestedRestore = false,
  openTicket = 0;
const floating = useFloating(trigger, panel, {
    get placement() {
      return props.placement;
    },
    matchWidth: () => (props.popupMatchWidth ? true : "min"),
    width: () =>
      props.popupWidth ??
      (props.virtual && !props.popupMatchWidth
        ? Math.max(trigger.value?.getBoundingClientRect().width ?? 0, 240)
        : undefined),
    requestOpen: (next, restore) => {
      if (!next) requestedRestore = !!restore;
      emit("update:open", next);
      return props.open === undefined ? undefined : false;
    },
  }),
  { open, style, show: showFloating, close } = floating;
const active = computed(() => open.value && live),
  store = useTreeSelect(
    props,
    control.disabled,
    active,
    (name, ...args) => {
      (emit as (name: string, ...args: any[]) => void)(name, ...args);
      if (
        name === "value-change" &&
        props.clearSearchAfterSelect &&
        !props.retainSearch
      )
        store.filter("");
    },
    () => {
      void field.validate("change");
    },
  );
const {
  items,
  multiple,
  busy,
  blocked,
  query,
  words,
  remoteError,
  remotePending,
} = store;
const rootStyle = computed<CSSProperties>(() => ({
    "--hys-ui-tree-select-control-height":
      (control.size.value === "sm"
        ? 30
        : control.size.value === "lg"
          ? 44
          : 38) + "px",
  })),
  panelStyle = computed<CSSProperties>(() => ({
    ...props.popupStyle,
    ...style.value,
    maxHeight: "min(60dvh, calc(100dvh - 20px))",
    overflowY: "hidden",
  })),
  itemHeight = computed(
    () =>
      props.itemHeight ??
      (control.size.value === "sm"
        ? 30
        : control.size.value === "lg"
          ? 42
          : 36),
  ),
  tagLimit = computed(() =>
    Number.isFinite(props.maxTagCount)
      ? Math.max(0, Math.floor(props.maxTagCount!))
      : Infinity,
  ),
  visibleItems = computed(() => items.value.slice(0, tagLimit.value)),
  omitted = computed(() => items.value.slice(tagLimit.value)),
  plainLabel = (item: HysTreeSelectItem<N>) =>
    typeof item.label === "string" || typeof item.label === "number"
      ? String(item.label)
      : String(item.value),
  tagLabel = (item: HysTreeSelectItem<N>) =>
    Number.isFinite(props.maxTagTextLength) && props.maxTagTextLength! >= 0
      ? plainLabel(item).slice(0, props.maxTagTextLength) +
        (plainLabel(item).length > props.maxTagTextLength! ? "…" : "")
      : undefined,
  canClear = computed(
    () =>
      props.clearable &&
      !blocked.value &&
      store.values.value.some((key) => !store.item(key).disabled),
  );
const controlAttrs = () =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !["class", "style"].includes(key)),
  );
function syncLabel() {
  const label = trigger.value?.closest("label");
  if (!label) return;
  const copy = label.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll(".hys-ui-tree-select-wrap")
    .forEach((el) => el.remove());
  wrappingLabel.value = (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}
async function expand(focusPanel = true, force = false): Promise<boolean> {
  if (!live || control.disabled.value || props.readonly) return false;
  const alreadyOpen = open.value;
  const ticket = openTicket;
  await showFloating(force);
  await nextTick();
  if (!live || !open.value || ticket !== openTicket) return false;
  if (!alreadyOpen && !props.retainSearch) store.filter("");
  if (props.expandSelected && store.values.value.length) {
    const parents = store.values.value.flatMap((key) =>
      store.tree.ancestors(key),
    );
    await store.tree.setExpandedKeys([
      ...new Set([...store.tree.rawExpanded.value, ...parents]),
    ]);
  }
  await nextTick();
  if (!live || !open.value || ticket !== openTicket) return false;
  const chosen = store.values.value.find((key) =>
    store.tree.visible.value.some((r) => r.key === key && !r.disabled),
  );
  if (chosen !== undefined) {
    view.value?.setActive(chosen);
    await view.value?.scrollTo({ key: chosen });
  }
  if (focusPanel) {
    if (props.searchable) search.value?.focus();
    else await view.value?.focus(chosen);
  }
  return true;
}
async function clear() {
  const accepted = await store.clear();
  if (accepted) close(true);
  return accepted;
}
function toggle(event?: MouseEvent) {
  if (event?.target instanceof Element && event.target.closest("button"))
    return;
  open.value ? close() : void expand();
}
function choose(key: HysTreeKey) {
  if (!multiple.value && store.values.value.includes(key)) close(true);
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
    if (open.value) {
      if (props.searchable) search.value?.focus();
      else void view.value?.focus();
    } else void expand();
  } else if (event.key === "Escape" && open.value) {
    event.preventDefault();
    close(true);
  } else if (event.key === "Backspace" && multiple.value && !blocked.value) {
    const last = [...items.value].reverse().find((item) => !item.disabled);
    if (last) {
      event.preventDefault();
      void store.removeTag(last.value);
    }
  }
}
function focus(event: FocusEvent) {
  if (!focusInside) {
    focusInside = true;
    emit("focus", event);
  }
  if (
    event.target === trigger.value &&
    props.showOnFocus &&
    !floating.restoringFocus.value
  )
    void expand(false);
}
async function blur(event: FocusEvent) {
  await nextTick();
  if (!live) return;
  const next =
    event.relatedTarget instanceof Node
      ? event.relatedTarget
      : document.activeElement;
  if (trigger.value?.contains(next) || panel.value?.contains(next)) return;
  if (focusInside) {
    focusInside = false;
    emit("blur", event);
    if (props.validateEvent) void field.validate("blur");
  }
}
async function scrollTo(options: {
  key?: HysTreeKey;
  top?: number;
  align?: "top" | "bottom" | "auto";
}) {
  if (await expand(false)) await view.value?.scrollTo(options);
}
watch(
  () => props.open,
  (value) => {
    if (!live) return;
    if (value) void expand(false, true);
    else {
      const restore = requestedRestore;
      requestedRestore = false;
      close(restore, true);
    }
  },
);
watch(open, (value) => {
  if (!value) openTicket++;
  emit("visible-change", value);
  if (!value && !props.retainSearch) store.filter("");
});
watch(
  [() => props.readonly, control.disabled],
  ([readonly, disabled]) => {
    if (readonly || disabled) {
      close(false, true);
      if (props.open) emit("update:open", false);
    }
  },
  { flush: "sync" },
);
watch(
  [
    query,
    items,
    () => props.popupWidth,
    () => props.popupMatchWidth,
    () => control.size.value,
  ],
  () => {
    void nextTick().then(() => floating.update());
  },
);
onMounted(() => {
  syncLabel();
  if (props.open ?? props.defaultOpen) void expand(false, true);
});
onUpdated(syncLabel);
onActivated(() => {
  live = true;
  if (props.open) void expand(false, true);
});
function cleanup() {
  live = false;
  focusInside = false;
  openTicket++;
  close(false, true);
}
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  element: trigger,
  open,
  focus: () => {
    if (!control.disabled.value) trigger.value?.focus();
  },
  blur: () => {
    close();
    if (
      trigger.value?.contains(document.activeElement) ||
      panel.value?.contains(document.activeElement)
    )
      (document.activeElement as HTMLElement)?.blur();
  },
  show: () => expand(),
  hide: (restore = false) => close(restore),
  clear,
  removeTag: store.removeTag,
  setValue: store.setValue,
  filter: store.filter,
  getSelectedKeys: () => [...store.values.value],
  getSelectedItems: () => [...items.value],
  getCheckedKeys: store.tree.getCheckedKeys,
  getHalfCheckedKeys: store.tree.getHalfCheckedKeys,
  getNode: (key: HysTreeKey) => {
    const row = store.tree.getNode(key);
    return row ? store.rawNode(row) : undefined;
  },
  getExpandedKeys: () => [...store.tree.expanded.value],
  setExpandedKeys: store.tree.setExpandedKeys,
  expandNode: store.tree.expandNode,
  reloadNode: store.tree.reloadNode,
  scrollTo,
});
</script>
<template>
  <div
    v-bind="rootAttrs"
    class="hys-ui-tree-select-wrap"
    :class="[$attrs.class, 'hys-ui-tree-select-' + control.size.value]"
    :style="[$attrs.style as CSSProperties, rootStyle]"
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
      ref="trigger"
      v-bind="controlAttrs()"
      :id="($attrs.id as string) || field.id.value || id"
      data-hys-ui-field-managed
      role="combobox"
      aria-haspopup="tree"
      :aria-expanded="open"
      :aria-controls="open ? id + '-tree' : undefined"
      :aria-label="
        ariaLabel ||
        field.label.value ||
        wrappingLabel ||
        placeholder ||
        '选择节点'
      "
      :aria-disabled="control.disabled.value || undefined"
      :aria-readonly="readonly || undefined"
      :aria-invalid="status === 'error' || field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
      :aria-required="field.required.value || undefined"
      :aria-busy="loading || remotePending || undefined"
      :tabindex="control.disabled.value ? -1 : 0"
      class="hys-ui-tree-select-control"
      :class="{
        'hys-ui-tree-select-control-disabled': control.disabled.value,
        'hys-ui-tree-select-control-error':
          status === 'error' || field.invalid.value,
        'hys-ui-tree-select-control-warning': status === 'warning',
        'hys-ui-tree-select-control-success': status === 'success',
      }"
      @click="toggle"
      @keydown="triggerKeys"
      @focusin="focus"
      @focusout="blur"
    >
      <span v-if="$slots.prefix" class="hys-ui-tree-select-prefix"
        ><slot name="prefix" /></span
      ><span v-if="!items.length" class="hys-ui-tree-select-placeholder">{{
        placeholder || "选择节点"
      }}</span>
      <div v-else-if="multiple" class="hys-ui-tree-select-tags">
        <template
          v-for="item in visibleItems"
          :key="typeof item.value + ':' + item.value"
          ><slot
            name="tag"
            :item="item"
            :remove="() => store.removeTag(item.value)"
            ><span
              class="hys-ui-tree-select-tag"
              :class="{ 'hys-ui-tree-select-tag-disabled': item.disabled }"
              ><span class="hys-ui-tree-select-tag-label"
                ><template v-if="tagLabel(item) !== undefined">{{
                  tagLabel(item)
                }}</template
                ><component :is="() => item.label" v-else /></span
              ><button
                v-if="removable"
                type="button"
                class="hys-ui-tree-select-tag-remove"
                :disabled="blocked || item.disabled"
                :aria-label="'移除 ' + plainLabel(item)"
                @click.stop="store.removeTag(item.value)"
              >
                <X
                  :size="12"
                  aria-hidden="true"
                /></button></span></slot></template
        ><HysTooltip
          v-if="omitted.length"
          :text="
            omitted.slice(0, 20).map(plainLabel).join('、') +
            (omitted.length > 20 ? ' 等 ' + omitted.length + ' 项' : '')
          "
          ><span
            class="hys-ui-tree-select-tag hys-ui-tree-select-more"
            :aria-label="'另外 ' + omitted.length + ' 项'"
            ><slot
              name="max-tag-placeholder"
              :items="omitted"
              :count="omitted.length"
              >+{{ omitted.length }}</slot
            ></span
          ></HysTooltip
        >
      </div>
      <span v-else class="hys-ui-tree-select-value"
        ><component :is="() => items[0].label" /></span
      ><span class="hys-ui-tree-select-indicators"
        ><LoaderCircle
          v-if="loading || remotePending"
          :size="15"
          class="hys-ui-icon-spin"
          aria-hidden="true" /><button
          v-if="canClear"
          type="button"
          class="hys-ui-tree-select-clear"
          aria-label="清空选择"
          @click.stop="clear"
        >
          <X :size="14" aria-hidden="true" /></button
        ><slot name="suffix"
          ><ChevronDown
            :size="16"
            class="hys-ui-tree-select-chevron"
            :class="{ 'hys-ui-tree-select-chevron-open': open }"
            aria-hidden="true" /></slot
      ></span>
    </div>
    <template v-if="name"
      ><input
        v-for="key in store.values.value"
        :key="typeof key + ':' + key"
        type="hidden"
        :name="name"
        :value="key"
        :disabled="control.disabled.value"
    /></template>
    <Teleport
      :to="appendTo === false ? 'body' : appendTo"
      :disabled="appendTo === false"
      ><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="floating.placement.value"><div
        v-if="open"
        ref="panel"
        v-bind="rootAttrs"
        class="hys-ui-tree-select-menu hys-ui-pf-tree-select-menu"
        :class="[popupClass, 'hys-ui-tree-select-' + control.size.value]"
        :style="panelStyle"
        @focusin="focus"
        @focusout="blur"
      >
        <header v-if="$slots.header" class="hys-ui-tree-select-header">
          <slot name="header" />
        </header>
        <HysInput
          v-if="searchable"
          ref="search"
          class="hys-ui-tree-select-search"
          :model-value="query"
          :placeholder="words.search"
          :aria-label="words.search"
          :aria-controls="id + '-tree'"
          :aria-activedescendant="view?.activeId"
          :disabled="control.disabled.value || readonly || loading"
          :size="control.size.value"
          clearable
          @update:model-value="store.filter"
          @keydown="view?.searchKeys($event)"
          ><template #prefix><Search :size="14" aria-hidden="true" /></template
        ></HysInput>
        <div
          v-if="loading || remotePending"
          class="hys-ui-tree-select-loading"
          role="status"
        >
          <slot name="loading"
            ><LoaderCircle
              :size="16"
              class="hys-ui-icon-spin"
              aria-hidden="true"
            />{{ words.loading }}</slot
          >
        </div>
        <div v-if="remoteError" class="hys-ui-tree-select-error" role="alert">
          <slot name="error" :error="remoteError" :retry="store.retrySearch"
            ><span>{{ words.loadError }}</span
            ><HysButton
              size="sm"
              variant="ghost"
              @click="store.retrySearch()"
              >{{ words.retry }}</HysButton
            ></slot
          >
        </div>
        <HysTreeSelectPanel
          ref="view"
          :store="store"
          :size="control.size.value"
          :tree-id="id + '-tree'"
          :checkable="checkable"
          :check-strictly="checkStrictly"
          :leaf-only="leafOnly"
          :expand-on-click-node="expandOnClickNode"
          :show-line="showLine"
          :show-icon="showIcon"
          :indent="indent"
          :list-height="listHeight"
          :virtual="virtual"
          :item-height="itemHeight"
          :overscan="overscan"
          @choose="choose"
          @scroll="emit('scroll', $event)"
          ><template v-if="$slots.option" #option="scope"
            ><slot name="option" v-bind="scope" /></template
          ><template v-if="$slots.icon" #icon="scope"
            ><slot name="icon" v-bind="scope" /></template
          ><template v-if="$slots.switcher" #switcher="scope"
            ><slot name="switcher" v-bind="scope" /></template
          ><template v-if="$slots.empty" #empty="scope"
            ><slot name="empty" v-bind="scope" /></template
        ></HysTreeSelectPanel>
        <footer v-if="$slots.footer" class="hys-ui-tree-select-footer">
          <slot
            name="footer"
            :items="items"
            :clear="clear"
            :close="() => close(true)"
          />
        </footer></div
    ></PopupMotion></Teleport>
  </div>
</template>
<style scoped>
.hys-ui-tree-select-wrap {
  position: relative;
  min-width: 0;
  width: 100%;
}
.hys-ui-tree-select-control {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  min-height: var(--hys-ui-tree-select-control-height);
  padding: 7px 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ef));
  border-radius: 9px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  color: var(--hys-ui-text-primary, var(--hys-ui-theme-text-primary, #26344a));
  font: inherit;
  font-size: 13px;
  line-height: 1.45;
  cursor: pointer;
  outline: none;
}
.hys-ui-tree-select-control:hover,
.hys-ui-tree-select-control[aria-expanded="true"] {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary, #3867f5));
}
.hys-ui-tree-select-control:focus-visible {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 32%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-tree-select-control-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-tree-select-placeholder,
.hys-ui-tree-select-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-tree-select-placeholder {
  color: var(
    --hys-ui-text-secondary,
    var(--hys-ui-theme-text-secondary, #8a96aa)
  );
}
.hys-ui-tree-select-indicators,
.hys-ui-tree-select-prefix {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  color: var(
    --hys-ui-text-secondary,
    var(--hys-ui-theme-text-secondary, #8a96aa)
  );
}
.hys-ui-tree-select-indicators {
  margin-inline-start: auto;
}
.hys-ui-tree-select-tags {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
}
.hys-ui-tree-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  min-height: 22px;
  padding: 1px 6px;
  border-radius: 5px;
  background: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft, #eaf0ff)
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary, #3867f5));
  font-size: 12px;
  line-height: 1.5;
}
.hys-ui-tree-select-tag-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.hys-ui-tree-select-tag-disabled {
  opacity: 0.65;
}
.hys-ui-tree-select-tag-remove,
.hys-ui-tree-select-clear {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 3px;
  flex: none;
}
.hys-ui-tree-select-tag-remove:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.hys-ui-tree-select-clear:hover,
.hys-ui-tree-select-tag-remove:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 10%, transparent);
}
.hys-ui-tree-select-tag-remove:focus-visible,
.hys-ui-tree-select-clear:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.hys-ui-tree-select-chevron {
  transition: transform 0.16s ease;
}
.hys-ui-tree-select-chevron-open {
  transform: rotate(180deg);
}
.hys-ui-tree-select-control-error {
  border-color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #e34b59));
}
.hys-ui-tree-select-control-warning {
  border-color: var(--hys-ui-warning, var(--hys-ui-theme-warning, #d48a2c));
}
.hys-ui-tree-select-control-success {
  border-color: var(--hys-ui-success, var(--hys-ui-theme-success, #21a16b));
}
.hys-ui-tree-select-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  padding: 7px;
  width: max-content;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ef));
  border-radius: 11px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  color: var(--hys-ui-text-primary, var(--hys-ui-theme-text-primary, #26344a));
  box-shadow: 0 14px 40px #14254821;
  font-size: 13px;
}
.hys-ui-tree-select-search {
  flex: none;
  min-width: 0;
}
.hys-ui-tree-select-header,
.hys-ui-tree-select-footer {
  padding: 5px;
  flex: none;
}
.hys-ui-tree-select-header {
  border-bottom: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ef));
}
.hys-ui-tree-select-footer {
  border-top: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ef));
}
.hys-ui-tree-select-loading,
.hys-ui-tree-select-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  flex: none;
  color: var(
    --hys-ui-text-secondary,
    var(--hys-ui-theme-text-secondary, #8a96aa)
  );
}
.hys-ui-tree-select-error {
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #e34b59));
}
.hys-ui-tree-select-sm .hys-ui-tree-select-control {
  font-size: 12px;
  padding: 4px 10px;
}
.hys-ui-tree-select-lg .hys-ui-tree-select-control {
  font-size: 15px;
  padding: 8px 14px;
}
.hys-ui-tree-select-sm .hys-ui-tree-select-tag {
  font-size: 11px;
  min-height: 20px;
}
.hys-ui-tree-select-lg .hys-ui-tree-select-tag {
  font-size: 13px;
  min-height: 26px;
}
.hys-ui-tree-select-sm :deep(.hys-ui-tree-select-row) {
  font-size: 12px;
}
.hys-ui-tree-select-lg :deep(.hys-ui-tree-select-row) {
  font-size: 14px;
}
[data-hys-motion="off"] .hys-ui-tree-select-chevron {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-tree-select-chevron {
    transition: none;
  }
}
</style>
