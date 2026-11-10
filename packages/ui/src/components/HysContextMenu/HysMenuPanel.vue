<script setup lang="ts" generic="N extends object">
import { computed, ref, useSlots, onBeforeUpdate } from "vue";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Circle,
  CircleDot,
  Square,
  SquareCheck,
  LoaderCircle,
} from "lucide-vue-next";
import HysMenuSlot from "./HysMenuSlot";
import {
  menuSafeRel,
  type MenuRow,
  type HysMenuItemContext,
} from "../../composables/menu";
const props = defineProps<{
  rows: readonly MenuRow<N>[];
  level: number;
  id: string;
  rootId: string;
  label: string;
  parentLabel?: string;
  busy: boolean;
  loading: boolean;
  emptyText: string;
  loadingText: string;
  backText: string;
  direction?: "ltr" | "rtl";
  context: (row: MenuRow<N>) => HysMenuItemContext<N>;
  tabbable: (row: MenuRow<N>) => number;
}>();
const emit = defineEmits<{
  choose: [row: MenuRow<N>, event: MouseEvent];
  focusRow: [row: MenuRow<N>];
  hoverRow: [row: MenuRow<N>];
  keyboard: [event: KeyboardEvent];
  back: [];
  scroll: [];
}>();
const element = ref<HTMLElement>(),
  slots = useSlots(),
  prefix = computed(
    () =>
      !!slots.icon ||
      props.rows.some(
        (row) =>
          row.icon ||
          ["checkbox", "radio"].includes(row.type) ||
          props.context(row).selected,
      ),
  );
const cached = new Map<string, Record<string, unknown>>();
onBeforeUpdate(() => cached.clear());
function attrs(row: MenuRow<N>) {
  const previous = cached.get(row.id);
  if (previous) return previous;
  const state = props.context(row),
    branch = !!row.children.length;
  const result = {
    id: props.rootId + "-item-" + row.id,
    "data-hys-menu-item": "",
    role:
      !branch && row.type === "checkbox"
        ? "menuitemcheckbox"
        : !branch && row.type === "radio"
          ? "menuitemradio"
          : "menuitem",
    tabindex: props.tabbable(row),
    title: row.description ? row.label + " · " + row.description : row.label,
    "aria-disabled": state.disabled || undefined,
    "aria-haspopup": branch ? "menu" : undefined,
    "aria-expanded": branch ? state.expanded : undefined,
    "aria-controls":
      branch && state.expanded
        ? props.rootId + "-menu-" + (props.level + 1)
        : undefined,
    "aria-checked":
      !branch && ["checkbox", "radio"].includes(row.type)
        ? state.checked
        : undefined,
    "aria-describedby":
      row.description && !(slots.link && row.href && !row.children.length)
        ? props.rootId + "-description-" + row.id
        : undefined,
    class: [
      "hys-ui-menu-item",
      {
        "hys-ui-menu-selected": state.selected,
        "hys-ui-menu-expanded": state.expanded,
        "hys-ui-menu-danger": row.danger,
      },
    ],
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      emit("choose", row, event);
    },
    onFocus: () => emit("focusRow", row),
    onPointerenter: () => emit("hoverRow", row),
  };
  cached.set(row.id, result);
  return result;
}
defineExpose({ element });
</script>
<template>
  <section
    ref="element"
    class="hys-ui-ent-context hys-ui-menu-panel"
    :dir="direction"
    :style="{ '--hys-ui-menu-prefix': prefix ? '16px' : '0px' }"
    @keydown="emit('keyboard', $event)"
  >
    <div v-if="$slots.header" class="hys-ui-menu-header">
      <slot name="header" />
    </div>
    <button
      v-if="level"
      type="button"
      class="hys-ui-menu-back"
      @click="emit('back')"
    >
      <ChevronLeft :size="14" /><span>{{ backText }} · {{ parentLabel }}</span>
    </button>
    <div
      :id="id"
      role="menu"
      tabindex="-1"
      :aria-label="label"
      :aria-busy="loading || undefined"
      class="hys-ui-menu-body"
      @scroll="emit('scroll')"
    >
      <div v-if="loading" role="status" class="hys-ui-menu-message">
        <slot name="loading"
          ><LoaderCircle :size="18" class="hys-ui-menu-spinner" /><span>{{
            loadingText
          }}</span></slot
        >
      </div>
      <div
        v-else-if="
          !rows.some((row) => row.type !== 'divider' && row.type !== 'group')
        "
        class="hys-ui-menu-message"
      >
        <slot name="empty">{{ emptyText }}</slot>
      </div>
      <template v-else v-for="row in rows" :key="row.id">
        <hr
          v-if="row.type === 'divider'"
          role="separator"
          class="hys-ui-menu-divider"
        />
        <div
          v-else-if="row.type === 'group'"
          role="presentation"
          class="hys-ui-menu-group"
        >
          {{ row.label }}
        </div>
        <HysMenuSlot
          v-else-if="
            $slots.link && row.href && !row.disabled && !row.children.length
          "
          :content="$slots.link"
          :scope="{
            ...context(row),
            attrs: {
              ...attrs(row),
              href: row.href,
              target: row.target,
              rel: menuSafeRel(row.target, row.rel),
            },
          }"
          :node-attrs="attrs(row)"
        />
        <component
          :is="
            row.href && !row.disabled && !row.children.length ? 'a' : 'button'
          "
          v-else
          v-bind="attrs(row)"
          :type="
            !row.href || row.disabled || row.children.length
              ? 'button'
              : undefined
          "
          :href="!row.disabled && !row.children.length ? row.href : undefined"
          :target="row.target"
          :rel="menuSafeRel(row.target, row.rel)"
          :disabled="
            !row.href || row.disabled || row.children.length
              ? row.disabled || busy
              : undefined
          "
        >
          <span class="hys-ui-menu-prefix" aria-hidden="true"
            ><slot name="icon" v-bind="context(row)"
              ><component
                :is="context(row).checked ? CircleDot : Circle"
                v-if="row.type === 'radio' && !row.children.length"
                :size="15" /><component
                :is="context(row).checked ? SquareCheck : Square"
                v-else-if="row.type === 'checkbox' && !row.children.length"
                :size="15" /><Check
                v-else-if="context(row).checked || context(row).selected"
                :size="15" /><component
                :is="row.icon"
                v-else-if="row.icon"
                :size="16" /></slot
          ></span>
          <span class="hys-ui-menu-copy"
            ><span class="hys-ui-menu-label"
              ><slot name="item" v-bind="context(row)">{{
                row.label
              }}</slot></span
            ><small
              v-if="row.description"
              :id="rootId + '-description-' + row.id"
              class="hys-ui-menu-description"
              >{{ row.description }}</small
            ></span
          >
          <kbd v-if="row.shortcut" class="hys-ui-menu-shortcut">{{
            row.shortcut
          }}</kbd
          ><span v-else />
          <component
            :is="direction === 'rtl' ? ChevronLeft : ChevronRight"
            v-if="row.children.length"
            :size="14"
            class="hys-ui-menu-chevron"
            aria-hidden="true"
          /><span v-else />
        </component>
      </template>
    </div>
    <div v-if="$slots.footer" class="hys-ui-menu-footer">
      <slot name="footer" />
    </div>
  </section>
