<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysPopconfirm, type HysPopconfirmInstance } from "hys-ui";
const anchor = ref<InstanceType<typeof HysButton>>();
const popup = ref<HysPopconfirmInstance>();
const open = ref(false),
  result = ref("等待操作");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel demo-control-actions">
      <HysButton ref="anchor" @click="open = !open">标记为已读</HysButton>
      <HysButton variant="secondary" @click="popup?.show()"
        >通过实例展开</HysButton
      >
      <HysButton variant="ghost" :disabled="!open" @click="popup?.close()"
        >通过实例收起</HysButton
      >
    </div>
    <HysPopconfirm
      v-model:open="open"
      ref="popup"
      trigger="manual"
      :close-on-outside="false"
      :reference="() => anchor?.element"
      title="标记全部通知为已读？"
      description="未读数量将清零。"
      confirm-text="标记已读"
      tone="info"
      @confirm="result = '全部通知已标记为已读'"
      @dismiss="result = '收起原因 · ' + $event"
    />
    <output class="state-output" aria-live="polite">{{ result }}</output>
  </div>
</template>
