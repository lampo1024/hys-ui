<script setup lang="ts" generic="N extends object">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onActivated,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { ChevronRight, Check, LoaderCircle, RotateCw } from "lucide-vue-next";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import type {
  CascaderEntry,
  HysCascaderOptionContext,
} from "../../composables/cascader";
const props = withDefaults(
  defineProps<{
    rows: readonly CascaderEntry<N>[];
    level: number;
    label: string;
    activeKey?: string;
    multiple?: boolean;
    strict?: boolean;
    showPrefix?: boolean;
    disabled?: boolean;
    search?: boolean;
    size?: "sm" | "md" | "lg";
    virtual?: boolean;
    itemHeight?: number;
    listHeight?: number;
    overscan?: number;
    columnWidth?: number | string;
    context: (entry: CascaderEntry<N>) => HysCascaderOptionContext<N>;
    hasChildren: (entry: CascaderEntry<N>) => boolean;
    error: (entry: CascaderEntry<N>) => unknown;
    retryText: string;
    expandLabel: (entry: CascaderEntry<N>) => string;
  }>(),
  {
    showPrefix: true,
    itemHeight: 36,
    listHeight: 256,
    overscan: 4,
    columnWidth: 180,
  },
);
defineSlots<{
  option?: (scope: HysCascaderOptionContext<N>) => any;
  suggestion?: (scope: HysCascaderOptionContext<N>) => any;
  "expand-icon"?: (scope: HysCascaderOptionContext<N>) => any;
  loading?: (scope: HysCascaderOptionContext<N>) => any;
}>();
const emit = defineEmits<{
  choose: [entry: CascaderEntry<N>, event?: Event, checked?: boolean];
  expand: [entry: CascaderEntry<N>];
  hover: [entry: CascaderEntry<N> | null];
  keyboard: [event: KeyboardEvent, entry: CascaderEntry<N>, level: number];
  scroll: [event: Event];
  retry: [entry: CascaderEntry<N>];
}>();
const port = ref<HTMLElement>(),
  top = ref(0),
  focused = ref<string>(),
  elements = new Map<string, HTMLElement>();
const height = computed(() =>
    Number.isFinite(props.itemHeight)
      ? Math.max(24, Math.min(240, props.itemHeight))
      : 36,
  ),
  limit = computed(() =>
    Number.isFinite(props.listHeight)
      ? Math.max(80, Math.min(1200, props.listHeight))
      : 256,
  ),
  overscan = computed(() =>
    Number.isFinite(props.overscan)
      ? Math.max(0, Math.min(30, Math.floor(props.overscan)))
      : 4,
  ),
  start = computed(() =>
    props.virtual
      ? Math.max(0, Math.floor(top.value / height.value) - overscan.value)
      : 0,
  ),
  end = computed(() =>
    props.virtual
      ? Math.min(
          props.rows.length,
          Math.ceil((top.value + limit.value) / height.value) + overscan.value,
        )
      : props.rows.length,
  ),
  visible = computed(() => props.rows.slice(start.value, end.value)),
  tabKey = computed(
    () =>
      props.rows.find(
        (row) =>
          row.value === (focused.value ?? props.activeKey) && !row.disabled,
      )?.value ?? props.rows.find((row) => !row.disabled)?.value,
  );
let frame = 0,
  epoch = 0,
  live = true;
