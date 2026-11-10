<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysButton } from "hys-ui";
const tags = ref<string[]>([]),
  batch = ref<string[]>([]);
</script>
<template>
  <div class="demo-stack">
    <label class="demo-field"
      >输入时使用逗号或分号分隔<HysTagInput
        v-model="tags"
        :delimiters="[',', ';', '，', '；']"
        :max="30"
        aria-label="自动拆分标签"
        placeholder="可粘贴：设计,研发;测试" /></label
    ><label class="demo-field"
      >仅在保存时拆分<HysTagInput
        v-model="batch"
        separator=","
        :max="30"
        aria-label="保存时拆分标签"
        placeholder="输入甲,乙后按 Enter" /></label
    ><HysButton
      variant="ghost"
      @click="
        tags = [];
        batch = [];
      "
      >清空分隔示例</HysButton
    ><output class="state-output"
      >自动：{{ tags }} · 保存时：{{ batch }}</output
    >
  </div>
</template>
