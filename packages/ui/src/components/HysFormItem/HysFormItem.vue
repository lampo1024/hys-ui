<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  provide,
  ref,
  useId,
  useSlots,
  watch,
} from "vue";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  CircleHelp,
} from "lucide-vue-next";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import {
  resolveFormCol,
  resolveFormGrid,
  type HysFormCol,
  type HysFormGridValue,
} from "../../composables/formLayout";
import {
  formKey,
  fieldKey,
  formPath,
  formValue,
  focusHysField,
  type HysFormField,
  type HysFormPath,
  type HysFormRule,
  type HysFormStatus,
  type HysFormTrigger,
} from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import { sameFormValue, snapshotForm } from "../../composables/formValidation";
const props = withDefaults(
  defineProps<{
    label?: string;
    prop?: HysFormPath;
    rules?: HysFormRule | HysFormRule[];
    dependencies?: HysFormPath[];
    error?: string;
    warning?: string;
    status?: HysFormStatus;
    required?: boolean;
    showRequiredMark?: boolean;
    requiredMarkPosition?: "left" | "right";
    hint?: string;
    for?: string;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    labelPosition?: "top" | "left" | "right";
    labelWidth?: string | number;
    labelAlign?: "left" | "right";
    labelWrap?: boolean;
    labelSuffix?: string;
    colon?: boolean;
    labelCol?: HysFormCol;
    wrapperCol?: HysFormCol;
    span?: HysFormGridValue;
    optionalMark?: string;
    tooltip?: string;
    help?: string;
    extra?: string;
    showLabel?: boolean;
    showFeedback?: boolean;
    feedbackIcon?: boolean;
    inlineFeedback?: boolean;
    validateFirst?: boolean;
    preserve?: boolean;
    autoLink?: boolean;
    group?: boolean;
    noStyle?: boolean;
    validateTrigger?: HysFormTrigger | HysFormTrigger[];
  }>(),
  {
    required: undefined,
    showLabel: undefined,
    showFeedback: undefined,
    showRequiredMark: undefined,
    labelWrap: undefined,
    colon: undefined,
    feedbackIcon: undefined,
    inlineFeedback: undefined,
    validateFirst: undefined,
    preserve: undefined,
    group: undefined,
    autoLink: true,
  },
);
const hysRootAttrs = useHysRootAttrs(),
  form = inject(formKey, undefined),
  root = ref<HTMLElement>(),
  control = ref<HTMLElement>(),
  id = useId(),
  controlId = ref(props.for || id),
  errorId = id + "-error",
  hintId = id + "-hint",
  warningId = id + "-warning",
  slots = useSlots();
const grouped = ref(!!props.group);
const path = computed(() =>
    props.prop === undefined ? "" : formPath(props.prop),
  ),
  localRules = computed(() => [props.rules ?? []].flat()),
  label = computed(() => props.label);
const error = computed(() =>
  props.error !== undefined
    ? props.error
    : path.value
      ? form?.errors.value[path.value]
      : undefined,
);
const warning = computed(() =>
  props.warning !== undefined
    ? props.warning
    : path.value
      ? form?.warnings.value[path.value]
      : undefined,
);
const errorList = computed(() =>
  props.error !== undefined
    ? props.error
      ? [props.error]
      : []
    : (form?.errorMessages.value[path.value] ??
      (error.value ? [error.value] : [])),
);
const warningList = computed(() =>
  props.warning !== undefined
    ? props.warning
      ? [props.warning]
      : []
    : (form?.warningMessages.value[path.value] ??
      (warning.value ? [warning.value] : [])),
);
const state = computed(() =>
  path.value ? form?.states.value[path.value] : undefined,
);
const status = computed(
  () =>
    props.status ??
    (error.value
      ? "error"
      : warning.value
        ? "warning"
        : (state.value?.status ?? "idle")),
);
const invalid = computed(() => !!error.value || status.value === "error");
const required = computed(
  () =>
    props.required ??
    [
      ...(path.value ? (form?.getRules(path.value) ?? []) : []),
      ...localRules.value,
    ].some((rule) => rule.required),
);
const disabled = computed(() => !!(props.disabled || form?.disabled.value)),
  size = computed(() => props.size ?? form?.size.value ?? "md");
