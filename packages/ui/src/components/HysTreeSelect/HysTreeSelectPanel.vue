<script setup lang="ts" generic="N extends object = HysTreeSelectNode">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useId,
  watch,
} from "vue";
import {
  ChevronDown,
  ChevronRight,
  Check,
  LoaderCircle,
} from "lucide-vue-next";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import type { HysTreeSelectStore } from "../../composables/useTreeSelect";
import type { HysTreeSelectNode } from "../../composables/treeSelect";
import type {
  HysTreeKey,
  HysTreeNodeContext,
  HysTreeRecord,
} from "../../composables/tree";
const props = withDefaults(
  defineProps<{
    store: HysTreeSelectStore<N>;
    size?: "sm" | "md" | "lg";
    treeId: string;
    checkable?: boolean;
    checkStrictly?: boolean;
    leafOnly?: boolean;
    expandOnClickNode?: boolean;
    showLine?: boolean;
    showIcon?: boolean;
    indent?: number;
    listHeight?: number;
    virtual?: boolean;
    itemHeight?: number;
    overscan?: number;
  }>(),
  { indent: 18, listHeight: 256, itemHeight: 36, overscan: 4, showIcon: true },
);
defineSlots<{
  option?: (scope: HysTreeNodeContext<N>) => any;
  icon?: (scope: HysTreeNodeContext<N>) => any;
  switcher?: (scope: HysTreeNodeContext<N>) => any;
  empty?: (scope: { query: string }) => any;
}>();
const emit = defineEmits<{
  choose: [key: HysTreeKey];
  scroll: [event: Event];
}>();
const store = props.store,
  { tree, busy, words, query } = store,
  {
    index,
    visible,
    expanded,
    checked,
    halfChecked,
    loadingKeys,
    failures,
    selection,
    matches,
  } = tree,
  port = ref<HTMLElement>(),
  active = ref<HysTreeKey | null>(null),
  scrollTop = ref(0),
  actualHeight = ref(0),
  id = useId();
const height = computed(() =>
    Number.isFinite(props.itemHeight)
      ? Math.min(240, Math.max(24, props.itemHeight))
      : 36,
  ),
  limit = computed(() =>
    Number.isFinite(props.listHeight)
      ? Math.min(1200, Math.max(80, props.listHeight))
      : 256,
  ),
  overscan = computed(() =>
    Number.isFinite(props.overscan)
      ? Math.min(30, Math.max(0, Math.floor(props.overscan)))
      : 4,
  ),
  indent = computed(() =>
    Number.isFinite(props.indent)
      ? Math.min(80, Math.max(0, props.indent))
      : 18,
  ),
  enabled = computed(() => visible.value.filter((r) => !r.disabled)),
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
            (scrollTop.value + (actualHeight.value || limit.value)) /
              height.value,
          ) + overscan.value,
        )
      : visible.value.length,
  ),
  rows = computed(() => visible.value.slice(start.value, end.value)),
  tabKey = computed(() =>
    active.value !== null &&
    visible.value.some((r) => r.key === active.value && !r.disabled)
      ? active.value
      : enabled.value[0]?.key,
  );
let frame = 0,
  observer: ResizeObserver | undefined,
  lifetime = 0,
  live = true;
