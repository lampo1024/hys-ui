<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton, HysCheckbox } from "hys-ui";
const open = ref(false),
  locked = ref(false),
  requests = ref(0);
function update(value: boolean) {
  requests.value++;
  if (!locked.value) open.value = value;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="open = !open">外部切换显示</HysButton
      ><HysCheckbox v-model="locked" label="拒绝组件的显示请求" />
    </div>
    <div class="demo-content">
      <HysTooltip
        :open="open"
        trigger="click"
        text="受控提示内容"
        @update:open="update"
        ><HysButton variant="secondary">受控提示</HysButton></HysTooltip
      >
    </div>
    <output class="state-output"
      >{{ open ? "已展开" : "已收起" }} · 请求 {{ requests }} 次</output
    >
    <p class="scenario-note">
      支持 v-model:open 或 v-model；同时传入时 open 优先。defaultOpen
      用于非受控初始显示。
    </p>
  </div>
</template>
