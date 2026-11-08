<script setup lang="ts">
import { ref } from "vue";
import { HysTextarea, HysCheckbox } from "hys-ui";
import { Eraser } from "lucide-vue-next";
const value = ref("可清空的多行内容"),
  readonly = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="readonly" label="只读，保留选择与复制" /><HysTextarea
      v-model="value"
      :readonly="readonly"
      clearable
      :clear-icon="Eraser"
      label="附加说明"
      :rows="3"
      show-count
    />
    <p class="scenario-note">
      只读或禁用时不提供清空操作；clear-icon 插槽可以覆盖 clearIcon 属性。
    </p>
  </div>
</template>