const elements = new Map<HysTreeKey, HTMLElement>();
function bind(key: HysTreeKey, value: unknown) {
  if (value instanceof HTMLElement) elements.set(key, value);
  else elements.delete(key);
}
const rowId = (key: HysTreeKey) => id + "-" + typeof key + "-" + String(key);
watch([port, () => props.virtual], () => {
  observer?.disconnect();
  if (port.value && props.virtual && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(
      (entries) => (actualHeight.value = entries[0]?.contentRect.height || 0),
    );
    observer.observe(port.value);
  }
});
watch(query, () => {
  scrollTop.value = 0;
  if (port.value) port.value.scrollTop = 0;
  active.value = enabled.value[0]?.key ?? null;
});
watch(
  () => visible.value.length,
  () => {
    const max = Math.max(
      0,
      visible.value.length * height.value - (actualHeight.value || limit.value),
    );
    if (props.virtual && scrollTop.value > max) {
      scrollTop.value = max;
      if (port.value) port.value.scrollTop = max;
    }
  },
);
function scroll(event: Event) {
  if (!live || !port.value) return;
  if (props.virtual && !frame)
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (port.value) scrollTop.value = port.value.scrollTop;
    });
  emit("scroll", event);
}
async function scrollTo(options: {
  key?: HysTreeKey;
  top?: number;
  align?: "top" | "bottom" | "auto";
}) {
  if (!live) return;
  if (options.key !== undefined) {
    await tree.setExpandedKeys([
      ...new Set([...tree.rawExpanded.value, ...tree.ancestors(options.key)]),
    ]);
    await nextTick();
  }
  const root = port.value;
  if (!root || !live) return;
  let top = options.top ?? root.scrollTop;
  if (options.key !== undefined) {
    const at = visible.value.findIndex((r) => r.key === options.key);
    if (at < 0) return;
    if (props.virtual) {
      const y = at * height.value,
        bottom = y + height.value,
        h = actualHeight.value || limit.value;
      top =
        options.align === "top"
          ? y
          : options.align === "bottom"
            ? bottom - h
            : y < root.scrollTop
              ? y
              : bottom > root.scrollTop + h
                ? bottom - h
                : root.scrollTop;
    } else {
      const row = elements.get(options.key);
      if (row) {
        const y =
            row.getBoundingClientRect().top -
            root.getBoundingClientRect().top +
            root.scrollTop,
          bottom = y + row.offsetHeight;
        top =
          options.align === "top"
            ? y
            : options.align === "bottom"
              ? bottom - root.clientHeight
              : y < root.scrollTop
                ? y
                : bottom > root.scrollTop + root.clientHeight
                  ? bottom - root.clientHeight
                  : root.scrollTop;
      }
    }
  }
  top = Number.isFinite(top) ? Math.max(0, top) : 0;
  root.scrollTop = top;
  scrollTop.value = root.scrollTop;
  await nextTick();
}
async function focus(key?: HysTreeKey) {
  if (busy.value || !live) return;
  const chosen = key ?? tabKey.value;
  if (chosen === undefined || index.value.map.get(chosen)?.disabled) return;
  const epoch = ++lifetime;
  active.value = chosen;
  await scrollTo({ key: chosen });
  if (!live || busy.value || epoch !== lifetime) return;
  await nextTick();
  elements.get(chosen)?.focus({ preventScroll: !!props.virtual });
}
function context(row: HysTreeRecord<N>): HysTreeNodeContext<N> {
  return {
    node: store.rawNode(row.node),
    key: row.key,
    label: row.label,
    depth: row.depth,
    expanded: expanded.value.has(row.key) || !!query.value.trim(),
    selected: selection.value.has(row.key),
    checked: checked.value.has(row.key),
    indeterminate: halfChecked.value.has(row.key),
    disabled: busy.value || row.disabled,
    loading: loadingKeys.value.has(row.key),
    leaf: !row.hasChildren,
  };
}
async function choose(row: HysTreeRecord<N>, event?: Event) {
  if (busy.value || row.disabled) return;
  await store.pick(row, event);
  if (live) emit("choose", row.key);
}
function click(event: MouseEvent, row: HysTreeRecord<N>) {
  if (
    event.target instanceof Element &&
    event.target.closest(
      "button,input,a,textarea,select,[contenteditable=true]",
    )
  )
    return;
  active.value = row.key;
  void choose(row, event);
  if (props.expandOnClickNode && row.hasChildren && !props.leafOnly)
    void tree.expandNode(row.key, !expanded.value.has(row.key));
}
function keydown(event: KeyboardEvent, row?: HysTreeRecord<N>) {
  if (event.isComposing || event.keyCode === 229 || busy.value) return;
  const target = event.target as HTMLElement;
  if (
    target?.matches("input:not([type=checkbox]),textarea,select") ||
    target?.closest("[contenteditable=true],a")
  )
    return;
  if (
    target?.closest("button") &&
    !target.closest(".hys-ui-tree-select-toggle")
  )
    return;
  if (
    target?.matches("input[type=checkbox]") &&
    ["Enter", " "].includes(event.key)
  )
    return;
  if (
    target?.closest(".hys-ui-tree-select-toggle") &&
    ["Enter", " "].includes(event.key)
  )
    return;
  const current = row ?? index.value.map.get(tabKey.value!);
  if (!current) return;
  const at = enabled.value.findIndex((r) => r.key === current.key);
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? enabled.value.length - 1
          : Math.max(
              0,
              Math.min(
                enabled.value.length - 1,
                at + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
    void focus(enabled.value[next]?.key);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    if (current.hasChildren && !expanded.value.has(current.key))
      void tree.expandNode(current.key);
    else if (current.hasChildren) void focus(enabled.value[at + 1]?.key);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (current.hasChildren && expanded.value.has(current.key))
      void tree.expandNode(current.key, false);
    else if (current.parent !== undefined) void focus(current.parent);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    void choose(current, event);
  }
}
async function searchKeys(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    await focus(
      event.key === "ArrowUp"
        ? enabled.value.at(-1)?.key
        : enabled.value[0]?.key,
    );
  } else if (event.key === "Enter") {
    event.preventDefault();
    const row = index.value.map.get(tabKey.value!);
    if (row) await choose(row, event);
  }
}
function stop() {
  live = false;
  lifetime++;
  cancelAnimationFrame(frame);
  frame = 0;
  observer?.disconnect();
}
onBeforeUnmount(stop);
onDeactivated(stop);
defineExpose({
  focus,
  scrollTo,
  searchKeys,
  activeId: computed(() =>
    tabKey.value === undefined ? undefined : rowId(tabKey.value),
  ),
  setActive: (key: HysTreeKey) => (active.value = key),
});
</script>
<template>
  <div
    ref="port"
    :id="treeId"
    role="tree"
    :aria-label="words.tree"
    :aria-multiselectable="store.multiple.value || undefined"
    :aria-busy="busy || loadingKeys.size > 0 || undefined"
    class="hys-ui-tree-select-list hys-ui-scrollbar"
    :class="{ 'hys-ui-tree-select-virtual': virtual }"
    :style="{
      maxHeight: limit + 'px',
      height: virtual ? limit + 'px' : undefined,
      '--hys-ui-tree-select-height': height + 'px',
      '--hys-ui-tree-select-indent': indent + 'px',
    }"
    @scroll="scroll"
  >
    <div
      class="hys-ui-tree-select-space"
      :style="virtual ? { height: visible.length * height + 'px' } : undefined"
    >
      <div
        class="hys-ui-tree-select-rows"
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
          v-for="row in rows"
          :id="rowId(row.key)"
          :key="typeof row.key + ':' + row.key"
          :ref="(v) => bind(row.key, v)"
          role="treeitem"
          :aria-level="row.depth + 1"
          :aria-posinset="row.pos"
          :aria-setsize="row.size"
          :aria-expanded="row.hasChildren ? context(row).expanded : undefined"
          :aria-selected="
            !checkable && row.selectable ? selection.has(row.key) : undefined
          "
          :aria-checked="
            checkable && row.checkable
              ? halfChecked.has(row.key)
                ? 'mixed'
                : checked.has(row.key)
              : undefined
          "
          :aria-disabled="busy || row.disabled || undefined"
          :tabindex="!busy && tabKey === row.key ? 0 : -1"
          :data-tree-select-key="typeof row.key + ':' + row.key"
          class="hys-ui-tree-select-row"
          :class="{
            'hys-ui-tree-select-selected': checkable
              ? checked.has(row.key)
              : selection.has(row.key),
            'hys-ui-tree-select-disabled': row.disabled,
            'hys-ui-tree-select-line': showLine,
            'hys-ui-tree-select-match': query.trim() && matches.has(row.key),
          }"
          :style="{ '--hys-ui-tree-select-depth': row.depth }"
          @click="click($event, row)"
          @keydown="keydown($event, row)"
          @focus="active = row.key"
        >
          <button
            v-if="row.hasChildren"
            class="hys-ui-tree-select-toggle"
            type="button"
            tabindex="-1"
            :disabled="busy || row.disabled"
            :aria-label="
              (context(row).expanded ? words.collapse : words.expand) +
              ' ' +
              row.label
            "
            @click.stop="tree.expandNode(row.key, !expanded.has(row.key))"
          >
            <slot name="switcher" v-bind="context(row)"
              ><LoaderCircle
                v-if="loadingKeys.has(row.key)"
                :size="14"
                class="hys-ui-icon-spin" /><component
                v-else
                :is="context(row).expanded ? ChevronDown : ChevronRight"
                :size="14"
            /></slot></button
          ><span v-else class="hys-ui-tree-select-spacer"
            ><slot name="switcher" v-bind="context(row)"
          /></span>
          <HysCheckbox
            v-if="checkable && row.checkable"
            :model-value="checked.has(row.key)"
            :indeterminate="halfChecked.has(row.key)"
            :disabled="busy || row.checkboxDisabled"
            :aria-label="words.check + ' ' + row.label"
            :tabindex="-1"
            :size="size"
            @click.stop
            @update:model-value="
              (on) => tree.setChecked(row.key, on, !checkStrictly)
            "
          />
          <span
            v-if="showIcon && $slots.icon"
            class="hys-ui-tree-select-icon"
            aria-hidden="true"
            ><slot name="icon" v-bind="context(row)" /></span
          ><span class="hys-ui-tree-select-label"
            ><slot name="option" v-bind="context(row)">{{
              row.label
            }}</slot></span
          ><button
            v-if="failures.has(row.key)"
            class="hys-ui-tree-select-retry"
            type="button"
            :disabled="busy"
            @click.stop="tree.reloadNode(row.key)"
          >
            {{ words.loadError }} · {{ words.retry }}</button
          ><Check
            v-else-if="!checkable && selection.has(row.key)"
            :size="15"
            class="hys-ui-tree-select-check"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
    <div v-if="!visible.length && !busy" class="hys-ui-tree-select-empty">
      <slot name="empty" :query="query">{{
        query.trim() ? words.noMatch : words.empty
      }}</slot>
    </div>
  </div>
