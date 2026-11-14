<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import HysAccordion from "../../HysAccordion/HysAccordion.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysCheckbox from "../../HysCheckbox/HysCheckbox.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import SpreadsheetFieldHint from "../SpreadsheetFieldHint/SpreadsheetFieldHint.vue";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import type { HysSpreadsheetFindOptions } from "../spreadsheetTypes";

const props = defineProps<{
  sheetId: string;
  selection: readonly string[];
  results: readonly string[];
  feedback: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  find: [query: string, options: HysSpreadsheetFindOptions];
  replace: [
    query: string,
    replacement: string,
    options: HysSpreadsheetFindOptions,
  ];
  locate: [address: string];
  reset: [];
}>();
const message = useSpreadsheetMessages();
const query = ref("");
const replacement = ref("");
const scope = ref<"sheet" | "selection">("sheet");
const ranges = shallowRef<readonly string[]>([]);
const order = ref<"row" | "column">("row");
const source = ref<"values" | "formulas">("values");
const matchCase = ref(false);
const wholeCell = ref(false);
const wildcards = ref(false);
const result = ref("");
const scopeOptions = computed(() => [
  { value: "sheet", label: message("当前工作表") },
  {
    value: "selection",
    label: message("选区"),
    disabled: !props.selection.length && !ranges.value.length,
  },
]);
const orderOptions = computed(() => [
  { value: "row", label: message("按行") },
  { value: "column", label: message("按列") },
]);
const sourceOptions = computed(() => [
  { value: "values", label: message("计算结果与普通值") },
  { value: "formulas", label: message("原始内容与公式") },
]);
const resultOptions = computed(() =>
  props.results
    .slice(0, 1000)
    .map((address) => ({ value: address, label: address })),
);
const options = computed<HysSpreadsheetFindOptions>(() => ({
  matchCase: matchCase.value,
  wholeCell: wholeCell.value,
  formulas: source.value === "formulas",
  wildcards: wildcards.value,
  order: order.value,
  ranges: scope.value === "selection" ? ranges.value : undefined,
}));
const canSearch = computed(
  () => !!query.value && (scope.value === "sheet" || ranges.value.length > 0),
);

watch([query, options], () => emit("reset"));
watch(
  () => props.results,
  (values) => (result.value = values[0] ?? ""),
);
watch(
  () => props.sheetId,
  () => {
    ranges.value = [];
    scope.value = "sheet";
  },
);

function changeScope(value: unknown) {
  scope.value = value === "selection" ? "selection" : "sheet";
  if (scope.value === "selection") ranges.value = [...props.selection];
}

function find() {
  if (canSearch.value) emit("find", query.value, options.value);
}

function replaceAll() {
  if (canSearch.value && !props.disabled)
    emit("replace", query.value, replacement.value, options.value);
}
</script>

<template>
  <div class="search-form">
    <div class="search-actions">
      <HysInput
        v-model="query"
        data-hys-find-input
        size="sm"
        :placeholder="message('查找内容')"
        :aria-label="message('查找内容')"
        @press-enter="find"
      />
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="!canSearch"
        @click="find"
        >{{ message("查找全部") }}</HysButton
      >
      <HysInput
        v-model="replacement"
        data-hys-replace-input
        size="sm"
        :placeholder="message('替换为')"
        :aria-label="message('替换为')"
        @press-enter="replaceAll"
      />
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="disabled || !canSearch"
        @click="replaceAll"
        >{{ message("全部替换") }}</HysButton
      >
    </div>

    <HysAccordion
      size="sm"
      ghost
      :items="[{ title: message('高级选项') }]"
      :default-active="[0]"
      :destroy-on-hide="false"
    >
      <template #content>
        <div class="advanced-fields">
          <SpreadsheetFieldHint
            class="advanced-field"
            :text="message('查找范围')"
          >
            <HysSelect
              :model-value="scope"
              :options="scopeOptions"
              size="sm"
              :native-label-tooltip="false"
              :aria-label="message('查找范围')"
              @update:model-value="changeScope"
            />
          </SpreadsheetFieldHint>
          <SpreadsheetFieldHint
            class="advanced-field"
            :text="message('查找顺序')"
          >
            <HysSelect
              v-model="order"
              :options="orderOptions"
              size="sm"
              :native-label-tooltip="false"
              :aria-label="message('查找顺序')"
            />
          </SpreadsheetFieldHint>
          <SpreadsheetFieldHint
            class="advanced-field"
            :text="message('查找内容类型')"
          >
            <HysSelect
              v-model="source"
              :options="sourceOptions"
              size="sm"
              :native-label-tooltip="false"
              :aria-label="message('查找内容类型')"
            />
          </SpreadsheetFieldHint>
        </div>
        <div v-if="scope === 'selection'" class="selection-scope">
          <span>{{ message("查找选区") }} {{ ranges.join(", ") }}</span>
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="!selection.length"
            @click="ranges = [...selection]"
            >{{ message("使用当前选区") }}</HysButton
          >
        </div>
        <div class="checks">
          <HysCheckbox
            v-model="matchCase"
            size="sm"
            :label="message('区分大小写')"
          />
          <HysCheckbox
            v-model="wholeCell"
            size="sm"
            :label="message('匹配整个单元格')"
          />
          <HysCheckbox
            v-model="wildcards"
            size="sm"
            :label="message('使用通配符')"
          />
        </div>
        <p v-if="wildcards" class="hint">
          {{ message("* 匹配任意文本，? 匹配一个字符，~ 转义通配符。") }}
        </p>
      </template>
    </HysAccordion>

    <div v-if="feedback || results.length" class="result">
      <span v-if="feedback" role="status">{{ feedback }}</span>
      <SpreadsheetFieldHint
        v-if="results.length"
        class="result-target"
        :text="message('定位结果')"
      >
        <HysSelect
          v-model="result"
          :options="resultOptions"
          size="sm"
          :native-label-tooltip="false"
          :aria-label="message('定位结果')"
          @update:model-value="emit('locate', $event)"
        />
      </SpreadsheetFieldHint>
      <span v-if="results.length > 1000" class="hint">{{
        message("显示前 1,000 个结果。")
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.search-form {
  display: grid;
  gap: 12px;
  font-size: 13px;
}
.search-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 12px;
}
.search-actions :deep(.hys-ui-input-wrap) {
  min-inline-size: 0;
  inline-size: 100%;
}
.search-actions :deep(.hys-ui-btn) {
  white-space: nowrap;
}
.advanced-fields,
.checks,
.selection-scope,
.result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.advanced-fields,
.checks,
.selection-scope {
  margin-block-start: 8px;
}
.advanced-field {
  flex: 1 1 120px;
}
.result-target :deep(.hys-ui-select-wrap) {
  min-inline-size: 74px;
}
.selection-scope span,
.hint {
  color: var(--hys-ui-theme-muted);
  overflow-wrap: anywhere;
}
.hint {
  margin: 6px 0 0;
}
</style>
