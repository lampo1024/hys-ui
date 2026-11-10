<script setup lang="ts">
import {
  computed,
  h,
  onBeforeUpdate,
  toRaw,
  type Component,
  type FunctionalComponent,
  type VNodeChild,
} from "vue";
import { ChevronDown, Ellipsis } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import type { HysPopupMotionProps } from "../../motion/popup";
import {
  menuSafeRel,
  type HysContextMenuItem,
  type HysMenuSelectInfo,
} from "../../composables/menu";
import HysContextMenu from "../HysContextMenu/HysContextMenu.vue";
import HysMenuSlot from "../HysContextMenu/HysMenuSlot";
export interface HysBreadcrumbItem {
  label: string;
  href?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  separator?: string;
  showSeparator?: boolean;
  icon?: Component;
  title?: string;
  children?: readonly HysBreadcrumbItem[];
  to?: unknown;
  replace?: boolean;
}
export interface HysBreadcrumbSelectInfo {
  index: number;
  parent?: HysBreadcrumbItem;
  path: readonly HysBreadcrumbItem[];
  source: "dropdown" | "overflow";
  event?: MouseEvent | KeyboardEvent;
}
export interface HysBreadcrumbProps extends HysPopupMotionProps {
  items: readonly HysBreadcrumbItem[];
  separator?: string;
  separatorIcon?: Component;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  maxItemWidth?: number | string;
  ellipsisLabel?: string;
  dropdownLabel?: string;
}
const props = withDefaults(defineProps<HysBreadcrumbProps>(), {
  separator: "/",
  ariaLabel: "面包屑",
  size: "md",
  maxItems: 0,
  itemsBeforeCollapse: 1,
  itemsAfterCollapse: 1,
  ellipsisLabel: "更多层级",
  dropdownLabel: "{label} 的其他页面",
});
const slots = defineSlots<{
  item?: (scope: {
    item: HysBreadcrumbItem;
    index: number;
    current: boolean;
  }) => VNodeChild;
  link?: (scope: {
    item: HysBreadcrumbItem;
    index: number;
    current: boolean;
    attrs: Record<string, unknown>;
  }) => VNodeChild;
  separator?: (scope: { item: HysBreadcrumbItem; index: number }) => VNodeChild;
  overflow?: (scope: { items: readonly HysBreadcrumbItem[] }) => VNodeChild;
}>();
const emit = defineEmits<{
    select: [item: HysBreadcrumbItem, index: number, event: MouseEvent];
    dropdownSelect: [item: HysBreadcrumbItem, info: HysBreadcrumbSelectInfo];
  }>(),
  skin = useHysRootAttrs();
type Entry =
  | { kind: "item"; item: HysBreadcrumbItem; index: number }
  | {
      kind: "overflow";
      items: { item: HysBreadcrumbItem; index: number }[];
      index: number;
    };
