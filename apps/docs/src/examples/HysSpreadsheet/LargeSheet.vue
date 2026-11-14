<script setup lang="ts">
import { useTemplateRef } from "vue";
import { LocateFixed } from "lucide-vue-next";
import {
  HysButton,
  HysSpreadsheet,
  HysTooltip,
  type HysSpreadsheetInstance,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const spreadsheet = useTemplateRef<HysSpreadsheetInstance>("spreadsheet");
const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "daily",
      name: "每日订单",
      rows: Array.from({ length: 2000 }, (_, row) =>
        Array.from({ length: 36 }, (_, column) =>
          row === 0 ? `渠道 ${column + 1}` : (row * 17 + column * 13) % 450,
        ),
      ),
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet
      ref="spreadsheet"
      :default-workbook="workbook"
      :max-height="280"
    >
      <template #toolbar-actions>
        <HysTooltip text="定位末格" :show-delay="700" :trigger-keys="[]">
          <HysButton
            size="sm"
            variant="ghost"
            :icon="LocateFixed"
            aria-label="定位末格"
            @click="spreadsheet?.selectRange('AJ2000')"
          />
        </HysTooltip>
      </template>
    </HysSpreadsheet>
    <p class="scenario-note">
      滚动查看 2,000 行、36
      列的订单数据。点击第 2 行的行号选中，再按住同一个行号拖到表格下边缘。停留时表格会继续向下滚动，松手即可按插入线将这行移到新位置，可用「撤销」恢复。通过名称框或「定位末格」可跳到屏幕外的单元格。
    </p>
  </div>
</template>
