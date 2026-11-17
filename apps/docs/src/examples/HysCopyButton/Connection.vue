<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCopyButton, HysSelect } from "hys-ui";
const environment = ref("staging");
const options = [
  { value: "staging", label: "预发布" },
  { value: "production", label: "生产" },
];
const endpoint = computed(() =>
  environment.value === "production"
    ? "https://api.example.com/v1"
    : "https://staging-api.example.com/v1",
);
</script>

<template>
  <div class="demo-stack">
    <HysSelect
      v-model="environment"
      :options="options"
      aria-label="部署环境"
      style="width: 146px"
    />
    <div class="demo-row hys-copy-endpoint">
      <code>{{ endpoint }}</code>
      <HysCopyButton
        :text="endpoint"
        label="复制 API 地址"
        size="sm"
        variant="ghost"
      >
        <template #default="{ state }">{{
          state === "success" ? "地址已复制" : "复制地址"
        }}</template>
      </HysCopyButton>
    </div>
  </div>
</template>

<style scoped>
.hys-copy-endpoint code {
  overflow-wrap: anywhere;
}
</style>
