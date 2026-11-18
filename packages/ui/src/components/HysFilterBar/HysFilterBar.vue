<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, useId, watch, type VNodeChild } from "vue";
import type { HysDatePickerValue } from "../../composables/datePicker";
import { useChoiceModel } from "../../composables/choiceModel";
import type { HysMenuKey } from "../../composables/menu";
import { sameFormValue, snapshotForm } from "../../composables/formValidation";
import type {
  HysSelectDataOption,
  HysSelectModelValue,
} from "../../composables/selectOptions";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysBadge from "../HysBadge/HysBadge.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysDropdown from "../HysDropdown/HysDropdown.vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import HysDatePicker from "../HysDatePicker/HysDatePicker.vue";
import HysDateRangePicker from "../HysDateRangePicker/HysDateRangePicker.vue";
import HysForm from "../HysForm/HysForm.vue";
import HysModal from "../HysModal/HysModal.vue";
import type { HysFormRule } from "../../composables/formContext";
import HysFormItem from "../HysFormItem/HysFormItem.vue";
import { ChevronDown, ChevronUp } from "../HysIcon/svgIcons";
import HysInput from "../HysInput/HysInput.vue";
import HysSelect from "../HysSelect/HysSelect.vue";

export type HysFilterValues = Record<string, unknown>;
export interface HysFilterPreset {
  key: string;
  label: string;
  values: HysFilterValues;
}
export type HysFilterField = {
  key: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** 仅在高级筛选中显示该字段。 */
  hidden?: boolean;
  /** 使用 HysForm 校验该项的原始值。 */
  rules?: HysFormRule | HysFormRule[];
  /** 生成条件摘要中的值文本。 */
  formatValue?: (value: unknown) => string;
} & (
  | {
      type: "select";
      options: readonly HysSelectDataOption[];
      multiple?: boolean;
      filterable?: boolean;
    }
  | { type: "text" | "date" | "date-range" | "custom" }
  | { type: "boolean"; checkLabel?: string }
  | {
      type: "number" | "number-range";
      min?: number;
      max?: number;
      step?: number;
    }
);
export interface HysFilterBarProps {
  /** 按配置顺序显示的字段。key 必须唯一。 */
  fields: readonly HysFilterField[];
  /** 受控筛选草稿，支持 v-model:values。 */
  values?: HysFilterValues;
  /** 非受控初始值。重置时恢复到该值，默认空对象。 */
  initialValues?: HysFilterValues;
  /** 默认展示的字段数，默认 3。传 0 折叠全部字段。 */
  collapsedCount?: number;
  /** 非受控的初始展开状态，默认 false。 */
  defaultExpanded?: boolean;
  /** 查询进行中。暂时禁止再次查询和重置。 */
  loading?: boolean;
  /** 禁止编辑及查询、重置。 */
  disabled?: boolean;
  /** 输入与按钮尺寸，默认 md。 */
  size?: "sm" | "md" | "lg";
  /** 下拉菜单中的常用条件，按字段合并到当前草稿。 */
  presets?: readonly HysFilterPreset[];
  /** 应用常用条件后立即查询，默认 false。 */
  searchOnPreset?: boolean;
  /** 修改条件后自动查询，默认 manual。 */
  searchMode?: "manual" | "auto";
  /** 自动查询防抖，毫秒，默认 280。 */
  searchDelay?: number;
  /** 显示高级筛选弹窗，确认后应用草稿。 */
  advanced?: boolean;
  /** 显示保存条件方案的入口。 */
  savePreset?: boolean;
  /** 在操作栏中提供字段显隐菜单，默认 false。 */
  fieldVisibility?: boolean;
  /** 用户隐藏的常用字段键。支持 v-model:hiddenKeys，隐藏时仍保留条件值。 */
  hiddenKeys?: readonly string[];
  /** 隐藏内置的查询及重置栏。 */
  hideActions?: boolean;
  /** 展示可移除的当前条件，包含折叠字段。 */
  showSummary?: boolean;
  /** 显示独立的清空全部入口，重置仍恢复初始值。 */
  showClear?: boolean;
  /** 操作区的对齐方式，默认 start。 */
  actionsAlign?: "start" | "end";
  /** 覆盖查询、重置、展开和收起按钮文案。 */
  labels?: Partial<{
    search: string;
    reset: string;
    expand: string;
    collapse: string;
    presets: string;
    conditions: string;
  }>;
}
interface FieldSlot {
  field: HysFilterField;
  value: unknown;
  disabled: boolean;
  setValue: (value: unknown) => void;
}
const props = withDefaults(defineProps<HysFilterBarProps>(), {
  collapsedCount: 3,
  size: "md",
});
const emit = defineEmits<{
  "update:values": [values: HysFilterValues];
  /** 字段显隐改变时发出新的隐藏字段键。 */
  "update:hiddenKeys": [keys: string[]];
  search: [values: HysFilterValues];
  reset: [values: HysFilterValues];
  /** 点击清空全部时发出空值快照。 */
  clear: [values: HysFilterValues];
  /** 预设应用后发出预设键和接受的值快照。 */
  preset: [key: string, values: HysFilterValues];
  /** 保存方案时发出名称及条件快照。 */
  presetSave: [name: string, values: HysFilterValues];
}>();
defineSlots<{
  /** 渲染 type 为 custom 的字段，使用 setValue 写回草稿。 */
  field?: (scope: FieldSlot) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const id = useId();
const expanded = ref(props.defaultExpanded);
const form = ref<InstanceType<typeof HysForm>>();
const modalForm = ref<{ validate: () => Promise<boolean> }>();
const advancedOpen = ref(false);
const draft = ref<HysFilterValues>({});
const presetOpen = ref(false);
const presetName = ref("");
let pending: ReturnType<typeof setTimeout> | undefined;
let autoDirty = false;
const blocked = computed(() => props.loading || props.disabled);
const initial = () =>
  snapshotForm(props.initialValues ?? {}) as HysFilterValues;
const model = useChoiceModel(
  {
    get modelValue() {
      return props.values;
    },
  },
  initial,
  sameFormValue,
);
const values = model.current;
const labels = computed(() => ({
  search: "查询",
  reset: "重置",
  expand: "展开更多",
  collapse: "收起",
  presets: "常用筛选",
  conditions: "当前条件",
  ...props.labels,
}));
const collapsed = computed(() =>
  Number.isFinite(props.collapsedCount)
    ? Math.max(0, Math.floor(props.collapsedCount))
    : props.fields.length,
);
const visibleFields = computed(() => {
  const keys = new Set<string>();
  return props.fields.filter((field) => {
    if (keys.has(field.key)) return false;
    keys.add(field.key);
    return true;
  });
});
const standardFields = computed(() => visibleFields.value.filter(field => !field.hidden));
const fieldVisibilityModel = useChoiceModel(
  { get modelValue() { return props.hiddenKeys; } },
  () => [] as readonly string[],
  sameFormValue,
);
const shownFields = computed(() =>
  standardFields.value.filter(field => !fieldVisibilityModel.current.value.includes(field.key)),
);
const inlineFields = computed(() => new Set(
  (expanded.value ? shownFields.value : shownFields.value.slice(0, collapsed.value)).map(field => field.key),
));
const visibilityItems = computed(() => standardFields.value.map(field => ({
  key: field.key,
  label: field.label,
})));
function updateVisibleFields(keys: readonly HysMenuKey[]) {
  const selected = new Set(keys);
  const hidden = standardFields.value.filter(field => !selected.has(field.key)).map(field => field.key);
  void fieldVisibilityModel.commit(hidden, value => emit("update:hiddenKeys", [...value]), () => {});
}
const advancedFields = computed(() => visibleFields.value.map(field => ({ ...field, hidden: false })));
const selectOptions = computed(() => {
  const options = new Map<string, HysSelectDataOption[]>();
  for (const field of visibleFields.value)
    if (field.type === "select") options.set(field.key, [...field.options]);
  return options;
});
const fieldValue = (key: string) =>
  Object.hasOwn(values.value, key) ? values.value[key] : undefined;
const fieldDisabled = (field: HysFilterField) =>
  Boolean(props.disabled || field.disabled);
const publish = (next: HysFilterValues) =>
  emit("update:values", snapshotForm(next) as HysFilterValues);
function edit(field: HysFilterField, value: unknown) {
  if (fieldDisabled(field)) return;
  void model.commit(
    { ...values.value, [field.key]: snapshotForm(value) },
    publish,
    () => {},
  );
}
const snapshot = () => snapshotForm(values.value) as HysFilterValues;
/** 把当前筛选快照序列化为 JSON 字符串。 */
function serialize() { return JSON.stringify(snapshot()); }
/** 校验当前显示的筛选条件，校验失败返回 false。 */
async function validate() { return (await form.value?.validateResult())?.valid ?? false; }
defineExpose({ serialize, validate });
function cancelPending() { clearTimeout(pending); pending = undefined; }
function showAdvanced() { draft.value = snapshot(); advancedOpen.value = true; }
function saveCurrentPreset() {
  const name = presetName.value.trim();
  if (!name || blocked.value) return false;
  emit("presetSave", name, snapshot());
  return true;
}
async function acceptAdvanced() {
  if (blocked.value || !(await modalForm.value?.validate())) return false;
  return sameFormValue(values.value, draft.value) || model.commit(draft.value, publish, () => {});
}
function scheduleAutoSearch() {
  cancelPending();
  if (!autoDirty || blocked.value || !model.isLive()) return;
  const delay = Number.isFinite(props.searchDelay) ? Math.max(0, props.searchDelay!) : 280;
  pending = setTimeout(() => {
    pending = undefined;
    if (blocked.value || !model.isLive()) return;
    autoDirty = false;
    void form.value?.submit();
  }, delay);
}
watch(values, () => {
  autoDirty = props.searchMode === "auto" && !props.disabled;
  scheduleAutoSearch();
}, { deep: true });
watch(blocked, scheduleAutoSearch);
function clearAutoSearch() {
  autoDirty = false;
  cancelPending();
}
watch(() => [props.searchMode, props.disabled], clearAutoSearch);
onDeactivated(clearAutoSearch);
onBeforeUnmount(clearAutoSearch);
const presetItems = computed(() =>
  (props.presets ?? []).map(({ key, label }) => ({ key, label })),
);
async function applyPreset(key: string | number) {
  if (blocked.value) return;
  const preset = props.presets?.find((item) => item.key === key);
  if (!preset) return;
  const fields = new Map(
    visibleFields.value.map((field) => [field.key, field]),
  );
  const additions = Object.fromEntries(
    Object.entries(preset.values).filter(([key]) => {
      const field = fields.get(key);
      return field && !fieldDisabled(field);
    }),
  );
  const next = {
    ...values.value,
    ...(snapshotForm(additions) as HysFilterValues),
  };
  if (
    !sameFormValue(next, values.value) &&
    !(await model.commit(next, publish, () => {}))
  )
    return;
  const updated = snapshot();
  emit("preset", preset.key, updated);
  if (props.searchOnPreset) {
    clearAutoSearch();
    void form.value?.submit();
  }
}
const numeric = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
function range(key: string) {
  const value = fieldValue(key);
  return Array.isArray(value)
    ? ([numeric(value[0]), numeric(value[1])] as const)
    : ([null, null] as const);
}
function editBound(field: HysFilterField, index: 0 | 1, value: unknown) {
  const next = [...range(field.key)];
  next[index] = numeric(value);
  edit(field, next);
}
const summary = computed(() =>
  props.showSummary
    ? visibleFields.value.flatMap((field) => {
        const value = fieldValue(field.key);
        if (
          value == null ||
          value === "" ||
          value === false ||
          (Array.isArray(value) &&
            !value.some((part) => part != null && part !== ""))
        )
          return [];
        const formatted =
          field.formatValue?.(value) ??
          (Array.isArray(value)
            ? value
                .map((part) => part ?? "—")
                .join(field.type.endsWith("range") ? " 至 " : "、")
            : value === true
              ? field.type === "boolean"
                ? (field.checkLabel ?? field.label)
                : "是"
              : String(value));
        return [{ field, formatted }];
      })
    : [],
);
function remove(field: HysFilterField) {
  if (blocked.value || fieldDisabled(field)) return;
  const next = { ...values.value };
  delete next[field.key];
  void model.commit(next, publish, () => {});
}
async function search() {
  clearAutoSearch();
  await nextTick();
  if (props.loading || props.disabled || !model.isLive()) return;
  emit("search", snapshotForm(values.value) as HysFilterValues);
}
function clear() {
  if (blocked.value) return;
  void model.commit({}, publish, () => {});
  emit("clear", {});
}
function reset() {
  if (props.loading || props.disabled) return;
  const next = initial();
  void model.commit(next, publish, () => {});
  emit("reset", snapshotForm(next) as HysFilterValues);
}
</script>

<template>
  <section v-bind="skin" class="hys-filter-bar">
    <HysForm
      ref="form" layout="vertical" :model="values"
      :size="size"
      :disabled="disabled"
      @submit="search"
    >
      <div
        :id="id"
        class="hys-filter-bar-fields"
        :class="{ 'has-fields': inlineFields.size > 0 }"
      >
        <HysFormItem
          v-for="field in standardFields"
          v-show="inlineFields.has(field.key)"
          :key="field.key"
          :label="field.label" :prop="field.rules ? [field.key] : undefined" :rules="field.rules"
          class="hys-filter-bar-field"
        >
          <HysInput
            v-if="field.type === 'text'"
            :model-value="String(fieldValue(field.key) ?? '')"
            :placeholder="field.placeholder"
            :disabled="fieldDisabled(field)"
            :clearable="field.clearable ?? true"
            @update:model-value="edit(field, $event)"
          />
          <HysSelect
            v-else-if="field.type === 'select'"
            :model-value="
              (fieldValue(field.key) ??
                (field.multiple ? [] : null)) as HysSelectModelValue
            "
            :options="selectOptions.get(field.key)"
            :placeholder="field.placeholder"
            :multiple="field.multiple"
            :filterable="field.filterable"
            :disabled="fieldDisabled(field)"
            :clearable="field.clearable ?? true"
            :native-label-tooltip="false"
            @update:model-value="edit(field, $event)"
          />
          <HysDatePicker
            v-else-if="field.type === 'date'"
            :model-value="(fieldValue(field.key) ?? null) as HysDatePickerValue"
            :aria-label="field.label"
            :placeholder="field.placeholder"
            :disabled="fieldDisabled(field)"
            :allow-clear="field.clearable ?? true"
            value-format="YYYY-MM-DD"
            @update:model-value="edit(field, $event)"
          />
          <HysDateRangePicker
            v-else-if="field.type === 'date-range'"
            :model-value="(fieldValue(field.key) ?? null) as HysDatePickerValue"
            :aria-label="field.label"
            :placeholder="field.placeholder"
            :disabled="fieldDisabled(field)"
            :allow-clear="field.clearable ?? true"
            value-format="YYYY-MM-DD"
            @update:model-value="edit(field, $event)"
          />
          <HysCheckbox
            v-else-if="field.type === 'boolean'"
            :model-value="fieldValue(field.key) === true"
            :disabled="fieldDisabled(field)"
            @update:model-value="edit(field, $event)"
            >{{ field.checkLabel ?? field.label }}</HysCheckbox
          >
          <HysNumberInput
            v-else-if="field.type === 'number'"
            :model-value="numeric(fieldValue(field.key))"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :disabled="fieldDisabled(field)"
            :placeholder="field.placeholder"
            :show-controls="false"
            :clearable="field.clearable ?? true"
            @update:model-value="edit(field, $event)"
          />
          <div
            v-else-if="field.type === 'number-range'"
            class="hys-filter-range"
          >
            <HysNumberInput
              :model-value="range(field.key)[0]"
              :min="field.min"
              :max="range(field.key)[1] ?? field.max"
              :step="field.step"
              :aria-label="field.label + '最小值'"
              placeholder="最小值"
              :disabled="fieldDisabled(field)"
              :show-controls="false"
              clearable
              @update:model-value="editBound(field, 0, $event)"
            />
            <span aria-hidden="true">至</span>
            <HysNumberInput
              :model-value="range(field.key)[1]"
              :min="range(field.key)[0] ?? field.min"
              :max="field.max"
              :step="field.step"
              :aria-label="field.label + '最大值'"
              placeholder="最大值"
              :disabled="fieldDisabled(field)"
              :show-controls="false"
              clearable
              @update:model-value="editBound(field, 1, $event)"
            />
          </div>
          <slot
            v-else
            name="field"
            :field="field"
            :value="fieldValue(field.key)"
            :disabled="fieldDisabled(field)"
            :set-value="(value) => edit(field, value)"
          />
        </HysFormItem>
      </div>
      <div v-if="!hideActions" class="hys-filter-bar-actions" :style="{ justifyContent: actionsAlign ?? 'start' }">
        <HysButton type="submit" :size="size" :loading="loading">{{
          labels.search
        }}</HysButton>
        <HysButton
          variant="secondary"
          :size="size"
          :disabled="loading"
          @click="reset"
          >{{ labels.reset }}</HysButton
        >
        <HysButton v-if="showClear" variant="ghost" :size="size" :disabled="blocked" @click="clear">清空全部</HysButton>
        <HysButton
          v-if="shownFields.length > collapsed"
          variant="ghost"
          :size="size"
          :icon="expanded ? ChevronUp : ChevronDown"
          :aria-controls="id"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
          >{{ expanded ? labels.collapse : labels.expand }}</HysButton
        >
        <HysDropdown
          v-if="presetItems.length"
          :items="presetItems"
          :disabled="blocked"
          :label="labels.presets"
          :searchable="presetItems.length > 8"
          @select="applyPreset"
        />
        <HysDropdown
          v-if="fieldVisibility && visibilityItems.length"
          :items="visibilityItems"
          :disabled="disabled"
          :selected-keys="shownFields.map(field => field.key)"
          label="显示字段"
          selection-mode="multiple"
          @update:selected-keys="updateVisibleFields"
        />
      </div>
      <div
        v-if="summary.length"
        class="hys-filter-summary"
        role="group"
        :aria-label="labels.conditions"
      >
        <span>{{ labels.conditions }}（{{ summary.length }}）</span>
        <HysBadge
          v-for="{ field, formatted } in summary"
          :key="field.key"
          :closable="!blocked && !fieldDisabled(field)"
          :close-label="'移除' + field.label"
          @close="remove(field)"
        >
          {{
            field.type === "boolean" && formatted === field.label
              ? formatted
              : field.label + " · " + formatted
          }}
        </HysBadge>
      </div>
    </HysForm>
    <div v-if="advanced || savePreset" class="hys-filter-extra">
      <HysButton v-if="advanced" variant="secondary" :size="size" :disabled="blocked" @click="showAdvanced">高级筛选</HysButton>
      <HysButton v-if="savePreset" variant="secondary" :size="size" :disabled="blocked" @click="presetName = ''; presetOpen = true">保存方案</HysButton>
    </div>
    <HysModal v-if="advanced" v-model:open="advancedOpen" title="高级筛选" footer :before-confirm="acceptAdvanced">
      <div class="hys-filter-modal-content">
        <HysFilterBar ref="modalForm" v-model:values="draft" :fields="advancedFields" :collapsed-count="advancedFields.length" :size="size" show-summary hide-actions>
          <template v-if="$slots.field" #field="scope"><slot name="field" v-bind="scope" /></template>
        </HysFilterBar>
      </div>
    </HysModal>
    <HysModal v-if="savePreset" v-model:open="presetOpen" title="保存筛选方案" footer :confirm-disabled="!presetName.trim()"
      :before-confirm="saveCurrentPreset">
      <div class="hys-filter-modal-content"><HysInput v-model="presetName" label="方案名称" :maxlength="60" /></div>
    </HysModal>
  </section>
</template>

<style scoped>
.hys-filter-extra { display: flex; flex-wrap: wrap; gap: 8px; margin-block-start: 8px; }
.hys-filter-modal-content { padding: 4px; }
.hys-filter-bar {
  min-width: 0;
}
.hys-filter-bar-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(192px, 100%), 1fr));
  gap: 10px 14px;
}
.hys-filter-bar-field {
  min-width: 0;
  margin: 0;
}
.hys-filter-bar-field :deep(.hys-ui-ex-field),
.hys-filter-bar-field :deep(.hys-ui-select),
.hys-filter-bar-field :deep(.hys-ui-date-picker) {
  width: 100%;
  min-width: 0;
}
.hys-filter-bar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.hys-filter-bar-fields.has-fields + .hys-filter-bar-actions {
  margin-top: 12px;
}
.hys-filter-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}
.hys-filter-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  margin-block-start: 10px;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
</style>
