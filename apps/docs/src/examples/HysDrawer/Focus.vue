<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysCheckbox, HysInput } from "hys-ui";
const open = ref(false),
  autofocus = ref(true),
  restore = ref(true),
  text = ref("");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="autofocus" label="打开时聚焦指定字段" /><HysCheckbox
        v-model="restore"
        label="关闭后还原焦点"
      /><HysButton @click="open = true">焦点与键盘导航</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      title="快捷编辑"
      :autofocus="autofocus"
      :restore-focus="restore"
      initial-focus="[name='drawer-focus-name']"
      footer
      ><HysInput
        v-model="text"
        name="drawer-focus-name"
        label="资源名称"
        placeholder="打开后自动聚焦"
      />
      <p>
        Tab / Shift + Tab 在模态抽屉内循环；Esc
        请求关闭。openAutoFocus、closeAutoFocus
        事件可阻止默认焦点动作，trapFocus 可显式调整焦点约束。
      </p></HysDrawer
    >
  </div>
</template>
