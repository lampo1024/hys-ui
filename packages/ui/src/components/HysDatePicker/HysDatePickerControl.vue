<script setup lang="ts">
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
import { CalendarDays, X, Clock3 } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysDatePickerPanel from "./HysDatePickerPanel.vue";
import { useHysRootAttrs } from "../../config";
import {
  fieldKey,
  useHysControlState,
  useHysFormItemContext,
  type HysFieldContext,
} from "../../composables/formContext";
import { useFloating } from "../../composables/useFloating";
import { useChoiceNativeReset } from "../../composables/choiceModel";
import { useDatePicker } from "../../composables/useDatePicker";
import { calendarISO, calendarParts } from "../../composables/calendar";
import {
  dateNative,
  datePickerDefaults,
  type HysDatePickerProps,
  type HysDatePickerValue,
  type HysDatePickerSlots,
  type HysDatePickerView,
  type HysDatePickerChange,
  type HysDatePoint,
} from "../../composables/datePicker";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<HysDatePickerProps & { range?: boolean }>(),
  datePickerDefaults,
);
const slots = defineSlots<HysDatePickerSlots>();
const navigationSlots = computed(() =>
  (["prev-month", "next-month", "prev-year", "next-year"] as const).filter(
    (name) => !!slots[name],
  ),
);
const emit = defineEmits([
  "update:modelValue",
  "change",
  "value-change",
  "update:open",
  "visible-change",
  "update:panelValue",
  "update:mode",
  "panelChange",
  "calendarChange",
  "clear",
  "ok",
  "invalid",
  "focus",
  "blur",
]);
const attrs = useAttrs(),
  skin = useHysRootAttrs(),
  field = useHysFormItemContext(),
  control = useHysControlState({
    get disabled() {
      return typeof props.disabled === "boolean"
        ? props.disabled
        : !!props.disabled?.every(Boolean);
    },
    get size() {
      return props.size;
    },
  }),
  root = ref<HTMLElement>(),
  button = ref<HTMLButtonElement>(),
  panel = ref<HTMLElement>(),
  editors = new Map<number, HTMLInputElement>(),
  live = ref(true),
  range = computed(() => !!props.range),
  blocked = computed(
    () => !live.value || control.disabled.value || !!props.readonly,
  ),
  id = useId(),
  focused = ref(false),
  inputText = ref<string[]>([]);
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
const store = useDatePicker(
  props,
  range,
  blocked,
  (name, ...args) =>
    (emit as (name: string, ...args: any[]) => void)(name, ...args),
  () => {
    if (props.validateEvent) void field.validate("change");
  },
);
const {
  draft,
  words,
  current,
  selected,
  view,
  panels,
  error,
  time,
  needsConfirm,
} = store;
store.begin();
const active = computed(
    () => live.value && (props.inline || floating.open.value),
  ),
  anchor = computed(() =>
    root.value
      ? {
          getBoundingClientRect: () => root.value!.getBoundingClientRect(),
          contains: (node: Node | null) => root.value!.contains(node),
          focus: focusTrigger,
          get isConnected() {
            return !!root.value?.isConnected;
          },
        }
      : undefined,
  );
let restoreRequested = false,
  epoch = 0;
