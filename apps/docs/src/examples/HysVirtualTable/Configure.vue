<script setup lang="ts">
import { reactive } from "vue";
import { HysCheckbox, HysNumberInput, HysVirtualTable } from "hys-ui";
const config = reactive({
  height: 220,
  rowHeight: 40,
  overscan: 5,
  showHeader: true,
  fit: true,
  striped: false,
  bordered: false,
});
const rows = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  name: "交付事项 " + (i + 1),
  team: ["产品", "研发", "测试"][i % 3],
}));
const columns = [
  { key: "id", label: "编号", width: 72 },
  { key: "name", label: "交付事项", width: 210 },
  { key: "team", label: "团队", width: 110 },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>视口尺寸</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span class="demo-control-label">表体高度<code>height</code></span
            ><HysNumberInput
              v-model="config.height"
              :min="120"
              :max="480"
              :step="20"
              aria-label="表体高度"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label">行高<code>rowHeight</code></span
            ><HysNumberInput
              v-model="config.rowHeight"
              :min="28"
              :max="68"
              :step="4"
              aria-label="行高"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label">缓冲行<code>overscan</code></span
            ><HysNumberInput
              v-model="config.overscan"
              :min="0"
              :max="12"
              aria-label="缓冲行"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>表格外观</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.showHeader" label="显示表头" />
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.fit" label="填充剩余宽度" />
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.striped" label="交替行背景" />
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.bordered" label="显示列边线" />
          </div>
        </div>
      </section>
    </div>
    <HysVirtualTable
      v-bind="config"
      :rows="rows"
      :columns="columns"
      aria-label="可配置虚拟表格"
    />
    <p class="scenario-note">
      height 设置表体高度。表头和顶部固定行的高度会单独计入。
    </p>
  </div>
</template>
