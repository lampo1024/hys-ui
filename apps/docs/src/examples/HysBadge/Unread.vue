<script setup lang="ts">
import { computed, ref } from "vue";
import { HysBadge, HysButton } from "hys-ui";

const unread = ref(95);
const announcement = computed(() =>
  unread.value ? `${unread.value} 条未读消息` : "消息已全部读完",
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysBadge
        :value="unread"
        :format-value="(_, displayValue) => String(displayValue) + ' 条'"
        :announcement="announcement"
        announce="polite"
        show-zero
      >
        <span class="inbox-label">消息中心</span>
      </HysBadge>
    </div>
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="unread += 10"
        >接收 10 条消息</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!unread"
        @click="unread = 0"
        >全部已读</HysButton
      >
    </div>
  </div>
</template>

<style scoped>
.inbox-label {
  display: inline-block;
  margin-inline-end: 34px;
  padding: 8px 12px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  font-size: 13px;
}
</style>
