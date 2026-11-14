<script setup lang="ts">
import { ref } from "vue";
import { HysMarkdownEditor } from "hys-ui";

const markdown = ref([
  "# 仓储工作台 2.4",
  "",
  "本次更新缩短了**出库登记**流程，并补充了库存核对说明。",
  "",
  "## 发布清单",
  "",
  "- [x] 合并重复订单提醒",
  "- [ ] 更新交接手册",
  "- [ ] 通知各仓值班人员",
  "",
  "更多信息见[交接手册](https://example.com/warehouse)。",
].join("\n"));
</script>

<template>
  <div class="demo-stack">
    <HysMarkdownEditor v-model="markdown" />
    <p class="scenario-note">在预览中勾选「更新交接手册」，源码会同步更新。用「图片地址」插入 HTTPS 图片，或选择「撤销」回到修改前。</p>
  </div>
</template>
