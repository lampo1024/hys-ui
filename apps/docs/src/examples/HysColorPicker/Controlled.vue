<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysCheckbox, HysButton } from "hys-ui";
const color = ref("#3867f5"),
  accept = ref(false),
  open = ref(false),
  requests = ref(0);
function update(next: string) {
  requests.value++;
  if (accept.value) color.value = next;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="accept" label="接受颜色更新" /><HysButton
        @click="open = true"
        >打开受控颜色面板</HysButton
      >
    </div>
    <HysColorPicker
      :model-value="color"
      @update:model-value="update"
      v-model:open="open"
      label="受控颜色"
    /><output class="state-output"
      >{{ color }} · 更新请求 {{ requests }} 次 · 面板
      {{ open ? "打开" : "关闭" }}</output
    >
    <p class="scenario-note">
      拒绝更新时恢复实际选择；open 可以单独受控，改变颜色和显示状态互相独立。
    </p>
  </div>
</template>
