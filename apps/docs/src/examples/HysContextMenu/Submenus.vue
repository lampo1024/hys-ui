<script setup lang="ts">
import { ref } from "vue";
import { Copy, Download, FileText, Trash2 } from "lucide-vue-next";
import {
  HysContextMenu,
  HysButton,
  HysCheckbox,
  type HysContextMenuItem,
  type HysMenuSelectInfo,
} from "hys-ui";
const clickOnly = ref(false),
  rtl = ref(false),
  result = ref("尚未操作");
const items: HysContextMenuItem[] = [
  {
    label: "文档操作",
    type: "group",
    children: [
      { label: "复制链接", value: "copy", icon: Copy, shortcut: "Ctrl+C" },
      {
        label: "导出",
        value: "export",
        icon: Download,
        children: [
          { label: "PDF 文档", value: "pdf", icon: FileText },
          {
            label: "表格",
            value: "sheet",
            children: [
              { label: "CSV 文件", value: "csv" },
              { label: "Excel 文件", value: "xlsx" },
            ],
          },
        ],
      },
    ],
  },
  { type: "divider", label: "" },
  { label: "删除文档", value: "delete", icon: Trash2, danger: true },
  { label: "暂不可用", value: "blocked", disabled: true },
];
function select(_value: string | number, info: HysMenuSelectInfo) {
  result.value = info.path.map((item) => item.label).join(" / ");
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="clickOnly" label="点击展开子菜单" /><HysCheckbox
        v-model="rtl"
        label="从右向左布局"
      />
    </div>
    <div class="demo-content">
      <HysContextMenu
        trigger="click"
        :items="items"
        :submenu-trigger="clickOnly ? 'click' : 'hover'"
        :direction="rtl ? 'rtl' : 'ltr'"
        @select="select"
        ><HysButton>文档操作</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">{{ result }}</output>
    <p class="scenario-note">
      子菜单支持悬停延迟、点击及左右方向键。靠近屏幕边缘时自动换侧；小屏幕以逐级菜单展示，并提供返回入口。分组、分隔线和禁用项不参与键盘定位。
    </p>
  </div>
</template>
