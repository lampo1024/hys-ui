<script setup lang="ts">
import { ref } from "vue";
import { HysMention, type HysMentionOption } from "hys-ui";

const text = ref("");
const topics = ref<HysMentionOption[]>([
  { value: "发布", label: "发布" },
  { value: "回归", label: "回归" },
]);
function add(option: HysMentionOption) {
  topics.value.push({ value: option.value, label: String(option.value) });
}
</script>

<template>
  <div class="demo-stack">
    <HysMention
      v-model="text"
      :options="topics"
      prefix="#"
      split="；"
      allow-create
      select-on-tab
      whole
      :format-mention="(option) => '【' + option.value + '】'"
      placeholder="输入 #话题"
      @create="add"
    >
      <template #option="{ option, created }">
        <span>{{ created ? "创建话题 " + option.value : option.value }}</span>
      </template>
    </HysMention>
    <p class="scenario-note">
      输入新话题后用 Enter 或 Tab
      创建。组件按业务格式插入话题，并自动追加分隔符。
    </p>
  </div>
</template>
