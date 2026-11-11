<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysAnimatedNumber,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  type HysNumberFormat,
  type HysNumberFormatOptions,
  type HysNumberRounding,
} from "hys-ui";

const format = ref<HysNumberFormat>("currency");
const locale = ref("zh-CN");
const rounding = ref<HysNumberRounding>("half-up");
const compact = ref<"none" | "short" | "zh" | "custom">("none");
const trim = ref(false);
const showSign = ref(false);
const precision = ref(2);
const customSymbols = ref(false);
const asOptions = (values: string[]) =>
  values.map((value) => ({ label: value, value }));
const formats = [
  { value: "currency", label: "货币" },
  { value: "decimal", label: "小数" },
  { value: "percent", label: "百分比" },
  { value: "scientific", label: "科学计数法" },
];
const units = [
  { value: "none", label: "完整数值" },
  { value: "short", label: "K / M / B" },
  { value: "zh", label: "万 / 亿 / 万亿" },
  { value: "custom", label: "每包 2500 单" },
];
const values = {
  currency: "12500.125",
  decimal: "-120000.125",
  percent: "0.42125",
  scientific: "0.00000000000098625",
};
const unitRule = [{ threshold: 2500, divisor: 2500, label: " 包" }];
const formatOptions = computed<HysNumberFormatOptions>(() => ({
  numberFormat: format.value,
  locale: locale.value,
  rounding: rounding.value,
  precision: precision.value,
  trimZeros: trim.value,
  currency:
    locale.value === "de-DE" ? "EUR" : locale.value === "en-US" ? "USD" : "CNY",
  compact:
    compact.value === "none"
      ? undefined
      : compact.value === "custom"
        ? unitRule
        : compact.value,
  signDisplay: showSign.value ? "always" : "auto",
  groupSeparator: customSymbols.value ? " " : undefined,
  decimalSeparator: customSymbols.value ? "·" : undefined,
  currencySymbol: customSymbols.value ? "¤" : undefined,
}));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-fields">
      <label class="demo-field"
        >格式<HysSelect v-model="format" :options="formats"
      /></label>
      <label class="demo-field"
        >地区<HysSelect
          v-model="locale"
          :options="asOptions(['zh-CN', 'en-US', 'de-DE', 'hi-IN', 'ar-EG'])"
      /></label>
      <label class="demo-field"
        >单位<HysSelect v-model="compact" :options="units"
      /></label>
      <label class="demo-field"
        >舍入<HysSelect
          v-model="rounding"
          :options="
            asOptions(['half-up', 'half-even', 'floor', 'ceil', 'trunc'])
          "
      /></label>
    </div>
    <div class="demo-control-actions">
      <label class="demo-field"
        >小数位<HysNumberInput v-model="precision" :min="0" :max="6"
      /></label>
      <HysCheckbox v-model="trim" label="去掉末尾零" />
      <HysCheckbox v-model="showSign" label="正数显示加号" />
      <HysCheckbox v-model="customSymbols" label="自定义分隔符和币种符号" />
    </div>
    <HysAnimatedNumber
      :value="values[format]"
      v-bind="formatOptions"
      :value-style="{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 650 }"
    />
  </div>
</template>
