<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, HysCheckbox } from "hys-ui";
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
      <HysPopover
        :open="open"
        trigger="click"
        title="受控浮层"
        @update:open="update"
        ><template #trigger
          ><HysButton variant="secondary">受控浮层</HysButton></template
        >
        <p>
          宿主接受请求后才会显示或关闭。即使拒绝关闭，页面离开时也会清理浮层。
        </p></HysPopover
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
