<script setup lang="ts">
import { ref } from "vue";
import {
  HysDrawer,
  HysButton,
  HysSelect,
  HysCheckbox,
  type HysDrawerSectionSize,
} from "hys-ui";
const open = ref(false),
  header = ref<HysDrawerSectionSize>("md"),
  footer = ref<HysDrawerSectionSize>("sm"),
  withHeader = ref(true),
  align = ref<"start" | "center" | "end">("end"),
  sizes = ["sm", "md", "lg"].map((value) => ({ label: value, value })),
  alignments = ["start", "center", "end"].map((value) => ({
    label: value,
    value,
  }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>标题区尺寸</span
          ><HysSelect v-model="header" :options="sizes" /></label
        ><label class="demo-field"
          ><span>操作区尺寸</span
          ><HysSelect v-model="footer" :options="sizes" /></label
        ><label class="demo-field"
          ><span>操作对齐</span
          ><HysSelect v-model="align" :options="alignments"
        /></label>
      </div>
      <HysCheckbox v-model="withHeader" label="显示标题区" />
    </div>
    <div class="demo-control-actions">
      <HysButton @click="open = true">分区布局</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      title="标题与操作区独立设置"
      :header-size="header"
      :footer-size="footer"
      :footer-align="align"
      :with-header="withHeader"
      footer
      ><p>
        标题、正文和操作区分别设置样式；正文独立滚动，不影响底部按钮。隐藏标题区时仍保留关闭入口和辅助技术名称。
      </p></HysDrawer
    >
  </div>
</template>