</template>
<style scoped>
.hys-ui-tree-select-list {
  position: relative;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 2px;
  box-sizing: border-box;
}
.hys-ui-tree-select-space,
.hys-ui-tree-select-rows {
  position: relative;
  min-width: 0;
}
.hys-ui-tree-select-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  box-sizing: border-box;
  min-height: var(--hys-ui-tree-select-height);
  padding: 6px 9px 6px
    calc(
      5px + var(--hys-ui-tree-select-depth) * var(--hys-ui-tree-select-indent)
    );
  margin-block: 3px;
  border-radius: 7px;
  cursor: pointer;
  outline: none;
  color: var(--hys-ui-text-primary, var(--hys-ui-theme-text-primary, #26344a));
  font-size: 13px;
}
.hys-ui-tree-select-row:hover {
  background: var(
    --hys-ui-surface-hover,
    var(--hys-ui-theme-surface-hover, #f2f5fb)
  );
}
.hys-ui-tree-select-row:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-tree-select-selected,
.hys-ui-tree-select-selected:hover {
  background: var(
    --hys-ui-primary-soft,
    var(--hys-ui-theme-primary-soft, #eaf0ff)
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary, #3867f5));
  font-weight: 600;
}
.hys-ui-tree-select-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-ui-tree-select-toggle,
.hys-ui-tree-select-spacer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
}
.hys-ui-tree-select-toggle {
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: pointer;
}
.hys-ui-tree-select-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-tree-select-check,
.hys-ui-tree-select-icon {
  display: inline-flex;
  flex: none;
}
.hys-ui-tree-select-empty {
  padding: 22px;
  text-align: center;
  color: var(
    --hys-ui-text-secondary,
    var(--hys-ui-theme-text-secondary, #8793a8)
  );
}
.hys-ui-tree-select-retry {
  border: 0;
  background: transparent;
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #d24a50));
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.hys-ui-tree-select-virtual {
  overflow-anchor: none;
  padding-block: 0;
}
.hys-ui-tree-select-virtual .hys-ui-tree-select-row {
  height: var(--hys-ui-tree-select-height);
  min-height: var(--hys-ui-tree-select-height);
  margin: 0;
  border-block: 2px solid transparent;
  background-clip: padding-box;
  padding-block: 0;
}
.hys-ui-tree-select-line:before {
  content: "";
  position: absolute;
  left: calc(
    15px + (var(--hys-ui-tree-select-depth) - 1) *
      var(--hys-ui-tree-select-indent)
  );
  height: 100%;
  border-left: 1px dashed
    var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ef));
  opacity: 0.7;
}
.hys-ui-tree-select-line[aria-level="1"]:before {
  display: none;
}
.hys-ui-tree-select-match .hys-ui-tree-select-label {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
@media (prefers-reduced-motion: no-preference) {
  .hys-ui-tree-select-row {
    transition: background 0.12s ease;
  }
}
</style>
