<script setup lang="ts">
import { ref } from "vue";
import { HysList } from "hys-ui";
const selected = ref<(string | number)[]>([]);
const items = [
  { key: 1, title: "张岚", description: "东北区值班负责人", meta: "在线", group: "当班" },
  { key: 2, title: "陈晨", description: "负责工单升级和技术支持", meta: "忙碌", group: "当班" },
  { key: 3, title: "李明", description: "本轮交接尚未开始", group: "下一班", disabled: true }
];
</script>

<template>
  <div class="demo-stack">
    <HysList :items="items" :selected-keys="selected" bordered interactive @item-click="item => selected = [item.key]" />
  </div>
</template>