const floating = useFloating(anchor, panel, {
  get placement() {
    return props.placement;
  },
  width: () => props.popupWidth,
  requestOpen: (value, restore) => {
    if (!value) restoreRequested = !!restore;
    emit("update:open", value);
    return props.open === undefined ? undefined : false;
  },
});
const visible = computed(() => props.inline || floating.open.value),
  placeholder = computed(
    () =>
      props.placeholder ||
      (range.value
        ? `${props.startPlaceholder ?? words.value.start}${props.rangeSeparator}${props.endPlaceholder ?? words.value.end}`
        : words.value.empty),
  ),
  display = computed(() => {
    const values = store.describe();
    if (!range.value) return values.filter(Boolean).join("、");
    if (!values.some(Boolean)) return "";
    return [
      values[0] || props.startPlaceholder || words.value.start,
      values[1] || props.endPlaceholder || words.value.end,
    ].join(props.rangeSeparator);
  }),
  canConfirm = computed(() => store.valid(draft.value)),
  draftWarning = computed(() =>
    needsConfirm.value &&
    (range.value ? draft.value.every(Boolean) : !!draft.value.length) &&
    !canConfirm.value
      ? words.value.invalid
      : "",
  ),
  problem = computed(() => error.value || draftWarning.value),
  canClear = computed(
    () =>
      props.clearable &&
      !blocked.value &&
      selected.value.some((p, i) => p && !store.locked(i)),
  ),
  fieldId = computed(() => String(attrs.id ?? field.id.value ?? id)),
  ariaLabel = computed(
    () =>
      props.ariaLabel || props.label || field.label.value || placeholder.value,
  ),
  state = computed(
    () =>
      props.status ??
      (field.error.value || error.value ? "error" : field.status.value),
  ),
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
          width:
            props.popupWidth ??
            (range.value && !props.singlePanel ? "576px" : "304px"),
          maxWidth: "calc(100vw - 20px)",
          maxHeight: "min(80dvh,calc(100dvh - 20px))",
        },
  ),
  panelCount = computed(() => (range.value && !props.singlePanel ? 2 : 1)),
  views = new Map<
    number,
    { focus: () => Promise<void>; element?: HTMLElement }
  >();
const dates = computed(() =>
    draft.value.map((p) => (p ? dateNative(p) : null)),
  ),
  rangePreview = computed(() =>
    range.value && store.stage.value === "end"
      ? store.preview.value
      : undefined,
  ),
  ownAttrs = () =>
    Object.fromEntries(
      Object.entries(attrs).filter(
        ([key]) => key !== "id" && !key.startsWith("aria-"),
      ),
    ),
  inputAttrs = () =>
    Object.fromEntries(
      Object.entries(attrs).filter(([key]) => key.startsWith("aria-")),
    );
