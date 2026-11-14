<script setup lang="ts">
import { computed, ref, toRaw } from "vue";
import { X, LoaderCircle, GripVertical } from "lucide-vue-next";
import HysPopover from "../HysPopover/HysPopover.vue";
import type { HysPopoverInstance } from "../../composables/popupSurface";
import { useHysRootAttrs } from "../../config";
import { useTagInput } from "../../composables/useTagInput";
import type {
  HysTagInputProps,
  HysTagInputSlots,
  HysTagInputInvalid,
} from "../../composables/tagInput";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysTagInputProps>(), {
  modelValue: undefined,
  max: 10,
  placeholder: "输入后按 Enter",
  addOnBlur: true,
  caseSensitive: true,
  trim: true,
  tagTone: "primary",
  tagEffect: "light",
  maxCollapseTags: 1,
  collapseTagsTooltip: true,
  overflowHeight: 240,
  autocomplete: "off",
  validateEvent: true,
});
const emit = defineEmits<{
  "update:modelValue": [values: string[]];
  change: [values: string[]];
  acceptedChange: [values: string[]];
  add: [value: string];
  remove: [value: string];
  reject: [value: string];
  invalid: [info: HysTagInputInvalid];
  clear: [];
  input: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  compositionend: [event: CompositionEvent];
  reorder: [from: number, to: number, values: string[]];
}>();
defineSlots<HysTagInputSlots>();
const state = useTagInput(props, (name, ...args) =>
    (emit as any)(name, ...args),
  ),
  skin = useHysRootAttrs(),
  overflowApi = ref<HysPopoverInstance>(),
  overflowTop = ref(0);
const clearComponent = computed(() =>
  props.clearIcon && typeof props.clearIcon === "object"
    ? toRaw(props.clearIcon)
    : props.clearIcon,
);
const count = computed(() =>
    props.collapseTags
      ? Math.max(
          0,
          Math.floor(
            Number.isFinite(props.maxCollapseTags) ? props.maxCollapseTags : 1,
          ),
        )
      : state.tags.value.length,
  ),
  shown = computed(() => state.tags.value.slice(0, count.value)),
  omitted = computed(() => state.tags.value.slice(shown.value.length)),
  overflowStart = computed(() =>
    Math.max(
      0,
      Math.min(
        Math.max(0, omitted.value.length - 1),
        Math.floor(overflowTop.value / 36) - 3,
      ),
    ),
  ),
  overflowHeight = computed(() =>
    Math.max(
      72,
      Math.min(
        480,
        Number.isFinite(props.overflowHeight) ? props.overflowHeight : 240,
      ),
    ),
  ),
  overflowRows = computed(() =>
    omitted.value.slice(
      overflowStart.value,
      overflowStart.value + Math.ceil(overflowHeight.value / 36) + 6,
    ),
  );
const nativeKey = (key: string) =>
  key === "id" ||
  key.startsWith("aria-") ||
  ["required", "title"].includes(key);
const rootAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(state.attrs).filter(([key]) => !nativeKey(key)),
    ),
  ),
  nativeAttrs = computed(() =>
    Object.fromEntries(
      Object.entries(state.attrs).filter(([key]) => nativeKey(key)),
    ),
  );
