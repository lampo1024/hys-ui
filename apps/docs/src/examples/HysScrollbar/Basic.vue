<script setup lang="ts">
import { HysScrollbar } from "hys-ui";

const updates = [
  ["上线验收", "核对预约、取消和补发通知。"],
  ["修订提示", "为超时和重复提交分别添加提示。"],
  ["回归排期", "在桌面和移动端核查提交流程。"],
  ["更新文档", "补充管理员权限和导出规则。"],
  ["汇总反馈", "归档试用期间收到的问题。"],
  ["完成交接", "确认支持人员可以访问运行记录。"],
];
</script>

<template>
  <HysScrollbar :height="216" direction="vertical" aria-label="交付记录" class="updates">
    <ul>
      <li v-for="[title, detail] in updates" :key="title">
        <strong>{{ title }}</strong>
        <span>{{ detail }}</span>
      </li>
    </ul>
  </HysScrollbar>
</template>

<style scoped>
.updates {
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  background: var(--hys-ui-theme-surface);
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: grid;
  gap: 4px;
  padding: 12px 16px;
  color: var(--hys-ui-theme-text);
}
li + li {
  border-block-start: 1px solid var(--hys-ui-theme-border);
}
li span {
  color: var(--hys-ui-theme-muted);
}
</style>