function bindEditor(index: number, el: unknown) {
  if (el instanceof HTMLInputElement) editors.set(index, el);
  else editors.delete(index);
}
function syncText() {
  inputText.value = store.describe();
  if (range.value) while (inputText.value.length < 2) inputText.value.push("");
}
function focusTrigger() {
  if (!control.disabled.value)
    (!props.inline && props.editable && !store.multiple.value
      ? editors.get(0)
      : (button.value ?? root.value)
    )?.focus();
}
async function focusPanel() {
  await nextTick();
  await views.get(0)?.focus();
}
async function show(focus = true, force = false) {
  if (blocked.value) return false;
  const ticket = epoch,
    was = floating.open.value;
  if (!props.inline) await floating.show(force);
  await nextTick();
  if (!active.value || ticket !== epoch) return false;
  if (!was) {
    store.begin();
    syncText();
  }
  await nextTick();
  floating.update();
  if (focus) await focusPanel();
  return active.value;
}
function hide(restore = false) {
  if (!props.inline) floating.close(restore);
}
function cancel() {
  store.begin();
  syncText();
  hide(true);
}
async function clear() {
  const accepted = await store.clear();
  if (accepted) {
    syncText();
    hide(true);
  }
  return accepted;
}
async function confirm() {
  const accepted = await store.confirm();
  if (accepted) {
    syncText();
    hide(true);
  }
  return accepted;
}
async function pick(day: number) {
  const ticket = epoch,
    accepted = await store.choose(day);
  if (!live.value || ticket !== epoch) return;
  if (
    accepted &&
    !needsConfirm.value &&
    !store.multiple.value &&
    !props.inline
  ) {
    syncText();
    hide(true);
  }
}
async function shortcut(index: number) {
  if (!store.pickShortcut(index)) return;
  if (!needsConfirm.value) {
    const accepted = await store.request(store.encode(draft.value), "shortcut");
    if (accepted) {
      syncText();
      hide(true);
    }
  } else {
    const day = draft.value.find(Boolean)?.day;
    if (day !== undefined) store.setPanel(day);
  }
}
async function commitInput(index: number) {
  if (props.inputReadonly || blocked.value) return false;
  const accepted = await store.input(inputText.value[index] ?? "", index);
  if (accepted) syncText();
  return accepted;
}
function triggerKey(event: KeyboardEvent, index = 0) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === "ArrowDown" && !event.altKey) {
    event.preventDefault();
    void show();
  } else if (event.key === "Enter" && props.editable) {
    event.preventDefault();
    void commitInput(index);
  } else if (event.key === "Escape") {
    cancel();
  }
}
function focus(event: FocusEvent) {
  if (!focused.value) {
    focused.value = true;
    emit("focus", event);
  }
  if (
    props.showOnFocus &&
    !floating.restoringFocus.value &&
    !floating.open.value
  )
    void show(false);
}
async function blur(event: FocusEvent) {
  await nextTick();
  if (
    !live.value ||
    floating.open.value ||
    root.value?.contains(document.activeElement) ||
    panel.value?.contains(document.activeElement)
  )
    return;
  if (focused.value) {
    focused.value = false;
    emit("blur", event);
    if (props.validateEvent) void field.validate("blur");
  }
}
function inputBlur(event: FocusEvent, index: number) {
  const next = event.relatedTarget as Node | null;
  if (!panel.value?.contains(next) && !root.value?.contains(next))
    void commitInput(index);
  void blur(event);
}
function move(day: number, index: number) {
  if (!blocked.value) store.setPanel(day, index);
}
async function showMonth(value: unknown) {
  const point = store.boundary(value);
  if (!point) return false;
  if (!(await show(false))) return false;
  const ok = store.setPanel(point.day);
  await nextTick();
  floating.update();
  return ok;
}
async function setValue(value: HysDatePickerValue) {
  const ok = await store.setValue(value);
  if (ok) {
    store.begin();
    syncText();
  }
  return ok;
}
function today(now = false) {
  const point = store.today.value;
  if (now && time.value) {
    draft.value = [{ ...point }];
    if (range.value) return;
    void confirm();
  } else void pick(point.day);
}
function activateEndpoint(index: number) {
  if (!store.locked(index)) store.stage.value = index ? "end" : "start";
}
function clearEndpoint(index: number) {
  if (!props.allowEmpty?.[index] || store.locked(index) || blocked.value)
    return;
  draft.value = draft.value.map((p, i) => (i === index ? null : p));
  store.error.value = "";
}
function timeOptions(index: number, part: "hour" | "minute" | "second") {
  const point = draft.value[index];
  if (!point) return [];
  const hour = Math.floor(point.second / 3600),
    minute = Math.floor(point.second / 60) % 60,
    config = store.timeDisabled(point, index),
    step =
      part === "hour"
        ? props.hourStep
        : part === "minute"
          ? props.minuteStep
          : props.secondStep,
    max = part === "hour" ? 24 : 60,
    n = Math.max(
      1,
      Math.min(max, Number.isFinite(step) ? Math.floor(step!) : 1),
    ),
    current =
      part === "hour" ? hour : part === "minute" ? minute : point.second % 60;
  return Array.from({ length: max }, (_, value) => value)
    .filter((value) => value % n === 0 || value === current)
    .map((value) => ({
      label: String(value).padStart(2, "0"),
      value,
      disabled:
        part === "hour"
          ? config.hours?.includes(value)
          : part === "minute"
            ? config.minutes?.(hour).includes(value)
            : config.seconds?.(hour, minute).includes(value),
    }));
}
function timeValue(index: number, part: number) {
  const second = draft.value[index]?.second ?? 0;
  return part === 0
    ? Math.floor(second / 3600)
    : part === 1
      ? Math.floor(second / 60) % 60
      : second % 60;
}
function setTime(index: number, part: number, value: unknown) {
  if (typeof value !== "number") return;
  const old = draft.value[index]?.second ?? 0,
    second =
      part === 0
        ? value * 3600 + (old % 3600)
        : part === 1
          ? Math.floor(old / 3600) * 3600 + value * 60 + (old % 60)
          : Math.floor(old / 60) * 60 + value;
  if (store.setTime(index, second) && !needsConfirm.value)
    void store.request(store.encode(draft.value), "time");
}
function nativeValue(value: unknown) {
  return value instanceof Date
    ? value.toISOString()
    : value == null
      ? ""
      : String(value);
}
const nativeValues = computed(() => {
  const value = current.value;
  return (Array.isArray(value) ? value : [value])
    .map((value, index) => ({
      value: nativeValue(value),
      name: Array.isArray(props.name) ? props.name[index] : props.name,
    }))
    .filter((item) => !!item.name);
});
watch(
  () => props.open,
  (value) => {
    if (!live.value || props.inline) return;
    if (value) void show(false, true);
    else {
      const restore = restoreRequested;
      restoreRequested = false;
      floating.close(restore, true);
    }
  },
);
watch(floating.open, (value) => {
  emit("visible-change", value);
  if (!value) {
    epoch++;
    store.begin();
    syncText();
  }
});
watch(blocked, (value) => {
  if (value) {
    epoch++;
    store.model.invalidate();
    floating.close(false, true);
    if (props.open) emit("update:open", false);
  }
});
watch(
  current,
  () => {
    store.begin();
    syncText();
  },
  { deep: true },
);
watch(
  [panels, view, () => props.singlePanel, () => props.popupWidth],
  () => void nextTick(() => floating.update()),
);
useChoiceNativeReset(
  root,
  () => {
    store.model.reset();
    store.begin();
    syncText();
    hide();
  },
  syncText,
  () => props.form,
);
syncText();
onMounted(() => {
  if (props.open ?? props.defaultOpen) void show(false, true);
  if (props.autofocus) focusTrigger();
});
onUpdated(() => {
  if (!props.editable && field.id.value && button.value)
    button.value.id = fieldId.value;
});
onActivated(() => {
  live.value = true;
  if (props.open && !props.inline) void show(false, true);
});
function cleanup() {
  live.value = false;
  epoch++;
  focused.value = false;
  floating.close(false, true);
  store.error.value = "";
}
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  element: root,
  open: active,
  value: current,
  draft: dates,
  focus: focusTrigger,
  blur: () => {
    hide();
    if (
      root.value?.contains(document.activeElement) ||
      panel.value?.contains(document.activeElement)
    )
      (document.activeElement as HTMLElement)?.blur();
  },
  show: () => show(),
  hide,
  handleOpen: () => show(),
  handleClose: hide,
  clear,
  setValue,
  confirm,
  cancel,
  showMonth,
  setMode: (mode: HysDatePickerView) => !blocked.value && store.setMode(mode),
});
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...skin, ...ownAttrs() }"
    class="hys-ui-pf-date-picker hys-ui-date-picker"
    :class="[
      'hys-ui-date-picker-' + control.size.value,
      {
        'hys-ui-date-picker-disabled': control.disabled.value,
        'hys-ui-date-picker-readonly': readonly,
        'hys-ui-date-picker-borderless': !bordered,
      },
    ]"
    :data-status="state"
    :id="inline ? fieldId : undefined"
    :role="inline ? 'group' : undefined"
    :data-hys-ui-field-managed="inline ? '' : undefined"
    :tabindex="inline ? (control.disabled.value ? -1 : 0) : undefined"
    :aria-label="inline ? ariaLabel : undefined"
    :aria-required="(inline && field.required.value) || undefined"
    :aria-invalid="(inline && state === 'error') || undefined"
    :aria-disabled="(inline && control.disabled.value) || undefined"
    :aria-describedby="inline ? field.describedBy.value : undefined"
    @focus.self="inline && focusPanel()"
    @keydown="inline && $event.target === root && triggerKey($event)"
    @focusin="focus"
    @focusout="blur"
  >
    <template v-if="!inline">
      <div
        class="hys-ui-date-control"
        :class="{
          'hys-ui-date-control-open': floating.open.value,
          'hys-ui-date-control-editable': editable && !store.multiple.value,
        }"
      >
        <template v-if="editable && !store.multiple.value"
          ><span v-if="$slots.prefix" class="hys-ui-date-prefix"
            ><slot name="prefix" /></span
          ><template v-for="index in range ? 2 : 1" :key="index"
            ><span v-if="index === 2" class="hys-ui-date-separator"
              ><slot name="range-separator">{{ rangeSeparator }}</slot></span
            ><input
              :ref="(el) => bindEditor(index - 1, el)"
              v-bind="inputAttrs()"
              :id="index === 1 ? fieldId : fieldId + '-end'"
              data-hys-ui-field-managed
              class="hys-ui-date-input"
              type="text"
              autocomplete="off"
              :value="inputText[index - 1] ?? ''"
              :aria-label="
                range
                  ? ariaLabel + ' ' + (index === 1 ? words.start : words.end)
                  : ariaLabel
              "
              aria-haspopup="dialog"
              :aria-expanded="floating.open.value"
              :aria-controls="floating.open.value ? id + '-panel' : undefined"
              :aria-invalid="state === 'error' || undefined"
              :aria-required="field.required.value || undefined"
              :aria-describedby="
                [field.describedBy.value, error ? id + '-error' : undefined]
                  .filter(Boolean)
                  .join(' ') || undefined
              "
              :disabled="control.disabled.value || store.locked(index - 1)"
              :readonly="readonly || inputReadonly"
              :placeholder="
                range
                  ? index === 1
                    ? (startPlaceholder ?? words.start)
                    : (endPlaceholder ?? words.end)
                  : placeholder
              "
              @input="
                inputText[index - 1] = ($event.target as HTMLInputElement).value
              "
              @click="show(false)"
              @keydown="triggerKey($event, index - 1)"
              @blur="inputBlur($event, index - 1)" /></template
        ></template>
        <button
          v-else
          ref="button"
          v-bind="inputAttrs()"
          :id="fieldId"
          type="button"
          data-hys-ui-field-managed
          role="combobox"
          class="hys-ui-date-trigger"
          :disabled="control.disabled.value"
          :aria-label="ariaLabel"
          aria-haspopup="dialog"
          :aria-expanded="floating.open.value"
          :aria-controls="floating.open.value ? id + '-panel' : undefined"
          :aria-invalid="state === 'error' || undefined"
          :aria-required="field.required.value || undefined"
          :aria-disabled="control.disabled.value || undefined"
          :aria-describedby="
            [field.describedBy.value, error ? id + '-error' : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          "
          :aria-readonly="readonly || undefined"
          @click="floating.open.value ? hide() : show()"
          @keydown="triggerKey"
        >
          <span v-if="$slots.prefix" class="hys-ui-date-prefix"
            ><slot name="prefix" /></span
          ><span
            class="hys-ui-date-display"
            :class="{ 'hys-ui-pf-placeholder': !display }"
            >{{ display || placeholder }}</span
          >
        </button>
        <span class="hys-ui-date-icons"
          ><button
            v-if="canClear"
            type="button"
            class="hys-ui-date-clear"
            :aria-label="words.clear"
            @mousedown.prevent
            @click="clear"
          >
            <slot name="clear-icon"><X :size="14" /></slot></button
          ><span class="hys-ui-date-suffix" aria-hidden="true"
            ><slot name="suffix"
              ><component
                :is="time ? Clock3 : CalendarDays"
                :size="16" /></slot></span
        ></span>
      </div>
    </template>
    <input
      v-for="(item, index) in nativeValues"
      :key="index"
      type="hidden"
      :name="item.name"
      :value="item.value"
      :form="form"
      :disabled="control.disabled.value"
    />
    <p
      v-if="error && !visible"
      :id="id + '-error'"
      class="hys-ui-date-error"
      role="alert"
    >
      {{ error }}
    </p>
    <Teleport :to="appendTo || 'body'" :disabled="inline || appendTo === false"
      ><div
        v-if="visible"
        :id="id + '-panel'"
        ref="panel"
        v-bind="skin"
        class="hys-ui-date-popup"
        :class="[
          popupClass,
          'hys-ui-date-popup-' + control.size.value,
          {
            'hys-ui-date-inline': inline,
            'hys-ui-date-dual': panelCount === 2,
          },
        ]"
        :style="panelStyle"
        :role="inline ? 'group' : 'dialog'"
        :aria-label="ariaLabel"
        @focusin="focus"
        @focusout="blur"
      >
        <header v-if="$slots.header" class="hys-ui-date-popup-header">
          <slot name="header" :dates="dates" :view="view" />
        </header>
        <div v-if="shortcuts?.length" class="hys-ui-date-shortcuts">
          <button
            v-for="(entry, index) in shortcuts"
            :key="index"
            type="button"
            :disabled="blocked || entry.disabled"
            @click="shortcut(index)"
          >
            <slot name="shortcut" :shortcut="entry" :index="index">{{
              entry.label
            }}</slot>
          </button>
        </div>
        <div v-if="range" class="hys-ui-date-range-status">
          <button
            v-for="(name, index) in [words.start, words.end]"
            :key="index"
            type="button"
            :disabled="blocked || store.locked(index)"
            :aria-pressed="store.stage.value === (index ? 'end' : 'start')"
            @click="activateEndpoint(index)"
          >
            <span>{{ name }}</span
            ><strong>{{ store.describe(draft)[index] || "—" }}</strong></button
          ><span class="hys-ui-date-range-instruction" role="status">{{
            store.stage.value === "end" ? words.chooseEnd : words.chooseStart
          }}</span>
        </div>
        <div class="hys-ui-date-panels">
          <HysDatePickerPanel
            v-for="index in panelCount"
            :key="index"
            :ref="
              (value) => {
                if (value) views.set(index - 1, value as any);
                else views.delete(index - 1);
              }
            "
            :month="panels[index - 1]"
            :view="index === 1 ? view : store.rightView.value"
            :unit="store.unit.value"
            :selected="draft"
            :range="range"
            :preview="rangePreview"
            :first="store.first.value"
            :locale="locale"
            :words="words"
            :week-numbers="!!showWeekNumbers || store.unit.value === 'week'"
            :adjacent="showAdjacentDays"
            :disabled="blocked"
            :available="
              (day) =>
                store.available(
                  day,
                  range && store.stage.value === 'end' ? 1 : 0,
                )
            "
            :period-available="store.periodAvailable"
            :cell-class-name="cellClassName"
            @browse="move($event, index - 1)"
            @mode="store.setMode($event, index - 1)"
            @pick="pick"
            @preview="store.preview.value = $event"
            ><template #cell="cell"
              ><slot name="cell" v-bind="cell"
                ><slot v-bind="cell">{{ cell.text }}</slot></slot
              ></template
            ><template v-for="name in navigationSlots" #[name]
              ><slot :name="name" /></template
          ></HysDatePickerPanel>
        </div>
        <div
          v-if="time"
          class="hys-ui-date-time-area"
          data-hys-ui-form-internal
        >
          <div
            v-for="index in range ? 2 : 1"
            :key="index"
            class="hys-ui-date-time-row"
          >
            <span
              >{{ range ? (index === 1 ? words.start : words.end) : ""
              }}<Clock3 v-if="!range" :size="14" /></span
            ><template v-for="part in showSeconds ? 3 : 2" :key="part"
              ><span v-if="part > 1" class="hys-ui-date-time-colon">:</span
              ><HysSelect
                :model-value="timeValue(index - 1, part - 1)"
                :options="
                  timeOptions(
                    index - 1,
                    part === 1 ? 'hour' : part === 2 ? 'minute' : 'second',
                  )
                "
                :disabled="
                  blocked || store.locked(index - 1) || !draft[index - 1]
                "
                :size="control.size.value"
                :aria-label="
                  (range ? (index === 1 ? words.start : words.end) + ' ' : '') +
                  (part === 1
                    ? words.hour
                    : part === 2
                      ? words.minute
                      : words.second)
                "
                :popup-match-width="false"
                @update:model-value="setTime(index - 1, part - 1, $event)"
            /></template>
          </div>
        </div>
        <div
          v-if="range && allowEmpty?.some(Boolean)"
          class="hys-ui-date-partial"
        >
          <button
            v-for="index in 2"
            v-show="allowEmpty?.[index - 1]"
            :key="index"
            type="button"
            :disabled="blocked || store.locked(index - 1)"
            @click="clearEndpoint(index - 1)"
          >
            {{ words.clear }} {{ index === 1 ? words.start : words.end }}
          </button>
        </div>
        <p
          v-if="problem"
          :id="id + '-error'"
          class="hys-ui-date-error hys-ui-date-popup-error"
          role="alert"
        >
          {{ problem }}
        </p>
        <footer
          v-if="$slots.footer || showFooter || needsConfirm"
          class="hys-ui-date-footer"
        >
          <slot
            name="footer"
            :dates="dates"
            :confirm="confirm"
            :cancel="cancel"
            :clear="clear"
            ><div class="hys-ui-date-footer-shortcuts">
              <HysButton
                v-if="showToday && !range"
                size="sm"
                variant="ghost"
                :disabled="blocked || !store.available(store.today.value.day)"
                @click="today(false)"
                >{{ words.today }}</HysButton
              ><HysButton
                v-if="time && showNow && !range"
                size="sm"
                variant="ghost"
                :disabled="blocked"
                @click="today(true)"
                >{{ words.now }}</HysButton
              ><HysButton
                v-if="canClear"
                size="sm"
                variant="ghost"
                @click="clear"
                >{{ words.clear }}</HysButton
              >
            </div>
            <div class="hys-ui-date-footer-actions">
              <HysButton size="sm" variant="ghost" @click="cancel">{{
                needsConfirm || range ? words.cancel : words.close
              }}</HysButton
              ><HysButton
                v-if="needsConfirm"
                size="sm"
                :disabled="blocked || !canConfirm"
                @click="confirm"
                >{{ words.confirm }}</HysButton
              >
            </div></slot
          >
        </footer>
      </div></Teleport
    >
  </div>