function tagScope(value: string, index: number) {
  return {
    value,
    index,
    disabled: state.control.disabled.value,
    readonly: !!props.readonly,
    remove: () => state.remove(index),
  };
}
function display(value: string) {
  return props.maxTagTextLength !== undefined &&
    Number.isFinite(props.maxTagTextLength) &&
    value.length > Math.max(0, props.maxTagTextLength)
    ? value.slice(0, Math.max(0, props.maxTagTextLength)) + "…"
    : value;
}
function focusRoot(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest("button,a,input,[data-tag-index]"))
    state.focus();
}
defineExpose({
  element: state.element,
  input: state.input,
  values: state.values,
  draft: state.draft,
  pending: state.pending,
  focus: state.focus,
  blur: () => state.input.value?.blur(),
  add: (value?: string | string[]) => state.add(value),
  remove: state.remove,
  clear: state.clear,
  move: state.move,
  setDraft: state.setDraft,
});
</script>
<template>
  <div
    v-bind="{ ...skin, ...rootAttrs }"
    :ref="(el) => (state.element.value = el as HTMLElement)"
    class="hys-ui-ex-tags hys-ui-tag-input"
    :class="[
      'hys-ui-tag-input-' + state.control.size.value,
      'hys-ui-tags-' + tagTone,
      'hys-ui-tags-' + tagEffect,
      {
        'hys-ui-tag-input-disabled': state.control.disabled.value,
        'hys-ui-tag-input-readonly': readonly,
        'hys-ui-tag-input-focused': state.focused.value,
        'hys-ui-tags-round': tagRound,
      },
    ]"
    :data-status="state.status.value"
    :aria-disabled="state.control.disabled.value || undefined"
    :aria-busy="state.pending.value || undefined"
    @click="focusRoot"
    @focusin="state.focusIn"
    @focusout="state.focusOut($event, overflowApi?.element)"
  >
    <span v-if="$slots.prefix" class="hys-ui-tags-affix"
      ><slot name="prefix" v-bind="state.context.value"
    /></span>
    <div class="hys-ui-tags-items">
      <span
        v-for="tag in shown"
        :key="tag.key"
        class="hys-ui-ex-tag hys-ui-tag-item"
        :class="{
          'hys-ui-tag-dragging': state.drag.value?.index === tag.index,
          'hys-ui-tag-drop-before':
            state.drop.value?.index === tag.index && !state.drop.value.after,
          'hys-ui-tag-drop-after':
            state.drop.value?.index === tag.index && state.drop.value.after,
        }"
        :data-tag-index="tag.index"
        tabindex="-1"
        :draggable="
          draggable &&
          !state.control.disabled.value &&
          !readonly &&
          !state.pending.value
        "
        @keydown.self="state.tagKey($event, tag.index)"
        @dragstart="state.dragStart($event, tag.index)"
        @dragover="state.dragOver($event, tag.index)"
        @drop="state.dragDrop"
        @dragend="state.stopDrag"
      >
        <GripVertical
          v-if="draggable"
          class="hys-ui-tag-grip"
          :size="12"
          aria-hidden="true"
        />
        <span class="hys-ui-tag-label" :title="tag.value"
          ><slot name="tag" v-bind="tagScope(tag.value, tag.index)">{{
            display(tag.value)
          }}</slot></span
        >
        <button
          v-if="!readonly"
          type="button"
          class="hys-ui-tag-remove"
          :disabled="state.control.disabled.value"
          :aria-label="'移除 ' + tag.value"
          @mousedown.prevent
          @click.stop="state.remove(tag.index)"
          @keydown="state.tagKey($event, tag.index)"
        >
          <slot name="remove-icon" v-bind="tagScope(tag.value, tag.index)"
            ><X :size="12" aria-hidden="true"
          /></slot>
        </button>
      </span>
      <HysPopover
        v-if="omitted.length && collapseTagsTooltip"
        ref="overflowApi"
        trigger="click"
        placement="bottom-start"
        :width="280"
        :disabled="state.control.disabled.value"
        :popup-transition="popupTransition"
        :popup-transition-duration="popupTransitionDuration"
        title="更多标签"
        @hide="overflowTop = 0"
      >
        <template #trigger
          ><button
            type="button"
            class="hys-ui-tag-overflow-trigger"
            :disabled="state.control.disabled.value"
            :aria-label="'查看其余 ' + omitted.length + ' 个标签'"
          >
            <slot
              name="collapse-tag"
              :count="omitted.length"
              :values="omitted.map((tag) => tag.value)"
              >+{{ omitted.length }}</slot
            >
          </button></template
        >
        <div
          class="hys-ui-tag-overflow hys-ui-scrollbar"
          :style="{
            maxHeight: overflowHeight + 'px',
            height: Math.min(omitted.length * 36, overflowHeight) + 'px',
          }"
          role="group"
          aria-label="折叠标签"
          @scroll="overflowTop = ($event.target as HTMLElement).scrollTop"
          @focusin="state.focusIn"
          @focusout="state.focusOut($event, overflowApi?.element)"
        >
          <div
            :style="{
              height: omitted.length * 36 + 'px',
              position: 'relative',
            }"
          >
            <div
              :style="{
                position: 'absolute',
                left: 0,
                right: 0,
                top: overflowStart * 36 + 'px',
              }"
            >
              <div
                v-for="tag in overflowRows"
                :key="tag.key"
                class="hys-ui-tag-overflow-row"
              >
                <span :title="tag.value">{{ tag.value }}</span
                ><button
                  v-if="!readonly"
                  type="button"
                  :aria-label="'移除 ' + tag.value"
                  :disabled="state.control.disabled.value"
                  @click="state.remove(tag.index)"
                >
                  <X :size="14" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </HysPopover>
      <span
        v-else-if="omitted.length"
        class="hys-ui-tag-overflow-trigger"
        :aria-label="'另有 ' + omitted.length + ' 个标签'"
        ><slot
          name="collapse-tag"
          :count="omitted.length"
          :values="omitted.map((tag) => tag.value)"
          >+{{ omitted.length }}</slot
        ></span
      >
      <input
        :ref="(el) => (state.input.value = el as HTMLInputElement)"
        v-bind="{ ...inputProps, ...nativeAttrs }"
        class="hys-ui-tags-native"
        type="text"
        :id="(state.attrs.id as string) || state.field?.id.value"
        data-hys-ui-field-managed
        :value="state.draft.value"
        :placeholder="readonly ? '' : placeholder"
        :disabled="state.control.disabled.value"
        :readonly="readonly"
        :maxlength="maxlength"
        :minlength="minlength"
        :autocomplete="autocomplete"
        :tabindex="tabindex"
        :aria-label="
          ariaLabel ||
          (state.attrs['aria-label'] as string) ||
          label ||
          state.field?.label.value ||
          '输入标签'
        "
        :aria-required="state.field?.required.value || undefined"
        :aria-invalid="state.status.value === 'error' || undefined"
        :aria-describedby="
          [
            state.attrs['aria-describedby'],
            state.field?.describedBy.value,
            error ? state.errorId : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        "
        @input="state.nativeInput"
        @keydown="state.key"
        @paste="state.pasted"
        @compositionstart="state.composing.value = true"
        @compositionend="state.compositionEnd"
      />
    </div>
    <LoaderCircle
      v-if="state.pending.value"
      class="hys-ui-tag-spinner"
      :size="16"
      aria-hidden="true"
    />
    <button
      v-else-if="
        clearable &&
        !readonly &&
        (state.values.value.length || state.draft.value)
      "
      type="button"
      class="hys-ui-tags-clear"
      :disabled="state.control.disabled.value"
      aria-label="清空标签"
      @mousedown.prevent
      @click="state.clear"
    >
      <slot name="clear-icon" v-bind="state.context.value"
        ><component
          :is="clearComponent"
          v-if="clearIcon"
          :size="14"
          aria-hidden="true" /><X v-else :size="14" aria-hidden="true"
      /></slot>
    </button>
    <span v-if="$slots.suffix" class="hys-ui-tags-affix"
      ><slot name="suffix" v-bind="state.context.value"
    /></span>
    <input
      v-for="(value, index) in name && !state.control.disabled.value
        ? state.values.value
        : []"
      :key="index"
      type="hidden"
      :name="name"
      :form="form"
      :value="value"
    />
  </div>
  <small
    v-if="error"
    v-bind="skin"
    :id="state.errorId"
    class="hys-ui-tags-error"
    role="alert"
    >{{ error }}</small
  >
</template>
<style scoped>
.hys-ui-tag-input {
  --hys-ui-tag-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  min-height: 38px;
  padding: 5px 10px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 9px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: text;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-tag-input:focus-within {
  outline: none;
}
.hys-ui-tag-input-focused {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 3px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 12%,
      transparent
    );
}
.hys-ui-tag-input-sm {
  min-height: 30px;
  padding: 3px 8px;
  font-size: 12px;
  gap: 6px;
}
.hys-ui-tag-input-lg {
  min-height: 46px;
  padding: 7px 12px;
  font-size: 15px;
}
.hys-ui-tags-items {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.hys-ui-tag-item,
.hys-ui-tag-overflow-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: none;
  max-width: 100%;
  gap: 4px;
  min-height: 24px;
  box-sizing: border-box;
  padding: 1px 6px;
  background: color-mix(
    in srgb,
    var(--hys-ui-tag-color) 11%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  color: var(--hys-ui-tag-color);
  border: 1px solid transparent;
  border-radius: 5px;
  font: inherit;
  font-size: inherit;
  line-height: 20px;
  user-select: none;
}
.hys-ui-tag-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.hys-ui-tag-item[draggable="true"] {
  cursor: grab;
}
.hys-ui-tag-grip {
  opacity: 0.6;
  flex: none;
}
.hys-ui-tag-dragging {
  opacity: 0.45;
}
.hys-ui-tag-drop-before:before,
.hys-ui-tag-drop-after:after {
  content: "";
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: 2px;
}
.hys-ui-tag-drop-before:before {
  left: -4px;
}
.hys-ui-tag-drop-after:after {
  right: -4px;
}
.hys-ui-tag-remove,
.hys-ui-tags-clear {
  display: inline-grid;
  place-items: center;
  flex: none;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: 3px;
  padding: 2px;
  cursor: pointer;
  line-height: 1;
}
.hys-ui-tag-remove:hover:not(:disabled),
.hys-ui-tags-clear:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 10%, transparent);
}
.hys-ui-tags-clear {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  width: 22px;
  height: 22px;
}
.hys-ui-tags-native {
  flex: 1 1 70px;
  min-width: 40px;
  width: 0;
  max-width: 100%;
  height: 26px;
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
  line-height: 1.5;
}
.hys-ui-tags-native::placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-tag-input-sm .hys-ui-tags-native {
  height: 22px;
}
.hys-ui-tag-input-lg .hys-ui-tags-native {
  height: 30px;
}
.hys-ui-tag-input-sm .hys-ui-tag-item,
.hys-ui-tag-input-sm .hys-ui-tag-overflow-trigger {
  min-height: 22px;
  line-height: 18px;
}
.hys-ui-tag-input-lg .hys-ui-tag-item,
.hys-ui-tag-input-lg .hys-ui-tag-overflow-trigger {
  min-height: 28px;
  line-height: 24px;
}
.hys-ui-tags-success {
  --hys-ui-tag-color: var(--hys-ui-success, #16a46e);
}
.hys-ui-tags-warning {
  --hys-ui-tag-color: var(--hys-ui-warning, #d9860c);
}
.hys-ui-tags-danger {
  --hys-ui-tag-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-tags-neutral {
  --hys-ui-tag-color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-tags-dark .hys-ui-tag-item {
  background: color-mix(in srgb, var(--hys-ui-tag-color) 80%, #000);
  color: white;
}
.hys-ui-tags-outline .hys-ui-tag-item {
  background: transparent;
  border-color: var(--hys-ui-tag-color);
}
.hys-ui-tags-round .hys-ui-tag-item {
  border-radius: 999px;
}
.hys-ui-tags-affix {
  display: inline-flex;
  align-items: center;
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-tag-input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-ui-tag-input-readonly {
  cursor: default;
}
.hys-ui-tag-input button:disabled {
  cursor: not-allowed;
}
.hys-ui-tag-input[data-status="error"] {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-tag-input[data-status="warning"] {
  border-color: var(--hys-ui-warning, #d9860c);
}
.hys-ui-tags-error {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-tag-item:focus-visible,
.hys-ui-tag-input button:focus-visible,
.hys-ui-tag-overflow button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 2px;
}
.hys-ui-tag-overflow-trigger {
  cursor: pointer;
}
.hys-ui-tag-overflow {
  overflow: auto;
  overscroll-behavior: contain;
}
.hys-ui-tag-overflow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  box-sizing: border-box;
  padding: 3px 4px;
}
.hys-ui-tag-overflow-row > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-tag-overflow-row > button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
}
.hys-ui-tag-overflow-row > button:hover {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-tag-spinner {
  flex: none;
  animation: hys-ui-tag-spin 1s linear infinite;
}
@keyframes hys-ui-tag-spin {
  to {
    transform: rotate(360deg);
  }
}
.hys-ui-tag-input[data-hys-motion="off"] .hys-ui-tag-spinner {
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-tag-spinner {
    animation: none;
  }
  .hys-ui-tag-input {
    transition: none;
  }
}
</style>
