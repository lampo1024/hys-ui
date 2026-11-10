<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton, HysSelect, type Placement } from "hys-ui";
const placement = ref<Placement>("bottom-start"),
  selected = ref("尚未选择"),
  placements = [
    "bottom-start",
    "bottom-end",
    "top-start",
    "top-end",
    "left",
    "right",
  ].map((value) => ({ label: value, value })),
  items = Array.from({ length: 120 }, (_, i) => ({
    label: `操作 ${String(i + 1).padStart(3, "0")}`,
    value: i,
    description: i % 12 === 0 ? "支持滚动和键盘定位" : undefined,
  }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        ><span>浮层优先位置</span
        ><HysSelect v-model="placement" :options="placements"
      /></label>
    </div>
    <div class="demo-content">
      <HysContextMenu
        :placement="placement"
        :items="items"
        :width="280"
        :max-height="240"
        trigger="click"
        arrow
        @select="selected = '操作编号：' + $event"
        ><HysButton>长菜单与位置</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">{{ selected }}</output>
    <p class="scenario-note">
      maxHeight
      限制整个菜单的高度，条目区域独立滚动。宽度和位置受视口边界约束；appendTo=false
      可保留在宿主 DOM 中。长文本自动省略，完整内容保留在 title。
    </p>
  </div>
</template>