function bind(key: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) elements.set(key, element);
  else elements.delete(key);
}
function scroll(event: Event) {
  if (!live) return;
  if (props.virtual && !frame)
    frame = requestAnimationFrame(() => {
      frame = 0;
      top.value = port.value?.scrollTop ?? 0;
    });
  emit("scroll", event);
}
async function focus(key?: string) {
  const chosen = key ?? tabKey.value,
    at = props.rows.findIndex((row) => row.value === chosen && !row.disabled);
  if (at < 0 || props.disabled || !live) return;
  const token = ++epoch;
  focused.value = chosen;
  const root = port.value;
  if (!root) return;
  if (props.virtual) {
    const y = at * height.value;
    if (y < root.scrollTop) root.scrollTop = y;
    else if (y + height.value > root.scrollTop + limit.value)
      root.scrollTop = y + height.value - limit.value;
    top.value = root.scrollTop;
  }
  if (!elements.get(chosen!)?.isConnected) await nextTick();
  if (!live || token !== epoch || props.disabled) return;
  const element = elements.get(chosen!);
  if (element && !props.virtual) {
    const y = element.offsetTop;
    if (y < root.scrollTop) root.scrollTop = y;
    else if (y + element.offsetHeight > root.scrollTop + root.clientHeight)
      root.scrollTop = y + element.offsetHeight - root.clientHeight;
  }
  element?.focus({ preventScroll: true });
}
watch(
  () => props.rows,
  () => {
    if (port.value) {
      const max = Math.max(0, props.rows.length * height.value - limit.value);
      if (top.value > max) {
        top.value = max;
        port.value.scrollTop = max;
      }
    }
  },
);
function stop() {
  live = false;
  epoch++;
  cancelAnimationFrame(frame);
  frame = 0;
}
onBeforeUnmount(stop);
onDeactivated(stop);
onActivated(() => (live = true));
defineExpose({ focus, element: port });
</script>
<template>
  <div
    ref="port"
    class="hys-ui-cascader-column hys-ui-v4-level hys-ui-scrollbar"
    :data-size="size"
    :class="{
      'hys-ui-cascader-column-virtual': virtual,
      'hys-ui-cascader-results': search,
    }"
    :data-cascader-level="level"
    :role="search ? 'listbox' : 'menu'"
    :aria-label="label"
    :aria-multiselectable="(search && multiple) || undefined"
    :style="{
      maxHeight: limit + 'px',
      height: virtual ? limit + 'px' : undefined,
      minWidth: search
        ? '0'
        : typeof columnWidth === 'number'
          ? columnWidth + 'px'
          : columnWidth,
      '--hys-ui-cascader-item-height': height + 'px',
    }"
    @scroll="scroll"
  >
    <div
      class="hys-ui-cascader-space"
      :style="virtual ? { height: rows.length * height + 'px' } : undefined"
    >
      <div
        class="hys-ui-cascader-rows"
        :style="
          virtual
            ? {
                position: 'absolute',
                top: start * height + 'px',
                insetInline: 0,
              }
            : undefined
        "
      >
        <div
          v-for="entry in visible"
          :key="entry.value"
          :ref="(el) => bind(entry.value, el)"
          :data-cascader-key="entry.value"
          :role="
            search
              ? 'option'
              : multiple
                ? 'menuitemcheckbox'
                : strict
                  ? 'menuitemradio'
                  : 'menuitem'
          "
          :aria-checked="
            !search && (multiple || strict)
              ? context(entry).indeterminate
                ? 'mixed'
                : context(entry).checked
              : undefined
          "
          :aria-selected="search ? context(entry).checked : undefined"
          :aria-disabled="disabled || entry.disabled || undefined"
          :aria-expanded="
            !search && hasChildren(entry) ? context(entry).expanded : undefined
          "
          :aria-haspopup="!search && hasChildren(entry) ? 'menu' : undefined"
          :aria-current="
            !search && activeKey === entry.value ? 'true' : undefined
          "
          :tabindex="
            !disabled && !entry.disabled && tabKey === entry.value ? 0 : -1
          "
          class="hys-ui-cascader-option"
          :class="{
            'hys-ui-cascader-option-active': activeKey === entry.value,
            'hys-ui-cascader-option-checked': context(entry).checked,
            'hys-ui-cascader-option-disabled': entry.disabled,
            'hys-ui-cascader-option-fixed': virtual,
          }"
          @focus="focused = entry.value"
          @click="!disabled && !entry.disabled && emit('choose', entry, $event)"
          @pointerenter="!disabled && !entry.disabled && emit('hover', entry)"
          @pointerleave="emit('hover', null)"
          @keydown="emit('keyboard', $event, entry, level)"
        >
          <HysCheckbox
            v-if="multiple && showPrefix"
            :model-value="context(entry).checked"
            :indeterminate="context(entry).indeterminate"
            :disabled="disabled || entry.disabled"
            :size="size"
            :tabindex="-1"
            aria-hidden="true"
            @click.stop
            @update:model-value="
              emit('choose', entry, undefined, $event === true)
            "
          />
          <HysRadio
            v-else-if="strict && showPrefix"
            :model-value="context(entry).checked ? entry.value : null"
            :value="entry.value"
            :disabled="disabled || entry.disabled"
            :size="size"
            :tabindex="-1"
            aria-hidden="true"
            @click.stop
            @update:model-value="emit('choose', entry, undefined, true)"
          />
          <span
            class="hys-ui-cascader-option-label"
            :title="search ? context(entry).label : entry.label"
            ><slot v-if="search" name="suggestion" v-bind="context(entry)">{{
              context(entry).label
            }}</slot
            ><slot v-else name="option" v-bind="context(entry)">{{
              entry.label
            }}</slot></span
          >
          <button
            v-if="error(entry)"
            type="button"
            class="hys-ui-cascader-expand hys-ui-cascader-retry"
            :aria-label="retryText + ' ' + entry.label"
            :disabled="disabled"
            @click.stop="emit('retry', entry)"
          >
            <RotateCw :size="14" /><span>{{ retryText }}</span>
          </button>
          <span
            v-else-if="context(entry).loading"
            class="hys-ui-cascader-expand"
            ><slot name="loading" v-bind="context(entry)"
              ><LoaderCircle :size="15" class="hys-ui-icon-spin" /></slot
          ></span>
          <button
            v-else-if="!search && hasChildren(entry)"
            type="button"
            class="hys-ui-cascader-expand"
            tabindex="-1"
            :disabled="disabled || entry.disabled"
            :aria-label="expandLabel(entry)"
            @click.stop="emit('expand', entry)"
          >
            <slot name="expand-icon" v-bind="context(entry)"
              ><ChevronRight :size="15"
            /></slot>
          </button>
          <Check
            v-else-if="!multiple && !strict && context(entry).checked"
            :size="15"
            class="hys-ui-cascader-selected-icon"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.hys-ui-cascader-column {
  position: relative;
  min-height: 0;
  flex: 1 0 180px;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 3px;
  box-sizing: border-box;
  border-inline-end: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-cascader-column:last-child {
  border-inline-end: 0;
}
.hys-ui-cascader-results {
  flex: 1 1 auto;
  width: 100%;
  border: 0;
}
.hys-ui-cascader-space,
.hys-ui-cascader-rows {
  position: relative;
  min-width: 0;
}
.hys-ui-cascader-rows {
  display: grid;
  gap: 3px;
}
.hys-ui-cascader-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hys-ui-cascader-item-height);
  box-sizing: border-box;
  padding: 7px 9px;
  border-radius: 7px;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  cursor: pointer;
  outline: none;
  font-size: 13px;
}
.hys-ui-cascader-option:not(.hys-ui-cascader-option-disabled):hover {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-cascader-option-active {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-cascader-option-checked {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-weight: 600;
}
.hys-ui-cascader-option-checked:not(.hys-ui-cascader-option-disabled):hover {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-cascader-option:focus-visible {
  box-shadow: inset 0 0 0 1px var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-option-disabled {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-ui-cascader-column[data-size="sm"] .hys-ui-cascader-option {
  font-size: 12px;
  padding: 4px 8px;
}
.hys-ui-cascader-column[data-size="lg"] .hys-ui-cascader-option {
  font-size: 14px;
  padding: 8px 10px;
}
.hys-ui-cascader-option-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}
.hys-ui-cascader-expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: none;
  width: 20px;
  height: 22px;
  border: 0;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  padding: 0;
  cursor: pointer;
  border-radius: 4px;
}
.hys-ui-cascader-expand:hover {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-expand:disabled {
  cursor: not-allowed;
}
.hys-ui-cascader-expand:focus-visible {
  outline: 1px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-cascader-selected-icon {
  flex: none;
}
.hys-ui-cascader-retry {
  width: auto;
  min-width: 20px;
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger));
  font: inherit;
  font-size: 11px;
}
.hys-ui-cascader-column-virtual .hys-ui-cascader-rows {
  gap: 0;
}
.hys-ui-cascader-option-fixed {
  height: var(--hys-ui-cascader-item-height);
  min-height: 0;
  border-block: 2px solid transparent;
  background-clip: padding-box;
}
</style>