const integer = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
const entries = computed<Entry[]>(() => {
  const items = props.items.map((item, index) => ({
      kind: "item" as const,
      item,
      index,
    })),
    max = integer(props.maxItems, 0);
  if (max < 3 || items.length <= max) return items;
  const before = Math.max(
      1,
      Math.min(max - 2, integer(props.itemsBeforeCollapse, 1)),
    ),
    after = Math.max(
      1,
      Math.min(max - before - 1, integer(props.itemsAfterCollapse, 1)),
    );
  return [
    ...items.slice(0, before),
    {
      kind: "overflow",
      items: items.slice(before, items.length - after),
      index: before,
    },
    ...items.slice(-after),
  ];
});
interface MenuEntry extends HysContextMenuItem {
  value: string;
  crumb: HysBreadcrumbItem;
  index: number;
  children?: MenuEntry[];
}
function menuItems(
  list: readonly { item: HysBreadcrumbItem; index: number }[],
  nested: boolean,
): MenuEntry[] {
  const seen = new WeakSet<object>();
  function walk(
    item: HysBreadcrumbItem,
    index: number,
    path: number[],
    depth: number,
  ): MenuEntry | undefined {
    const raw = toRaw(item);
    if (seen.has(raw) || depth > 32) return;
    seen.add(raw);
    const children = nested
      ? item.children?.flatMap((child, i) => {
          const entry = walk(child, index, path.concat(i), depth + 1);
          return entry ? [entry] : [];
        })
      : undefined;
    seen.delete(raw);
    return {
      value: path.join("-"),
      label: item.label,
      href:
        item.href ?? (slots.link && item.to !== undefined ? "#" : undefined),
      target: item.target,
      rel: item.rel,
      disabled: item.disabled,
      icon: item.icon ? toRaw(item.icon) : undefined,
      children,
      crumb: item,
      index,
    };
  }
  return list.flatMap(({ item, index }, position) => {
    const entry = walk(item, index, [index, position], 0);
    return entry ? [entry] : [];
  });
}
function children(item: HysBreadcrumbItem, index: number) {
  return menuItems(
    (item.children ?? []).map((child) => ({ item: child, index })),
    true,
  );
}
function selected(
  info: HysMenuSelectInfo<MenuEntry>,
  source: "dropdown" | "overflow",
  parent?: HysBreadcrumbItem,
) {
  const item = info.item.crumb,
    index = info.item.index;
  if (info.event instanceof MouseEvent) emit("select", item, index, info.event);
  emit("dropdownSelect", item, {
    index,
    parent,
    path: info.path.map((node) => node.crumb),
    source,
    event: info.event,
  });
}
const cached = new Map<number, Record<string, unknown>>();
onBeforeUpdate(() => cached.clear());
function linkAttrs(item: HysBreadcrumbItem, index: number) {
  const previous = cached.get(index);
  if (previous) return previous;
  const attrs = {
    ...(item.href !== undefined ? { href: item.href } : {}),
    target: item.target,
    rel: menuSafeRel(item.target, item.rel),
    class: "hys-ui-breadcrumb-link",
    onClick: (event: MouseEvent) => emit("select", item, index, event),
  };
  cached.set(index, attrs);
  return attrs;
}
function menuLink(scope: { item: MenuEntry; attrs: Record<string, unknown> }) {
  const attrs = { ...scope.attrs };
  if (scope.item.crumb.href === undefined) delete attrs.href;
  return {
    item: scope.item.crumb,
    index: scope.item.index,
    current: false,
    attrs,
  };
}
const Label: FunctionalComponent<{
  item: HysBreadcrumbItem;
  index: number;
  current: boolean;
}> = (value) =>
  slots.item?.(value) ?? [
    value.item.icon
      ? h(toRaw(value.item.icon), {
          size: props.size === "lg" ? 17 : 14,
          "aria-hidden": "true",
        })
      : null,
    h(
      "span",
      {
        class: "hys-ui-breadcrumb-label",
        title:
          value.item.title ??
          (props.maxItemWidth ? value.item.label : undefined),
      },
      value.item.label,
    ),
  ];
