<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
const inside = ref(""),
  outside = ref(""),
  custom = ref("说明");
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>内置计数</span
        ><HysInput
          v-model="inside"
          :maxlength="10"
          show-count
          placeholder="最多 10 个 UTF-16 单元"
          aria-label="内置长度限制" /></label
      ><label class="input-demo-field"
        ><span>外部计数</span
        ><HysInput
          v-model="outside"
          :maxlength="20"
          show-word-limit
          word-limit-position="outside"
          aria-label="外部长度限制" /></label
      ><label class="input-demo-field"
        ><span>自定义计数文案</span
        ><HysInput
          v-model="custom"
          :maxlength="15"
          :show-count="{
            formatter: ({ count, maxLength }) =>
              `剩余 ${Math.max(0, (maxLength ?? 0) - count)}`,
          }"
          aria-label="自定义计数文案"
      /></label>
    </div>
    <p class="scenario-note">
      默认按 JavaScript
      字符串长度限制。外部传入的超长模型仍会完整展示并标记超限，组件不会主动改写调用方数据。
    </p>
  </div>
</template>