const showLabel = computed(
  () =>
    !props.noStyle &&
    (props.showLabel ?? form?.showLabel.value ?? true) &&
    (!!props.label || !!slots.label),
);
const showFeedback = computed(
  () => props.showFeedback ?? form?.showFeedback.value ?? true,
);
const showRequiredMark = computed(
  () => props.showRequiredMark ?? form?.showRequiredMark.value ?? true,
);
const markPosition = computed(
  () =>
    props.requiredMarkPosition ?? form?.requiredMarkPosition.value ?? "right",
);
const labelPosition = computed(
  () => props.labelPosition ?? form?.labelPosition.value ?? "top",
);
const labelWidthSetting = computed(() =>
  typeof props.labelWidth === "number"
    ? props.labelWidth + "px"
    : (props.labelWidth ?? form?.labelWidth.value ?? "100px"),
);
const labelWidth = computed(() =>
  labelWidthSetting.value === "auto"
    ? (form?.autoLabelWidth.value ?? "auto")
    : labelWidthSetting.value,
);
const labelAlign = computed(
  () =>
    props.labelAlign ??
    (props.labelPosition
      ? props.labelPosition === "right"
        ? "right"
        : "left"
      : (form?.labelAlign.value ??
        (labelPosition.value === "right" ? "right" : "left"))),
);
const labelWrap = computed(
    () => props.labelWrap ?? form?.labelWrap.value ?? true,
  ),
  labelSuffix = computed(
    () => props.labelSuffix ?? form?.labelSuffix.value ?? "",
  ),
  colon = computed(() => props.colon ?? form?.colon.value ?? false);
const inlineFeedback = computed(
    () => props.inlineFeedback ?? form?.inlineFeedback.value ?? false,
  ),
  feedbackIcon = computed(
    () => props.feedbackIcon ?? form?.feedbackIcon.value ?? false,
  ),
  optionalMark = computed(
    () => props.optionalMark ?? form?.optionalMark.value ?? "",
  );
const labelContent = ref<HTMLElement>(),
  width = computed(() => form?.containerWidth.value ?? 0);