const menuProps = computed(() => ({
  trigger: "click" as const,
  size: props.size,
  disabled: props.disabled,
  popupTransition: props.popupTransition,
  popupTransitionDuration: props.popupTransitionDuration,
}));
</script>
<template>
  <nav
    v-bind="skin"
    :aria-label="ariaLabel"
    :class="[
      'hys-ui-breadcrumb',
      'hys-ui-breadcrumb-' + size,
      { 'hys-ui-breadcrumb-truncate': maxItemWidth !== undefined },
    ]"
    :style="{
      '--hys-ui-breadcrumb-item-width':
        typeof maxItemWidth === 'number'
          ? Math.max(24, maxItemWidth) + 'px'
          : maxItemWidth,
    }"
  >
    <ol class="hys-ui-ex-breadcrumb">
      <li v-for="entry in entries" :key="entry.kind + '-' + entry.index">
        <span
          v-if="
            entry.index &&
            (entry.kind === 'overflow' || entry.item.showSeparator !== false)
          "
          class="hys-ui-breadcrumb-separator"
          aria-hidden="true"
          ><slot
            name="separator"
            :item="entry.kind === 'item' ? entry.item : entry.items[0].item"
            :index="entry.index"
            ><component
              :is="separatorIcon"
              v-if="separatorIcon"
              :size="14"
            /><template v-else>{{
              entry.kind === "item"
                ? (entry.item.separator ?? separator)
                : separator
            }}</template></slot
          ></span
        >
        <HysContextMenu
          v-if="entry.kind === 'overflow'"
          v-bind="menuProps"
          :items="menuItems(entry.items, false)"
          :aria-label="ellipsisLabel"
          @select="(_, info) => selected(info, 'overflow')"
        >
          <button
            type="button"
            class="hys-ui-breadcrumb-overflow"
            :aria-label="ellipsisLabel"
            :disabled="disabled"
          >
            <slot name="overflow" :items="entry.items.map((row) => row.item)"
              ><Ellipsis :size="17"
            /></slot>
          </button>
          <template v-if="slots.link" #link="scope"
            ><HysMenuSlot
              :content="slots.link"
              :scope="menuLink(scope)"
              :node-attrs="menuLink(scope).attrs"
          /></template>
        </HysContextMenu>
        <span v-else class="hys-ui-breadcrumb-node">
          <template
            v-if="
              entry.index !== items.length - 1 &&
              !disabled &&
              !entry.item.disabled &&
              (entry.item.href || (slots.link && entry.item.to !== undefined))
            "
          >
            <HysMenuSlot
              v-if="slots.link"
              :content="slots.link"
              :scope="{
                item: entry.item,
                index: entry.index,
                current: false,
                attrs: linkAttrs(entry.item, entry.index),
              }"
              :node-attrs="linkAttrs(entry.item, entry.index)"
            />
            <a v-else v-bind="linkAttrs(entry.item, entry.index)"
              ><Label :item="entry.item" :index="entry.index" :current="false"
            /></a>
          </template>
          <span
            v-else
            class="hys-ui-breadcrumb-item"
            :aria-current="
              entry.index === items.length - 1 ? 'page' : undefined
            "
            :aria-disabled="disabled || entry.item.disabled || undefined"
            ><Label
              :item="entry.item"
              :index="entry.index"
              :current="entry.index === items.length - 1"
          /></span>
          <HysContextMenu
            v-if="entry.item.children?.length"
            v-bind="menuProps"
            :disabled="disabled || entry.item.disabled"
            :items="children(entry.item, entry.index)"
            :aria-label="dropdownLabel.replace('{label}', entry.item.label)"
            @select="(_, info) => selected(info, 'dropdown', entry.item)"
          >
            <button
              type="button"
              class="hys-ui-breadcrumb-arrow"
              :disabled="disabled || entry.item.disabled"
              :aria-label="dropdownLabel.replace('{label}', entry.item.label)"
            >
              <ChevronDown :size="13" />
            </button>
            <template v-if="slots.link" #link="scope"
              ><HysMenuSlot
                :content="slots.link"
                :scope="menuLink(scope)"
                :node-attrs="menuLink(scope).attrs"
            /></template>
          </HysContextMenu>
        </span>
      </li>
    </ol>
  </nav>
</template>
<style scoped>
.hys-ui-breadcrumb {
  min-width: 0;
  white-space: normal;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 13px;
}
.hys-ui-ex-breadcrumb {
  flex-wrap: wrap;
  font: inherit;
  color: inherit;
}
.hys-ui-ex-breadcrumb :deep(span) {
  margin: 0;
  color: inherit;
}
.hys-ui-ex-breadcrumb li {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 9px;
  line-height: 1.6;
}
.hys-ui-breadcrumb-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}
.hys-ui-breadcrumb-link,
.hys-ui-breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: inherit;
}
.hys-ui-breadcrumb-link {
  text-decoration: none;
}
.hys-ui-breadcrumb-link:hover {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  text-decoration: underline;
}
.hys-ui-breadcrumb-item[aria-current="page"] {
  font-weight: 500;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-breadcrumb-item[aria-disabled="true"] {
  opacity: 0.5;
}
.hys-ui-breadcrumb-separator {
  display: inline-flex;
  align-items: center;
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-breadcrumb-arrow,
.hys-ui-breadcrumb-overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 22px;
  min-height: 24px;
  border: 0;
  border-radius: 5px;
  padding: 2px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.hys-ui-breadcrumb-arrow:hover:not(:disabled),
.hys-ui-breadcrumb-overflow:hover:not(:disabled) {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-breadcrumb-arrow:disabled,
.hys-ui-breadcrumb-overflow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-breadcrumb-arrow:focus-visible,
.hys-ui-breadcrumb-overflow:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 1px;
}
.hys-ui-breadcrumb-sm {
  font-size: 12px;
}
.hys-ui-breadcrumb-lg {
  font-size: 15px;
}
.hys-ui-breadcrumb-truncate :deep(.hys-ui-breadcrumb-label) {
  max-width: var(--hys-ui-breadcrumb-item-width);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
