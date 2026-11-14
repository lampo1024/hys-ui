<script setup lang="ts">
import { ref } from "vue";
import {
  HysAccordion,
  HysSpreadsheet,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import { BookOpen } from "lucide-vue-next";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const guide = [{ id: "operations", title: "操作指南" }];

const workbook = ref<HysSpreadsheetWorkbook>({
  sheets: [
    {
      id: "plan",
      name: "月度预算",
      columnCount: 5,
      rows: [
        ["项目", "单价", "数量", "小计", "备注"],
        ["办公用品", 180, 6, "=B2*C2", "已报价"],
        ["培训课程", 800, 3, "=B3*C3", "待确认"],
        ["设备维护", 460, 2, "=B4*C4", "已报价"],
        ["合计", null, null, "=SUM(D2:D4)"],
      ],
      formats: {
        A1: { bold: true },
        B1: { bold: true },
        C1: { bold: true },
        D1: { bold: true },
        E1: { bold: true },
        D2: { number: "currency" },
        D3: { number: "currency" },
        D4: { number: "currency" },
        D5: { bold: true, number: "currency" },
      },
    },
    {
      id: "actual",
      name: "实际支出",
      rows: [
        ["项目", "金额", "备注"],
        ["办公用品", 1020, "已入账"],
        ["培训课程", 2100, "已入账"],
        ["合计", "=SUM(B2:B3)"],
      ],
    },
  ],
});
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet v-model="workbook" />
    <HysAccordion class="example-guide" :items="guide" :heading-level="4">
      <template #title="{ item }">
        <span class="guide-title"
          ><BookOpen :size="15" aria-hidden="true" />{{ item.title }}</span
        >
      </template>
      <template #content>
        <div class="guide-topics">
          <section>
            <h5>工具栏与编辑</h5>
            <ul>
              <li>
                点击工具栏右端的箭头展开第二行，空间不足时从「更多操作」找命令。点击全屏图标进入全屏，按
                <kbd>Esc</kbd> 返回。
              </li>
              <li>
                单击 <code>C2</code>，输入数量并按
                <kbd>Enter</kbd> 更新小计和合计。选中
                <code>B2</code> 后打开「单元格设置」，标题旁会显示坐标。
              </li>
              <li>
                拖选 <code>A2:E4</code>，按 <kbd>Ctrl</kbd> / <kbd>⌘</kbd> +
                <kbd>F</kbd>，在高级选项中选择「选区」，用
                <code>*报价</code> 查找状态。
              </li>
            </ul>
          </section>
          <section>
            <h5>排序与筛选</h5>
            <ul>
              <li>
                从 B
                列的排序图标选择「降序」，按单价排列。选择「取消排序」恢复原顺序。多列排序时，箭头旁的数字表示优先级。
              </li>
              <li>
                从 E
                列的筛选图标筛选「待确认」，也可从同一入口清除此列筛选。「数据与筛选」还提供去重与分组。
              </li>
              <li>
                按 D 列小计降序排列，合计仍在底部。用「小于 2000」筛选 D
                列，保留符合条件的明细和原合计金额。
              </li>
            </ul>
          </section>
          <section>
            <h5>行列调整</h5>
            <ul>
              <li>
                拖动 A 列右边缘或第 2
                行下边缘调整尺寸，双击边缘可自动适应。先选中多行再拖动，可统一行高。
              </li>
              <li>
                右键 B 列或行号 3，在插入命令旁填入 2，再点击命令或按
                <kbd>Enter</kbd>。也可从右键菜单直接设置列宽、行高或锁定行列。
              </li>
              <li>
                拖动 C 列悬停时出现的手柄到 B 列左半边，可交换列顺序。隐藏 B
                列后，点击缺口旁的双箭头可恢复。打开「行列与冻结」可冻结首行或显示隐藏列。
              </li>
            </ul>
          </section>
          <section>
            <h5>选区与工作表</h5>
            <ul>
              <li>
                从未选中的行号 2 拖到 4 可选中三行。从已选中的行号 3 拖到行号 1
                上方，仅移动第 3 行。
              </li>
              <li>
                在「实际支出」选中第 4 行，再拖到第 3 行上方。选中 B3 可看到公式变为
                <code>=SUM(B2,B4)</code>，合计仍为 3120。
              </li>
              <li>
                用 <kbd>Shift</kbd> 扩展行列选区，用 <kbd>Ctrl</kbd> /
                <kbd>⌘</kbd>
                点击行号或列标可从选区移除该项。再次点击单独选中的行列或按
                <kbd>Esc</kbd> 可取消选区。
              </li>
              <li>
                拖动「实际支出」标签到「月度预算」左侧可调整顺序。标签较多时，拖到标签栏边缘并停留可自动滚动。
              </li>
              <li>
                在「月度预算」和「实际支出」之间来回切换，观察滑动方向。通过工具栏的「工作表切换动效」可切换样式，窄屏时从「更多操作」打开。
              </li>
            </ul>
          </section>
          <section>
            <h5>单元格格式</h5>
            <ul>
              <li>
                选中
                <code>A2:A4</code>
                后点选字体或填充颜色。拖动色板时松手即应用，选择「无填充色」可清除底色。窄屏下可从「更多操作」找到字体和字号。
              </li>
              <li>
                选中
                <code>D2:D4</code>，打开「样式与条件格式」中的「条件格式」，输入
                1000 并点击「高亮较大值」。
              </li>
            </ul>
          </section>
        </div>
      </template>
    </HysAccordion>
  </div>
</template>

<style scoped>
.example-guide {
  min-inline-size: 0;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-bg);
  color: var(--docs-text);
}
.guide-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.guide-topics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 12px 24px;
}
.guide-topics section {
  min-inline-size: 0;
  padding-block-start: 10px;
  border-block-start: 1px solid var(--docs-border);
}
.guide-topics h5 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}
.guide-topics ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-inline-start: 1.25em;
  color: var(--docs-muted);
  font-size: 12px;
  line-height: 1.7;
}
.guide-topics :is(code, kbd) {
  color: var(--docs-text);
  white-space: nowrap;
}
</style>
