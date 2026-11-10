<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton, HysInput } from "hys-ui";
const note = ref(""),
  result = ref("尚未操作");
const items = [
  {
    label: "保存草稿",
    value: "save",
    description: "保存当前编辑内容",
    shortcut: "Ctrl+S",
  },
  {
    label: "帮助文档",
    value: "help",
    href: "https://github.com/lampo1024/hys-ui",
    target: "_blank",
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysContextMenu
        trigger="click"
        :items="items"
        :width="300"
        @select="result = String($event)"
        ><HysButton>自定义菜单</HysButton
        ><template #header
          ><HysInput
            v-model="note"
            placeholder="添加备注（不影响菜单键盘操作）"
            aria-label="菜单备注" /></template
        ><template #item="{ label }"
          ><strong>{{ label }}</strong></template
        ><template #footer="{ close }"
          ><HysButton size="sm" variant="ghost" @click="close()"
            >关闭菜单</HysButton
          ></template
        ></HysContextMenu
      >
    </div>
    <output class="state-output"
      >{{ result }} · {{ note || "尚无备注" }}</output
    >
    <p class="scenario-note">
      header / footer 可放置操作和输入；item、icon、link 可定制条目。link
      插槽提供 attrs，应绑定到可聚焦的链接或按钮，以保留键盘、禁用和事件行为。
    </p>
  </div>
</template>
