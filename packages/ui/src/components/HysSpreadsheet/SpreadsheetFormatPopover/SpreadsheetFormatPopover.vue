<script setup lang="ts">
import { computed } from "vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysColorPicker from "../../HysColorPicker/HysColorPicker.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import HysNumberInput from "../../HysNumberInput/HysNumberInput.vue";
import SpreadsheetFieldHint from "../SpreadsheetFieldHint/SpreadsheetFieldHint.vue";
import {
  fontFamilies,
  type FormatPanel,
} from "../SpreadsheetToolbar/formatTools";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import type {
  HysSpreadsheetCellFormat,
  HysSpreadsheetNumberFormat,
} from "../spreadsheetTypes";

const props = defineProps<{
  panel: FormatPanel;
  format?: HysSpreadsheetCellFormat | null;
  disabled: boolean;
}>();
const emit = defineEmits<{ format: [value: HysSpreadsheetCellFormat] }>();
const message = useSpreadsheetMessages();
const borders = [
  ["solid", "实线"],
  ["dashed", "虚线"],
  ["dotted", "点线"],
  ["double", "双线"],
] as const;
const property = computed(() =>
  props.panel === "fill-color" ? "backgroundColor" : "color",
);
const fonts = computed(() =>
  [
    ...new Set([
      ...fontFamilies,
      ...(props.format?.fontFamily ? [props.format.fontFamily] : []),
    ]),
  ].map((name) => ({ value: name, label: name })),
);
const numbers = computed(() =>
  [
    { value: "general", label: "常规" },
    { value: "number", label: "数字" },
    { value: "currency", label: "货币" },
    { value: "percent", label: "百分比" },
    { value: "date", label: "日期" },
    { value: "time", label: "时间" },
    { value: "scientific", label: "科学计数" },
    { value: "custom", label: "自定义" },
  ].map(({ value, label }) => ({ value, label: message(label) })),
);
</script>

<template>
  <HysSelect
    v-if="panel === 'number-format'"
    size="sm"
    :model-value="format?.number ?? 'general'"
    :options="numbers"
    :aria-label="message('数字格式')"
    :native-label-tooltip="false"
    :disabled="disabled"
    @update:model-value="
      emit('format', { number: $event as HysSpreadsheetNumberFormat })
    "
  />
  <HysSelect
    v-else-if="panel === 'font-family'"
    size="sm"
    :model-value="format?.fontFamily ?? ''"
    :options="fonts"
    :aria-label="message('字体')"
    :placeholder="message('默认字体')"
    :native-label-tooltip="false"
    :disabled="disabled"
    filterable
    allow-create
    clearable
    @update:model-value="
      emit('format', { fontFamily: String($event || '') || undefined })
    "
  />
  <HysNumberInput
    v-else-if="panel === 'font-size'"
    size="sm"
    :model-value="format?.fontSize ?? 13"
    :min="8"
    :max="72"
    :aria-label="message('字号')"
    :disabled="disabled"
    :show-controls="false"
    select-on-focus
    @update:model-value="
      typeof $event === 'number' && emit('format', { fontSize: $event })
    "
  />
  <div v-else-if="panel === 'borders'" class="border-actions">
    <HysButton
      v-for="[style, label] in borders"
      :key="style"
      :pressed="format?.borderStyle === style"
      :disabled="disabled"
      size="sm"
      variant="ghost"
      @click="emit('format', { borderStyle: style })"
    >
      <span
        class="sample"
        :style="{ borderStyle: style }"
        aria-hidden="true"
      />{{ message(label) }}
    </HysButton>
    <HysButton
      size="sm"
      variant="ghost"
      :disabled="disabled"
      @click="emit('format', { borderStyle: undefined })"
      >{{ message("清除边框") }}</HysButton
    >
    <SpreadsheetFieldHint class="border-color" :text="message('边框颜色')">
      <HysColorPicker
        :default-value="format?.borderColor ?? '#8a98ab'"
        size="sm"
        :immediate="false"
        :disabled="disabled"
        :aria-label="message('边框颜色')"
        @confirm="
          emit('format', {
            borderStyle: format?.borderStyle ?? 'solid',
            borderColor: $event,
          })
        "
      />
    </SpreadsheetFieldHint>
  </div>
  <div v-else class="color-actions">
    <HysButton
      v-if="panel === 'fill-color'"
      size="sm"
      variant="ghost"
      :disabled="disabled"
      @click="emit('format', { backgroundColor: undefined })"
    >
      {{ message("无填充色") }}
    </HysButton>
    <HysColorPicker
      :model-value="format?.[property] ?? ''"
      inline
      popup-class="spreadsheet-color-panel"
      immediate="release"
      :show-footer="false"
      :disabled="disabled"
      :aria-label="message(panel === 'fill-color' ? '填充颜色' : '字体颜色')"
      @update:model-value="emit('format', { [property]: $event })"
    />
  </div>
</template>

<style scoped>
.border-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}
.border-actions .hys-ui-btn {
  justify-content: flex-start;
}
.color-actions > .hys-ui-btn {
  margin-block-end: 4px;
}
.color-actions :deep(.spreadsheet-color-panel) {
  padding: 10px;
}
.color-actions :deep(.spreadsheet-color-panel header) {
  margin-block-end: 8px;
}
.color-actions :deep(.hys-ui-pf-color-palette) {
  height: clamp(80px, 16dvh, 112px);
}
.color-actions :deep(.hys-ui-pf-color-hue) {
  margin-block: 12px;
}
.color-actions :deep(.hys-ui-color-panel-input) {
  margin-block-start: 8px;
  padding-block: 4px;
}
.sample {
  display: inline-block;
  inline-size: 12px;
  block-size: 12px;
  border-width: 2px;
  border-color: currentColor;
}
.border-color {
  grid-column: 1 / -1;
}
</style>