</template>
<style scoped>
.hys-ui-date-picker {
  position: relative;
  min-width: 0;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font: inherit;
  line-height: 1.4;
  --hys-ui-date-height: 38px;
}
.hys-ui-date-picker-sm {
  --hys-ui-date-height: 30px;
  font-size: 12px;
}
.hys-ui-date-picker-lg {
  --hys-ui-date-height: 44px;
  font-size: 15px;
}
.hys-ui-date-control {
  display: flex;
  align-items: center;
  min-height: var(--hys-ui-date-height);
  box-sizing: border-box;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: var(--hys-ui-radius, 10px);
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  overflow: hidden;
}
.hys-ui-date-control:focus-within,
.hys-ui-date-control-open {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 3px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 12%,
      transparent
    );
}
.hys-ui-date-trigger {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  width: 100%;
  flex: 1;
  text-align: start;
  padding: 0 12px;
  min-height: calc(var(--hys-ui-date-height) - 2px);
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
  outline: none;
}
.hys-ui-date-display {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-date-icons {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-inline-end: 12px;
  flex-shrink: 0;
}
.hys-ui-date-suffix {
  display: flex;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  pointer-events: none;
}
.hys-ui-date-clear {
  border: 0;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  cursor: pointer;
}
.hys-ui-date-clear:hover {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-date-control-editable {
  padding-inline-start: 12px;
  gap: 8px;
}
.hys-ui-date-input {
  width: 0;
  min-width: 0;
  flex: 1;
  padding: 0;
  border: 0;
  outline: none !important;
  box-shadow: none !important;
  background: transparent;
  color: inherit;
  font: inherit;
  box-sizing: border-box;
  min-height: calc(var(--hys-ui-date-height) - 2px);
}
.hys-ui-date-input::placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-separator {
  font-size: 12px;
  white-space: nowrap;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-picker-disabled {
  opacity: 0.55;
}
.hys-ui-date-picker-disabled .hys-ui-date-trigger {
  cursor: not-allowed;
}
.hys-ui-date-picker-readonly .hys-ui-date-trigger {
  cursor: default;
}
.hys-ui-date-picker-borderless .hys-ui-date-control {
  border-color: transparent;
  background: transparent;
}
.hys-ui-date-picker[data-status="error"] .hys-ui-date-control {
  border-color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #ef4444));
}
.hys-ui-date-picker[data-status="warning"] .hys-ui-date-control {
  border-color: var(--hys-ui-warning, var(--hys-ui-theme-warning, #f59e0b));
}
.hys-ui-date-error {
  font-size: 12px;
  margin: 5px 0 0;
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger, #ef4444));
}
.hys-ui-date-popup-error {
  padding: 4px 12px 8px;
  margin: 0;
}
.hys-ui-date-popup {
  box-sizing: border-box;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 12px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: 0 16px 48px #0b1b3726;
  overflow: auto;
  font-family: var(--hys-ui-font-family, inherit);
  font-size: 13px;
  overscroll-behavior: contain;
}
.hys-ui-date-panels {
  display: flex;
  overflow: auto;
  min-width: 0;
}
.hys-ui-date-popup-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-date-shortcuts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-date-shortcuts button,
.hys-ui-date-partial button {
  border: 0;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font: inherit;
  font-size: 12px;
  border-radius: 6px;
  padding: 5px 9px;
  cursor: pointer;
}
.hys-ui-date-shortcuts button:disabled,
.hys-ui-date-partial button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-date-range-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px 12px 0;
}
.hys-ui-date-range-status > button {
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: inherit;
  font: inherit;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  align-items: start;
  cursor: pointer;
}
.hys-ui-date-range-status > button[aria-pressed="true"] {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-date-range-status > button span {
  font-size: 10px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-range-status > button strong {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  font-weight: 500;
}
.hys-ui-date-range-instruction {
  grid-column: 1/-1;
  text-align: center;
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-time-area {
  padding: 8px 12px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  display: grid;
  gap: 8px;
}
.hys-ui-date-time-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.hys-ui-date-time-row > span:first-child {
  flex-shrink: 0;
  font-size: 11px;
  margin-inline-end: auto;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  display: flex;
  gap: 4px;
}
.hys-ui-date-time-row > :deep(.hys-ui-select) {
  flex: 1;
  min-width: 0;
  max-width: 74px;
}
.hys-ui-date-time-row > :deep(.hys-ui-select .hys-ui-select-control) {
  padding-inline: 6px;
}
.hys-ui-date-time-colon {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-partial {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
}
.hys-ui-date-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-date-footer-shortcuts,
.hys-ui-date-footer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.hys-ui-date-popup-sm :deep(.hys-ui-date-cells button) {
  height: 28px;
  font-size: 11px;
}
.hys-ui-date-popup-lg :deep(.hys-ui-date-cells button) {
  height: 36px;
  font-size: 13px;
}
.hys-ui-date-inline {
  box-shadow: none;
}
.hys-ui-date-popup button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
@media (max-width: 650px) {
  .hys-ui-date-dual .hys-ui-date-panel {
    flex-basis: 270px;
  }
  .hys-ui-date-control-editable {
    padding-inline-start: 8px;
    gap: 4px;
  }
  .hys-ui-date-icons {
    margin-inline-end: 8px;
    gap: 2px;
  }
  .hys-ui-date-footer {
    flex-wrap: wrap;
  }
}
</style>
