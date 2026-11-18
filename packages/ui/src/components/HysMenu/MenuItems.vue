<script setup lang="ts">
import { type VNodeChild } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import { Check, ChevronDown } from "../HysIcon/svgIcons";
import { menuSafeRel, type MenuRow } from "../../composables/menu";
import type { NavigationMenuItem } from "./menuTypes";
import type { useMenuNavigation } from "./useMenuNavigation";

type Row = MenuRow<NavigationMenuItem>;
const props = defineProps<{
  rows: readonly Row[];
  actions: boolean;
  selectionMode?: "single" | "multiple";
  idBase: string;
  depth: number;
  navigation: ReturnType<typeof useMenuNavigation>;
}>();
defineSlots<{
  item?: (scope: {
    item: NavigationMenuItem;
    label: string;
    selected: boolean;
  }) => VNodeChild;
}>();

function safeHref(row: Row) {
  const href = row.href?.trim();
  if (
    !href ||
    props.navigation.hasChildren(row) ||
    props.navigation.isDisabled(row)
  )
    return;
  const scheme = href
    .replace(/[\u0000-\u0020]/gu, "")
    .match(/^([a-z][a-z\d+.-]*):/iu)?.[1]
    ?.toLowerCase();
  if (!scheme || ["http", "https", "mailto", "tel"].includes(scheme))
    return href;
}

function attrs(row: Row) {
  const branch = props.navigation.hasChildren(row);
  const checkable = props.actions && !branch && !!props.selectionMode;
  return {
    class: [
      "hys-menu-item",
      {
        "is-selected": props.navigation.isSelected(row),
        "is-active-branch": props.navigation.isActiveBranch(row),
        "is-danger": row.danger,
      },
    ],
    id: props.idBase + "-item-" + row.id,
    "data-hys-menubar-row": row.id,
    role: checkable
      ? props.selectionMode === "multiple"
        ? "menuitemcheckbox"
        : "menuitemradio"
      : props.actions
        ? "menuitem"
        : undefined,
    "aria-checked": checkable ? props.navigation.isSelected(row) : undefined,
    "aria-describedby": row.description ? props.idBase + "-description-" + row.id : undefined,
    tabindex: props.actions
      ? props.navigation.tabId.value === row.id
        ? 0
        : -1
      : undefined,
    "aria-disabled": props.navigation.isDisabled(row) || undefined,
    "aria-haspopup": branch && props.actions ? "menu" : undefined,
    "aria-expanded": branch ? props.navigation.isOpen(row) : undefined,
    "aria-controls":
      branch && props.navigation.isOpen(row)
        ? props.idBase + "-branch-" + row.id
        : undefined,
    "aria-current":
      !props.actions && props.navigation.isSelected(row) ? "page" : undefined,
  };
}
</script>

