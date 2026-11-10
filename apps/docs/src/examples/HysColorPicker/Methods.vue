<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysButton, type HysColorPickerInstance } from "hys-ui";
const api = ref<HysColorPickerInstance>(),
  result = ref("等待操作");
async function preset() {
  result.value = String(await api.value?.setColor("hsl(150, 70%, 40%)"));
}
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      ref="api"
      default-value="#3867f5"
      clearable
      label="颜色实例"
    />
    <div class="demo-control-actions">
      <HysButton @click="api?.show()">显示颜色面板</HysButton
      ><HysButton @click="preset">设置绿色</HysButton
      ><HysButton @click="api?.clear()">清空颜色值</HysButton
      ><HysButton @click="api?.focus()">聚焦颜色输入</HysButton>
    </div>
    <output class="state-output">方法结果：{{ result }}</output>
  </div>
</template>
