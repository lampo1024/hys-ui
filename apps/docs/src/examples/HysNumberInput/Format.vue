<script setup lang="ts">
import { ref } from "vue";
import {
  HysNumberInput,
  type HysNumberInputFormatInfo,
  type HysNumberInputValue,
} from "hys-ui";
const amount = ref<number | null>(1234.5),
  ratio = ref<number | null>(0.65),
  localized = ref<number | null>(1.5);
function money(
  value: HysNumberInputValue,
  { userTyping, input }: HysNumberInputFormatInfo,
) {
  return userTyping
    ? input
    : value === null
      ? ""
      : "¥ " +
        Number(value).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
}
function percent(
  value: HysNumberInputValue,
  { userTyping, input }: HysNumberInputFormatInfo,
) {
  return userTyping
    ? input
    : value === null
      ? ""
      : new Intl.NumberFormat("en-US", {
          style: "percent",
          maximumFractionDigits: 2,
        }).format(Number(value));
}
</script>
<template>
  <div class="demo-content">
    <div class="format-fields">
      <label class="demo-field"
        ><span>金额展示与原始值分开</span
        ><HysNumberInput
          v-model="amount"
          :formatter="money"
          :parser="(text) => text.replace(/[¥,\s]/g, '')"
          :precision="2"
          clearable
          block
          align="left"
          aria-label="格式化金额" /></label
      ><label class="demo-field"
        ><span>百分比展示，模型保存比例</span
        ><HysNumberInput
          v-model="ratio"
          :formatter="percent"
          :parser="(text) => Number(text.replace('%', '')) / 100"
          :min="0"
          :max="1"
          :step="0.01"
          :precision="2"
          clearable
          block
          aria-label="比例输入" /></label
      ><label class="demo-field"
        ><span>逗号作为小数点</span
        ><HysNumberInput
          v-model="localized"
          decimal-separator=","
          :step="0.1"
          aria-label="逗号小数"
      /></label>
    </div>
    <output class="state-output"
      >原始值：{{ JSON.stringify({ amount, ratio, localized }) }}</output
    >
    <p class="scenario-note">
      formatter 接收 userTyping 与原始 input，可在输入过程中保留草稿。parser
      还原原始数值；默认在 Enter、失焦或 change 时提交。name
      会提交原始值，不会提交货币符号或分组逗号。
    </p>
  </div>
</template>
<style scoped>
.format-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 20px;
}
</style>
