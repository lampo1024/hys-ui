<script setup lang="ts">
import { ref } from "vue";
import { HysAlert, HysCheckbox, HysButton } from "hys-ui";
const visible = ref(true),
  accept = ref(false),
  requested = ref(0),
  closed = ref(0);
function update(next: boolean) {
  if (accept.value) visible.value = next;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="accept" label="接受关闭请求" /><HysButton
        @click="visible = true"
        >重新显示</HysButton
      >
    </div>
    <HysAlert
      :visible="visible"
      @update:visible="update"
      @close="requested++"
      @after-close="closed++"
      title="由宿主管理的提示"
      description="关闭请求可以被宿主拒绝；真正退出后才触发 afterClose。"
      closable
      show-icon
    /><output class="state-output"
      >可见 {{ visible }} · 关闭请求 {{ requested }} 次 · 完成关闭
      {{ closed }} 次</output
    >
    <p class="scenario-note">
      visible 优先于 modelValue。未受控时默认可见，title
      更新会重新显示；defaultVisible 仅设置初值。
    </p>
  </div>
</template>
