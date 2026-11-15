<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor, type HysJsonEditorSchema } from "hys-ui";

const json = ref([
  "{",
  "  // 任务重试配置",
  "  retries: 7,",
  "  'region': 'east',",
  "  'region': 'west',",
  "}",
].join("\n"));
const schema = ref<HysJsonEditorSchema | null>({
  type: "object",
  required: ["retries", "region"],
  properties: {
    retries: { type: "integer", minimum: 0, maximum: 5 },
    region: { enum: ["east", "west"] },
    mode: { enum: ["manual", "automatic"] },
  },
});
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="json" v-model:schema="schema" />
    <p class="scenario-note">打开「修复 JSON」并应用预览，再从状态栏删除一个 region 副本。点击 Schema 问题定位 retries，把它改到 0 至 5。也可在树视图添加 mode，体验字段和枚举建议。</p>
  </div>
</template>