const cols = computed(() => ({
  label: resolveFormCol(props.labelCol ?? form?.labelCol.value, width.value),
  wrapper: resolveFormCol(
    props.wrapperCol ?? form?.wrapperCol.value,
    width.value,
  ),
}));
const gridStyle = computed(() => {
  const col = cols.value.label,
    span = Math.min(
      form?.columns.value ?? 24,
      resolveFormGrid(props.span, width.value),
    ),
    hasCols =
      showLabel.value &&
      labelPosition.value !== "top" &&
      (col || cols.value.wrapper);
  return {
    "--hys-ui-form-label-width": labelWidth.value,
    gridColumn: form ? "span " + span : undefined,
    gridTemplateColumns: hasCols ? "repeat(24,minmax(0,1fr))" : undefined,
    columnGap: hasCols ? "0px" : undefined,
  };
});
const labelStyle = computed(() => {
  const col = cols.value.label;
  return col && labelPosition.value !== "top"
    ? {
        gridColumn:
          1 + (col.offset ?? 0) + " / span " + Math.max(1, col.span ?? 0),
        display: col.span === 0 ? "none" : undefined,
      }
    : undefined;
});
const bodyStyle = computed(() => {
  if (!showLabel.value) return undefined;
  const col = cols.value.wrapper,
    label = cols.value.label,
    offset = Math.min(
      23,
      (label?.span ?? 0) + (label?.offset ?? 0) + (col?.offset ?? 0),
    );
  return labelPosition.value !== "top" && (col || label)
    ? {
        gridColumn:
          1 +
          offset +
          " / span " +
          Math.max(1, Math.min(col?.span ?? 24, 24 - offset)),
        paddingInlineStart: "14px",
        boxSizing: "border-box" as const,
      }
    : undefined;
});
const trigger = computed<HysFormTrigger | HysFormTrigger[]>(
  () =>
    props.validateTrigger ?? form?.validateTrigger.value ?? ["change", "blur"],
);
const hasFeedback = computed(
  () =>
    props.help !== undefined ||
    !!(error.value || warning.value || slots.help || slots.feedback),
);
const feedbackId = computed(() =>
  invalid.value ? errorId : warning.value ? warningId : id + "-feedback",
);
const describedBy = computed(
  () =>
    [
      showFeedback.value && hasFeedback.value ? feedbackId.value : undefined,
      props.hint || slots.hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
);
provide(fieldKey, {
  id: computed(() => (props.autoLink ? controlId.value : "")),
  label,
  error,
  errorId,
  describedBy,
  required,
  invalid,
  status,
  disabled,
  size,
  validate,
});
async function validate(event?: HysFormTrigger) {
  if (form?.resetting.value || disabled.value || !path.value) return true;
  if (event === "blur" && form?.suppressAutoBlur?.value) return true;
  return (await form?.validateField(path.value, event)) ?? true;
}
function getControl() {
  return (
    (props.for ? document.getElementById(props.for) : null) ||
    control.value?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([hidden]),textarea,select,[role="combobox"],button[role="switch"],[role="radiogroup"],[role="slider"],[role="button"],[role="group"],[contenteditable][role="textbox"]',
    )
  );
}
function focus() {
  focusHysField(getControl());
}
function focusControl(event: MouseEvent) {
  const element = getControl();
  if (element && !element.matches("input,button,textarea,select")) {
    event.preventDefault();
    focus();
  }
}
function sync() {
  if (!props.autoLink) return;
  const candidates = [
    ...(control.value?.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([hidden]),textarea,select,[role="combobox"],button[role="switch"],[role="radiogroup"],[role="slider"],[role="button"],[contenteditable][role="textbox"]',
    ) ?? []),
  ].filter(
    (element) =>
      element.closest(".hys-ui-ent-field") === root.value &&
      (!element.closest('[role="radiogroup"]') ||
        element.matches('[role="radiogroup"]')),
  );
  const isGroup =
    props.group ??
    (candidates.length > 1 ||
      !!control.value?.querySelector(".hys-ui-ent-field"));
  if (grouped.value !== isGroup) {
    grouped.value = isGroup;
    controlId.value = isGroup ? "" : props.for || id;
  }
  if (isGroup) {
    if (controlId.value) controlId.value = "";
    return;
  }
  const element = getControl();
  if (!element) return;
  if (props.for) controlId.value = props.for;
  else if (!element.id) element.id = controlId.value;
  else controlId.value = element.id;
  if (element.hasAttribute("data-hys-ui-field-managed")) return;
  element.setAttribute("aria-invalid", String(invalid.value));
  if (required.value) element.setAttribute("aria-required", "true");
  else element.removeAttribute("aria-required");
  const descriptions = new Set(
    (element.getAttribute("aria-describedby") || "").split(" ").filter(Boolean),
  );
  descriptions.delete(errorId);
  descriptions.delete(hintId);
  descriptions.delete(warningId);
  descriptions.delete(id + "-feedback");
  describedBy.value?.split(" ").forEach((value) => descriptions.add(value));
  if (descriptions.size)
    element.setAttribute("aria-describedby", [...descriptions].join(" "));
  else element.removeAttribute("aria-describedby");
}
function blur(event: FocusEvent) {
  if ((event.target as HTMLElement).closest(".hys-ui-ent-field") !== root.value)
    return;
  const next = event.relatedTarget as Node | null;
  if (next && root.value?.contains(next)) return;
  if (next) {
    for (const element of root.value?.querySelectorAll<HTMLElement>(
      "[aria-controls]",
    ) || []) {
      const panel = document
        .getElementById(element.getAttribute("aria-controls") || "")
        ?.closest("[data-hys-ui]");
      if (panel?.contains(next)) return;
    }
  }
  void validate("blur");
}
const field: HysFormField = {
  path,
  element: root,
  rules: localRules,
  trigger,
  dependencies: computed(() => props.dependencies ?? []),
  label,
  validateFirst: computed(
    () => props.validateFirst ?? form?.validateFirst.value ?? true,
  ),
  preserve: computed(() => props.preserve ?? form?.preserve.value ?? true),
  validate,
  clearValidate: () => {
    if (path.value) form?.clearValidate([path.value]);
  },
  resetField: () => {
    if (path.value) form?.resetFields([path.value]);
  },
  setInitialValue: (value) => {
    if (path.value) form?.setFieldInitialValue(path.value, value);
  },
  focus,
};
let unregister: (() => void) | undefined;
let lastRules = snapshotForm(props.rules);
watch(
  path,
  (name) => {
    unregister?.();
    unregister = name ? form?.register(field) : undefined;
  },
  { immediate: true, flush: "sync" },
);
watch(
  () => [
    path.value,
    formValue(form?.model.value, path.value),
    ...(props.dependencies ?? []).map((dependency) =>
      formValue(form?.model.value, dependency),
    ),
  ],
  (next, previous) => {
    if (form?.model.value && !form.resetting.value && next[0] === previous?.[0])
      void validate("change");
  },
  { deep: true },
);
watch(
  () => props.rules,
  () => {
    if (sameFormValue(props.rules, lastRules)) return;
    lastRules = snapshotForm(props.rules);
    if (form && !form.resetting.value) {
      if (form.validateOnRuleChange.value) void validate();
      else if (path.value) form.cancelField(path.value);
    }
  },
  { deep: true },
);
watch(
  () => props.for,
  () => {
    controlId.value = props.for || id;
    void nextTick(sync);
  },
);
watch(disabled, (value) => {
  if (value) field.clearValidate();
});
let labelObserver: ResizeObserver | undefined,
  labelActive = true;
