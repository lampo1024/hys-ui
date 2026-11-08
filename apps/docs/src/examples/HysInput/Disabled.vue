<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysCheckbox } from "hys-ui";
const disabled = ref(true),
  value = ref("此内容保留在模型中");
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="disabled" label="禁用输入" />
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>禁用状态</span
        ><HysInput v-model="value" :disabled="disabled" clearable /></label
      ><label class="input-demo-field"
        ><span>只读，可选择与复制</span
        ><HysInput model-value="只读文本" readonly clearable
      /></label>
    </div>
    <output class="state-output">{{ value }}</output>
  </div>
</template>
