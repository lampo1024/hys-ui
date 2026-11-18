<script setup lang="ts">
import { ref } from "vue";
import { HysFloatButton } from "hys-ui";
import { Check, Plus } from "hys-ui/icons";
const recent = ref("等待操作");
const actions = [{ key: "新建工单", label: "新建工单", icon: Plus }, { key: "处理下一单", label: "处理下一单", icon: Check }];
</script>

<template>
  <div class="demo-stack">
    <section style="position: relative; min-height: 190px; padding: 12px; border: 1px solid var(--hys-ui-theme-border); border-radius: 8px">
      <p aria-live="polite">{{ recent }}</p>
      <HysFloatButton contained label="工单快捷操作" :actions="actions" @action="recent = String($event)" />
    </section>
  </div>
</template>