function measureLabel() {
  if (labelActive)
    form?.setLabelWidth(
      id,
      showLabel.value &&
        labelPosition.value !== "top" &&
        labelWidthSetting.value === "auto"
        ? Math.ceil(labelContent.value?.getBoundingClientRect().width ?? 0)
        : undefined,
    );
}
function stopLabel() {
  labelObserver?.disconnect();
  labelObserver = undefined;
  form?.setLabelWidth(id);
}
function observeLabel() {
  stopLabel();
  if (!labelActive || !root.value) return;
  measureLabel();
  if (typeof ResizeObserver !== "undefined" && labelContent.value) {
    labelObserver = new ResizeObserver(measureLabel);
    labelObserver.observe(labelContent.value);
  }
}
watch(
  [showLabel, labelPosition, labelWidthSetting, labelContent, size],
  () => void nextTick(observeLabel),
);
onMounted(() => {
  sync();
  observeLabel();
});
onUpdated(() => {
  sync();
  measureLabel();
});
onActivated(() => {
  labelActive = true;
  observeLabel();
});
onDeactivated(() => {
  labelActive = false;
  stopLabel();
});
onBeforeUnmount(() => {
  labelActive = false;
  stopLabel();
  unregister?.();
});
defineExpose({
  validate,
  clearValidate: field.clearValidate,
  resetField: field.resetField,
  setInitialValue: field.setInitialValue,
  focus,
  path,
  status,
  error,
  warning,
  size,
  validateMessage: error,
  validateState: status,
});
</script>
<template>
  <div
    ref="root"
    v-bind="hysRootAttrs"
    class="hys-ui-ent-field"
    :class="[
      'hys-ui-form-item-' + labelPosition,
      'hys-ui-form-item-' + size,
      'hys-ui-form-label-align-' + labelAlign,
      {
        'hys-ui-form-item-no-style': noStyle,
        'hys-ui-form-item-grid': showLabel && labelPosition !== 'top',
        'hys-ui-form-label-nowrap': !labelWrap,
        'hys-ui-form-label-auto': labelWidthSetting === 'auto',
      },
    ]"
    :style="gridStyle"
    :data-field-path="path || undefined"
    :data-validation-status="status"
    :aria-busy="status === 'validating' || undefined"
    @change="!form?.model.value && validate('change')"
    @focusout="blur"
  >
    <component
      :is="grouped ? 'div' : 'label'"
      v-if="showLabel"
      class="hys-ui-form-item-label"
      :id="id + '-label'"
      :for="autoLink && !grouped ? controlId : undefined"
      :style="labelStyle"
      @click="autoLink && !grouped && focusControl($event)"
      ><span ref="labelContent" class="hys-ui-form-label-content"
        ><span
          v-if="required && showRequiredMark && markPosition === 'left'"
          class="hys-ui-form-required"
          aria-hidden="true"
          >*</span
        ><span class="hys-ui-form-label-text"
          ><slot name="label" :required="required" :status="status">{{
            label
          }}</slot
          >{{ labelSuffix
          }}<span v-if="colon && labelPosition !== 'top'" aria-hidden="true"
            >:</span
          ></span
        ><span
          v-if="required && showRequiredMark && markPosition === 'right'"
          class="hys-ui-form-required"
          aria-hidden="true"
          >*</span
        ><span v-if="!required && optionalMark" class="hys-ui-form-optional">{{
          optionalMark
        }}</span
        ><HysTooltip v-if="tooltip || $slots.tooltip" :text="tooltip"
          ><CircleHelp :size="14" aria-label="字段说明" /><template
            v-if="$slots.tooltip"
            #content
            ><slot name="tooltip" /></template></HysTooltip></span
    ></component>
    <div
      class="hys-ui-form-item-body"
      :class="{ 'hys-ui-form-inline-feedback': inlineFeedback }"
      :style="bodyStyle"
      :role="grouped ? 'group' : undefined"
      :aria-labelledby="grouped && showLabel ? id + '-label' : undefined"
      :aria-describedby="grouped ? describedBy : undefined"
      :aria-invalid="grouped ? invalid : undefined"
    >
      <div
        ref="control"
        class="hys-ui-form-item-control"
        :class="{
          'hys-ui-ent-invalid': invalid,
          'hys-ui-form-item-warning': status === 'warning',
        }"
      >
        <slot
          :id="controlId"
          :invalid="invalid"
          :error="error"
          :warning="warning"
          :errors="errorList"
          :warnings="warningList"
          :status="status"
          :disabled="disabled"
          :size="size"
        /><span
          v-if="feedbackIcon && status !== 'idle'"
          class="hys-ui-form-feedback-icon"
          :class="'hys-ui-form-feedback-' + status"
          aria-hidden="true"
          ><LoaderCircle
            v-if="status === 'validating'"
            :size="15"
            class="hys-ui-icon-spin" /><CheckCircle2
            v-else-if="status === 'success'"
            :size="15" /><CircleAlert v-else :size="15"
        /></span>
      </div>
      <div
        v-if="showFeedback && hasFeedback"
        :id="feedbackId"
        :role="invalid ? 'alert' : warning ? 'status' : undefined"
        class="hys-ui-form-item-feedback"
        :class="{
          'hys-ui-ent-error': invalid,
          'hys-ui-form-warning': !invalid && status === 'warning',
        }"
      >
        <slot
          name="help"
          :error="error"
          :warning="warning"
          :errors="errorList"
          :warnings="warningList"
          :status="status"
          ><template v-if="help !== undefined">{{ help }}</template
          ><slot
            v-else
            name="feedback"
            :error="error"
            :warning="warning"
            :errors="errorList"
            :warnings="warningList"
            :status="status"
            ><small v-if="error" class="hys-ui-ent-error"
              ><slot name="error" :error="error" :errors="errorList"
                ><template v-for="(message, index) in errorList" :key="index"
                  ><br v-if="index" />{{ message }}</template
                ></slot
              ></small
            ><small v-else-if="warning" class="hys-ui-form-warning"
              ><slot name="warning" :warning="warning" :warnings="warningList"
                ><template v-for="(message, index) in warningList" :key="index"
                  ><br v-if="index" />{{ message }}</template
                ></slot
              ></small
            ></slot
          ></slot
        >
      </div>
      <small
        v-if="hint || $slots.hint"
        :id="hintId"
        class="hys-ui-form-item-hint"
        ><slot name="hint">{{ hint }}</slot></small
      >
      <div v-if="extra || $slots.extra" class="hys-ui-form-item-extra">
        <slot name="extra" :status="status">{{ extra }}</slot>
      </div>
    </div>
  </div>
