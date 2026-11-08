<script setup lang="ts">
import { ref } from "vue";
import { HysSelect, type HysSelectValue } from "hys-ui";
const scalar = ref<string | number | boolean | null>(0),
  person = ref<HysSelectValue | null>({ id: 2, name: "Lisa" });
const values = [
  { label: "数值 0", value: 0 },
  { label: "文本 0", value: "0" },
  { label: "布尔 false", value: false },
  { label: "空字符串", value: "" },
];
const people = [
  { label: "Keller", value: { id: 1, name: "Keller" } },
  { label: "Lisa", value: { id: 2, name: "Lisa" } },
  { label: "David", value: { id: 3, name: "David" } },
];
</script>
<template>
  <div class="demo-content">
    <div class="select-demo-grid">
      <label class="select-demo-field"
        ><span>不同基础类型</span
        ><HysSelect
          v-model="scalar"
          :options="values"
          :empty-values="[null, undefined]"
          :clear-value="null"
          clearable
          aria-label="基础值类型" /></label
      ><label class="select-demo-field"
        ><span>完整对象作为值</span
        ><HysSelect
          v-model="person"
          :options="people"
          value-key="id"
          :clear-value="null"
          clearable
          aria-label="对象值选择"
      /></label>
    </div>
    <output class="state-output"
      >基础值：{{ JSON.stringify(scalar) }} · 类型：{{
        typeof scalar
      }}
      对象值：{{ JSON.stringify(person) }}</output
    >
    <p class="scenario-note">
      数值和同名文本使用不同标识。emptyValues
      可让空字符串作为有效选项；clearValue 控制清空后的值。对象值建议显式指定
      valueKey，列表刷新为新对象后仍按稳定标识匹配。
    </p>
  </div>
</template>