<template>
  <ul
    class="hys-menu-list"
    :role="actions ? (depth ? 'menu' : 'presentation') : 'list'"
  >
    <li
      v-for="row in rows.filter(navigation.isShown)"
      :key="row.id"
      :role="actions ? 'presentation' : undefined"
    >
      <div
        v-if="row.type === 'group'"
        class="hys-menu-group"
        :style="{ paddingInlineStart: depth * 14 + 10 + 'px' }"
      >
        {{ row.label }}
      </div>
      <div
        v-else-if="row.type === 'divider'"
        class="hys-menu-divider"
        role="separator"
      />
      <template v-else>
        <component
          :is="safeHref(row) ? 'a' : HysButton"
          v-bind="attrs(row)"
          :style="{ paddingInlineStart: depth * 14 + 10 + 'px' }"
          :variant="safeHref(row) ? undefined : 'ghost'"
          :disabled="safeHref(row) ? undefined : navigation.isDisabled(row)"
          :loading="'loading' in row.raw ? row.raw.loading : undefined"
          :aria-busy="'loading' in row.raw && row.raw.loading || undefined"
          :href="safeHref(row)"
          :target="safeHref(row) ? row.target : undefined"
          :rel="safeHref(row) ? menuSafeRel(row.target, row.rel) : undefined"
          @focus="navigation.active.value = row.id"
          @click="navigation.choose(row, $event)"
        >
          <component
            :is="row.icon"
            v-if="row.icon"
            class="hys-menu-icon"
            :size="16"
            aria-hidden="true"
          />
          <span class="hys-menu-label">
            <span>
              <slot
                name="item"
                :item="row.raw"
                :label="row.label"
                :selected="navigation.isSelected(row)"
                >{{ row.label }}</slot
              >
            </span>
            <small v-if="row.description" :id="idBase + '-description-' + row.id" class="hys-menu-description">
              {{ row.description }}
            </small>
          </span>
          <span
            v-if="'badge' in row.raw && row.raw.badge != null"
            class="hys-menu-badge"
            >{{ row.raw.badge }}</span
          >
          <kbd v-if="row.shortcut" class="hys-menu-shortcut">{{
            row.shortcut
          }}</kbd>
          <ChevronDown
            v-if="navigation.hasChildren(row)"
            class="hys-menu-disclosure"
            :size="14"
            aria-hidden="true"
          />
          <Check
            v-else-if="actions && selectionMode"
            class="hys-menu-check"
            :class="{ 'is-checked': navigation.isSelected(row) }"
            :size="14"
            aria-hidden="true"
          />
        </component>
        <MenuItems
          v-if="navigation.hasChildren(row) && navigation.isOpen(row)"
          :id="idBase + '-branch-' + row.id"
          :aria-labelledby="actions ? idBase + '-item-' + row.id : undefined"
          :rows="row.children"
          :actions="actions"
          :selection-mode="selectionMode"
          :id-base="idBase"
          :depth="depth + 1"
          :navigation="navigation"
        >
          <template v-if="$slots.item" #item="scope"
            ><slot name="item" v-bind="scope"
          /></template>
        </MenuItems>
      </template>
    </li>
  </ul>
</template>

<style scoped>
.hys-menu-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.hys-menu-item {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--hys-ui-theme-text);
  font: inherit;
  text-decoration: none;
  text-align: start;
}
.hys-menu-item:hover:not([aria-disabled="true"]) {
  background: var(--hys-ui-theme-surface-alt);
  color: var(--hys-ui-theme-primary);
}
.hys-menu-item:focus-visible {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: -2px;
}
.hys-menu-item.is-selected {
  background: var(--hys-ui-theme-primary-soft);
  color: var(--hys-ui-theme-primary);
}
.hys-menu-item.is-active-branch {
  color: var(--hys-ui-theme-primary);
}
.hys-menu-item.is-danger {
  color: var(--hys-ui-theme-red);
}
.hys-menu-icon,
.hys-menu-disclosure {
  flex: none;
}
.hys-menu-disclosure {
  margin-inline-start: auto;
}
.hys-menu-item[aria-expanded="true"] .hys-menu-disclosure {
  transform: rotate(180deg);
}
.hys-menu-label {
  min-inline-size: 0;
  overflow-wrap: anywhere;
  white-space: normal;
}
.hys-menu-description {
  display: block;
  color: var(--hys-ui-theme-muted);
  font-size: 11px;
}
.hys-menu-group {
  padding: 6px 9px 3px;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.hys-menu-divider {
  border-block-start: 1px solid var(--hys-ui-theme-border);
  margin: 4px 6px;
}
.hys-menu-badge,
.hys-menu-shortcut {
  color: var(--hys-ui-theme-muted);
  font-size: 11px;
}
.hys-menu-badge {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--hys-ui-theme-surface-alt);
}
.hys-menu-shortcut,
.hys-menu-check {
  margin-inline-start: auto;
}
.hys-menu-check {
  visibility: hidden;
  flex: none;
}
.hys-menu-check.is-checked {
  visibility: visible;
}
</style>
