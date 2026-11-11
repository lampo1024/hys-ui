<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysMention,
  type HysMentionInstance,
  type HysMentionTrigger,
} from "hys-ui";

const text = ref("");
const editor = ref<HysMentionInstance>();
const triggers: HysMentionTrigger[] = [
  {
    prefix: "@",
    boundary: "word",
    minQueryLength: 1,
    type: "member",
    options: [
      { id: "zhang", value: "张三", label: "张三", description: "研发" },
      { id: "li", value: "李娜", label: "李娜", description: "产品" },
    ],
  },
  {
    prefix: "#",
    allowSpaces: true,
    type: "topic",
    options: [
      { value: "release notes", label: "release notes" },
      { value: "release checklist", label: "release checklist" },
    ],
  },
  {
    prefix: "/",
    boundary: "word",
    split: "；",
    type: "command",
    options: [
      { value: "help", label: "帮助" },
      { value: "review", label: "发起审核" },
    ],
  },
  { prefix: ":", type: "emoji", options: [{ value: "🎉", label: "庆祝" }] },
  { prefix: "::", type: "symbol", options: [{ value: "✔", label: "已确认" }] },
];
</script>

<template>
  <div class="demo-stack">
    <HysButton
      size="sm"
      variant="secondary"
      @click="editor?.open({ prefix: '/' })"
      >打开命令候选</HysButton
    >
    <HysMention
      ref="editor"
      v-model="text"
      :triggers="triggers"
      highlight-match
      :shortcuts="{ 'Ctrl+ ': 'open', 'Ctrl+End': 'last' }"
      placeholder="输入 @张、#release n、/help、: 或 ::"
      not-found-text="没有匹配项"
    />
    <p class="scenario-note">
      规则可独立设置关键词长度、词边界、空格和分隔符。也可通过按钮或
      Ctrl+空格打开候选。
    </p>
  </div>
</template>