</template>
<style scoped>
.hys-ui-menu-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: max-content;
  min-width: min(var(--hys-ui-menu-min-width, 190px), calc(100vw - 16px));
  /* Keep user bounds when the positioning engine writes viewport limits inline. */
  max-width: min(
    var(--hys-ui-menu-max-width, 360px),
    calc(100vw - 16px)
  ) !important;
  max-height: min(
    var(--hys-ui-menu-max-height, 320px),
    calc(100dvh - 16px)
  ) !important;
  padding: 5px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 11px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow:
    0 12px 36px #10204020,
    0 2px 8px #10204008;
  font-size: 13px;
  line-height: 1.4;
  text-align: start;
  isolation: isolate;
  pointer-events: auto;
}
.hys-ui-menu-body {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px;
  outline: none;
}
.hys-ui-menu-item {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: var(--hys-ui-menu-prefix) minmax(0, 1fr) auto 14px;
  align-items: center;
  column-gap: 8px;
  flex: none;
  width: 100%;
  min-height: 34px;
  margin: 0;
  padding: 7px 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
  outline: none;
}
.hys-ui-menu-prefix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-menu-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.hys-ui-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-menu-description {
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-ui-menu-shortcut {
  border: 0;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font:
    11px ui-monospace,
    monospace;
  white-space: nowrap;
}
.hys-ui-menu-chevron {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-menu-item:not(:disabled):not([aria-disabled="true"]):hover,
.hys-ui-menu-expanded:not(:disabled) {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-menu-item:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-menu-selected,
.hys-ui-menu-selected:not(:disabled):hover {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-menu-selected .hys-ui-menu-prefix {
  color: inherit;
}
.hys-ui-menu-danger {
  color: var(--hys-ui-danger, #e3485c);
}
.hys-ui-menu-item:disabled,
.hys-ui-menu-item[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-menu-divider {
  height: 0;
  border: 0;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  margin: 4px 5px;
  flex: none;
}
.hys-ui-menu-group {
  padding: 7px 9px 3px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.hys-ui-menu-message {
  padding: 22px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 25px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-menu-header,
.hys-ui-menu-footer {
  padding: 8px 9px;
  flex: none;
}
.hys-ui-menu-header {
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  margin-bottom: 4px;
}
.hys-ui-menu-footer {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  margin-top: 4px;
}
.hys-ui-menu-back {
  display: none;
  align-items: center;
  gap: 6px;
  flex: none;
  min-width: 0;
  font: inherit;
  color: inherit;
  border: 0;
  background: transparent;
  padding: 8px;
}
.hys-ui-menu-back span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-menu-panel[data-size="sm"] .hys-ui-menu-item {
  min-height: 29px;
  padding: 5px 8px;
  font-size: 12px;
}
.hys-ui-menu-panel[data-size="lg"] .hys-ui-menu-item {
  min-height: 41px;
  padding: 10px 11px;
  font-size: 14px;
}
.hys-ui-menu-panel[data-size="sm"] {
  font-size: 12px;
}
.hys-ui-menu-panel[data-size="lg"] {
  font-size: 14px;
}
.hys-ui-menu-spinner {
  animation: hys-ui-menu-spin 0.9s linear infinite;
}
@keyframes hys-ui-menu-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 650px) {
  .hys-ui-menu-back {
    display: flex;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-menu-spinner {
    animation: none;
  }
}
</style>
