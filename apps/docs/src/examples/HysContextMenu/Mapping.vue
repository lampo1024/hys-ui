<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton } from "hys-ui";
const selected = ref("尚未选择"),
  items = [
    {
      code: 1,
      meta: { title: "项目设置" },
      nodes: [
        { code: 2, meta: { title: "常规设置" } },
        { code: 3, meta: { title: "成员权限" }, locked: true },
      ],
    },
    { code: 4, meta: { title: "操作记录" } },
  ];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysContextMenu
        trigger="click"
        :items="items"
        :field-names="{
          value: 'code',
          label: 'meta.title',
          children: 'nodes',
          disabled: 'locked',
        }"
        @select="
          (value, info) => (selected = value + ' · ' + info.item.meta.title)
        "
        ><HysButton>业务菜单数据</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">{{ selected }}</output>
    <p class="scenario-note">
      值可为数字或字符串，同名异类型值互不冲突。字段支持点路径；事件返回原始对象与完整路径，不修改业务数组。可操作项的
      value 在整棵菜单中应唯一。
    </p>
  </div>
</template>
