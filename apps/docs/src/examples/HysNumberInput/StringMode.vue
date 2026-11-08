<script setup lang="ts">
import { ref } from "vue";
import { HysNumberInput } from "hys-ui";
const value = ref<string | null>("9007199254740993.0000000000000001");
</script>
<template>
  <div class="demo-content">
    <label class="demo-field"
      ><span>大整数与高精度小数</span
      ><HysNumberInput
        v-model="value"
        string-mode
        step="0.0000000000000001"
        controls-position="right"
        clearable
        block
        align="left"
        aria-label="高精度数值" /></label
    ><output class="state-output"
      >字符串模型：{{ JSON.stringify(value) }}</output
    >
    <p class="scenario-note">
      stringMode 的模型和更新事件使用十进制字符串，空值仍为
      null。步长和范围也建议使用字符串，避免调用方在传入前已丢失精度。普通
      number 模式默认限制在安全数值范围内。
    </p>
  </div>
</template>