</template>
<style scoped>
.hys-ui-ent-field {
  min-width: 0;
  gap: 7px;
}
.hys-ui-ent-field > .hys-ui-form-item-label {
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  line-height: 1.6;
  min-width: 0;
  margin: 0;
}
.hys-ui-form-label-content {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  min-width: 0;
}
.hys-ui-form-label-text {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.hys-ui-form-label-auto .hys-ui-form-label-content {
  width: max-content;
  max-width: none;
  flex-shrink: 0;
  flex-wrap: nowrap;
}
.hys-ui-form-label-nowrap .hys-ui-form-label-content {
  flex-wrap: nowrap;
}
.hys-ui-form-label-auto > .hys-ui-form-item-label {
  overflow: hidden;
}
.hys-ui-form-label-nowrap .hys-ui-form-label-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hys-ui-form-label-align-right > .hys-ui-form-item-label {
  justify-content: flex-end;
  text-align: right;
}
.hys-ui-form-item-grid {
  display: grid;
  grid-template-columns: var(--hys-ui-form-label-width) minmax(0, 1fr);
  gap: 7px 14px;
  align-items: start;
}
.hys-ui-form-item-grid > .hys-ui-form-item-label {
  padding-top: 9px;
}
.hys-ui-form-item-body,
.hys-ui-form-item-control {
  min-width: 0;
}
.hys-ui-form-item-control {
  position: relative;
}
.hys-ui-form-item-control:has(> .hys-ui-form-feedback-icon) {
  padding-right: 24px;
}
.hys-ui-form-item-feedback {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hys-ui-form-item-feedback small {
  display: block;
  font-size: inherit;
  line-height: inherit;
}
.hys-ui-form-item-hint,
.hys-ui-form-item-extra {
  display: block;
  margin-top: 5px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
  line-height: 1.6;
}
.hys-ui-form-required {
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
  flex-shrink: 0;
}
.hys-ui-form-optional {
  font-size: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-weight: 400;
  white-space: nowrap;
}
.hys-ui-form-warning,
.hys-ui-form-feedback-warning {
  color: var(--hys-ui-orange, var(--hys-ui-theme-orange, #d97706));
}
.hys-ui-ent-error,
.hys-ui-form-feedback-error {
  color: var(--hys-ui-red, var(--hys-ui-theme-red, #d43f50));
}
.hys-ui-form-feedback-success {
  color: var(--hys-ui-green, var(--hys-ui-theme-green, #16a34a));
}
.hys-ui-form-feedback-validating {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-form-feedback-icon {
  display: grid;
  place-items: center;
  position: absolute;
  right: 0;
  top: 11px;
}
.hys-ui-form-item-sm > .hys-ui-form-item-label {
  font-size: 12px;
}
.hys-ui-form-item-sm.hys-ui-form-item-grid > .hys-ui-form-item-label {
  padding-top: 5px;
}
.hys-ui-form-item-sm .hys-ui-form-feedback-icon {
  top: 7px;
}
.hys-ui-form-item-lg > .hys-ui-form-item-label {
  font-size: 15px;
}
.hys-ui-form-item-lg.hys-ui-form-item-grid > .hys-ui-form-item-label {
  padding-top: 12px;
}
.hys-ui-form-item-lg .hys-ui-form-feedback-icon {
  top: 14px;
}
.hys-ui-form-item-no-style {
  display: contents;
}
.hys-ui-form-item-warning :deep(.hys-ui-input-shell),
.hys-ui-form-item-warning :deep(.hys-ui-textarea) {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange, #d97706));
}
.hys-ui-form-inline-feedback {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 5px 12px;
}
.hys-ui-form-inline-feedback > .hys-ui-form-item-control {
  flex: 1 1 160px;
}
.hys-ui-form-inline-feedback > .hys-ui-form-item-feedback {
  flex: 0 1 auto;
  max-width: 100%;
  margin-top: 9px;
}
.hys-ui-form-inline-feedback > .hys-ui-form-item-hint,
.hys-ui-form-inline-feedback > .hys-ui-form-item-extra {
  flex-basis: 100%;
  margin-top: 0;
}
</style>
