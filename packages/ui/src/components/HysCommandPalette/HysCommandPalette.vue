<script setup lang="ts">
import type { HysPopupMotionProps } from "../../motion/popup";

import PopupMotion from "../../motion/PopupMotion";

import { useHysRootAttrs } from "../../config";
const hysRootAttrs = useHysRootAttrs();

import { Command } from "lucide-vue-next";

import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  nextTick,
  watch,
  useId,
} from "vue";
import { useDialog } from "../../composables/useDialog";
export interface HysCommandAction {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
}
const props = withDefaults(
  defineProps<
    HysPopupMotionProps & {
      actions: HysCommandAction[];
      hotkey?: string | false;
      placeholder?: string;
      emptyText?: string;
      recentLimit?: number;
    }
  >(),
  { hotkey: "k", placeholder: "搜索操作…", emptyText: "没有匹配的命令", recentLimit: 0 },
);
const emit = defineEmits<{ select: [id: string] }>();
const recent = defineModel<string[]>("recent", { default: () => [] });
const limit = computed(() => Number.isFinite(props.recentLimit) ? Math.max(0, Math.floor(props.recentLimit)) : 0);
const resultsId = useId(),
  open = ref(false),
  query = ref(""),
  index = ref(-1),
  input = ref<HTMLInputElement | null>(null),
  trigger = ref<HTMLButtonElement | null>(null),
  dialog = ref<HTMLElement>();
const { active, zIndex } = useDialog(open, dialog, close);
const filtered = computed(() => {
  const tokens = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length && limit.value) {
    const byId = new Map(props.actions.map((action) => [action.id, action]));
    const pinned = [...new Set(recent.value)].flatMap((id) => {
      const action = byId.get(id);
      return action && !action.disabled ? [action] : [];
    }).slice(0, limit.value);
    const used = new Set(pinned.map(({ id }) => id));
    return [...pinned, ...props.actions.filter(({ id }) => !used.has(id))];
  }
  return props.actions.filter((action) => {
    const text = [action.label, action.description, ...(action.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => text.includes(token));
  });
});
const enabled = computed(() =>
  filtered.value.flatMap((action, position) =>
    action.disabled ? [] : [position],
  ),
);
watch(enabled, (positions) => {
  if (!positions.includes(index.value)) index.value = positions[0] ?? -1;
});
watch(query, () => {
  index.value = enabled.value[0] ?? -1;
});
function show() {
  open.value = true;
  query.value = "";
  index.value = enabled.value[0] ?? -1;
  void nextTick(() => input.value?.focus());
}
function close() {
  open.value = false;
}
function choose(id: string) {
  const action = props.actions.find((item) => item.id === id);
  if (!action || action.disabled) return;
  if (limit.value) recent.value = [...new Set([id, ...recent.value])].slice(0, limit.value);
  emit("select", id);
  close();
}
function key(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.repeat ||
    !props.hotkey ||
    event.altKey ||
    event.shiftKey
  )
    return;
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === props.hotkey.toLowerCase()
  ) {
    event.preventDefault();
    open.value ? close() : show();
  }
}
function inputKey(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === "Enter" && filtered.value[index.value]) {
    event.preventDefault();
    choose(filtered.value[index.value].id);
    return;
  }
  if (
    !enabled.value.length ||
    !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)
  )
    return;
  event.preventDefault();
  const current = enabled.value.indexOf(index.value);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? enabled.value.length - 1
        : (current +
            (event.key === "ArrowDown" ? 1 : -1) +
            enabled.value.length) %
          enabled.value.length;
  index.value = enabled.value[next];
  void nextTick(() =>
    dialog.value
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: "nearest" }),
  );
}
onMounted(() => window.addEventListener("keydown", key));
onActivated(() => window.addEventListener("keydown", key));
onDeactivated(() => window.removeEventListener("keydown", key));
onUnmounted(() => window.removeEventListener("keydown", key));
defineExpose({ open: show, close });
</script>
<template>
  <button
    v-bind="hysRootAttrs"
    ref="trigger"
    type="button"
    class="hys-ui-v4-control"
    @click="show"
  >
    <Command :size="14" aria-hidden="true" />
    快捷命令<span v-if="hotkey"> · Ctrl / ⌘ + {{ hotkey.toUpperCase() }}</span>
  </button>
  <Teleport to="body">
    <PopupMotion
      ignore-owner
      :popup-transition="props.popupTransition"
      :popup-transition-duration="props.popupTransitionDuration"
      @inactive="close"
    >
      <div
        v-if="open && active"
        v-bind="hysRootAttrs"
        class="hys-ui-v4-backdrop hys-ui-popup-backdrop"
        :style="{ zIndex }"
        @pointerdown.self="close"
      >
        <section
          ref="dialog"
          tabindex="-1"
          class="hys-ui-v4-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="快捷命令"
        >
          <input
            ref="input"
            v-model="query"
            class="hys-ui-v4-control"
            :placeholder="placeholder"
            aria-label="搜索命令"
            role="combobox"
            :aria-controls="resultsId"
            :aria-expanded="true"
            :aria-activedescendant="
              index < 0 ? undefined : resultsId + '-' + index
            "
            @keydown="inputKey"
          />
          <div :id="resultsId" role="listbox" class="hys-ui-v4-scroll hys-ui-scrollbar">
            <button
              v-for="(action, position) in filtered"
              :id="resultsId + '-' + position"
              :key="action.id"
              type="button"
              tabindex="-1"
              class="hys-ui-v4-option"
              :class="{ 'hys-ui-v4-active': position === index }"
              role="option"
              :aria-selected="position === index"
              :disabled="action.disabled"
              @pointerenter="!action.disabled && (index = position)"
              @click="choose(action.id)"
            >
              <slot name="action" :action="action" :active="position === index"
                >{{ action.label }}
                <small>{{ action.description }}</small></slot
              >
            </button>
          </div>
          <p v-if="!filtered.length" role="status">{{ emptyText }}</p>
          <button type="button" class="hys-ui-v4-option" @click="close">
            关闭 Esc
          </button>
        </section>
      </div>
    </PopupMotion>
  </Teleport>
</template>
