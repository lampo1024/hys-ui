<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton, type HysContextMenuInstance } from "hys-ui";
const menu = ref<HysContextMenuInstance>(),
  result = ref("尚未操作"),
  items = [
    {
      label: "导出",
      value: "export",
      children: [
        { label: "CSV", value: "csv" },
        { label: "PDF", value: "pdf" },
      ],
    },
    { label: "关闭文档", value: "close" },
  ];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="menu?.show()">实例展开</HysButton
      ><HysButton size="sm" @click="menu?.focusItem('pdf')"
        >定位到 PDF</HysButton
      ><HysButton size="sm" @click="menu?.closeSubmenus()">收起子菜单</HysButton
      ><HysButton size="sm" @click="menu?.hide(true)">关闭并还原焦点</HysButton>
    </div>
    <div class="demo-content">
      <HysContextMenu
        ref="menu"
        :items="items"
        trigger="click"
        @select="result = String($event)"
        ><HysButton>操作入口</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">{{ result }}</output>
    <p class="scenario-note">
      上下键、Home / End 定位条目；左右键进入和返回子菜单（RTL
      时相反）；输入首字母可快速定位，Enter / 空格执行，Esc 关闭。focusItem
      会展开目标的祖先菜单；showAt(x,y) 可按窗口坐标打开。
    </p>
  </div>
</template>
