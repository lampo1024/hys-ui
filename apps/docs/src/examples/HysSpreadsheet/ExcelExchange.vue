<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  HysButton,
  HysSpreadsheet,
  type HysSpreadsheetInstance,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const initial: HysSpreadsheetWorkbook = {
  name: "报价单",
  sheets: [
    {
      id: "quote",
      name: "报价",
      frozenRows: 1,
      tabColor: "#345ec4",
      rows: [
        ["商品", "单价", "数量", "金额", "交付日期"],
        ["支架", 125, 4, "=B2*C2", "2026-12-01"],
        ["转接线", 18.5, 12, "=B3*C3", "2026-12-03"],
      ],
      cells: {
        C2: {
          type: "number",
          validation: { type: "number", min: 1, max: 500 },
        },
        D2: { note: "按单价和数量计算。" },
        E2: { type: "date" },
        E3: { type: "date" },
      },
      formats: {
        A1: { bold: true },
        B1: { bold: true },
        C1: { bold: true },
        D1: { bold: true },
        E1: { bold: true },
        D2: { number: "currency" },
        D3: { number: "currency" },
      },
    },
    {
      id: "summary",
      name: "汇总",
      rows: [["总报价", "=SUM('报价'!D2:D3)"]],
      formats: { B1: { number: "currency" } },
    },
  ],
};
const workbook = ref(initial);
const sheet = useTemplateRef<HysSpreadsheetInstance>("sheet");
const lastFile = ref<Blob>();
const busy = ref(false);
const status = ref("");
async function download() {
  if (!sheet.value) return;
  busy.value = true;
  try {
    const blob = await sheet.value.exportWorkbook();
    lastFile.value = blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "报价单.xlsx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    status.value = "已导出报价单.xlsx";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "导出失败";
  } finally {
    busy.value = false;
  }
}

async function reopen() {
  if (!sheet.value || !lastFile.value) return;
  busy.value = true;
  try {
    const file = new File([lastFile.value], "报价单.xlsx", {
      type: lastFile.value.type,
    });
    status.value = (await sheet.value.importWorkbook(file))
      ? "已重新导入，点击汇总查看总报价。"
      : "导入失败";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="demo-stack">
    <div class="file-actions" role="group" aria-label="报价单文件操作">
      <HysButton size="sm" :disabled="busy" @click="download"
        >下载报价单.xlsx</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="busy || !lastFile"
        @click="reopen"
        >重新导入刚导出的文件</HysButton
      >
      <span role="status">{{ status }}</span>
    </div>
    <HysSpreadsheet ref="sheet" v-model="workbook" />
    <p class="scenario-note">
      修改 C2
      的数量，再下载并重新导入。切换到“汇总”检查公式结果，或通过工作簿菜单打开自己的
      .xlsx 文件。
    </p>
  </div>
</template>

<style scoped>
.file-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.file-actions span {
  font-size: 13px;
  color: var(--hys-ui-theme-muted);
}
</style>
