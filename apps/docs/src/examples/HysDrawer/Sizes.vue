<script setup lang="ts">
import { ref } from "vue";
import {
  HysDrawer,
  HysButton,
  HysSelect,
  HysCheckbox,
  HysNumberInput,
  type HysDrawerSizeName,
  type HysDrawerPlacement,
} from "hys-ui";
const open = ref(false),
  size = ref<HysDrawerSizeName>("md"),
  placement = ref<HysDrawerPlacement>("right"),
  custom = ref(false),
  length = ref(560);
const sizes = ["xs", "sm", "md", "lg", "xl", "full"].map((value) => ({
    label: value,
    value,
  })),
  placements = ["left", "right", "top", "bottom"].map((value) => ({
    label: value,
    value,
  }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>预设尺寸</span
          ><HysSelect v-model="size" :options="sizes" /></label
        ><label class="demo-field"
          ><span>方向</span
          ><HysSelect v-model="placement" :options="placements" /></label
        ><label class="demo-field"
          ><span>自定义长度（px）</span
          ><HysNumberInput v-model="length" :min="200" :max="1000" :step="20"
        /></label>
      </div>
      <HysCheckbox v-model="custom" label="使用自定义长度" />
    </div>
    <div class="demo-control-actions">
      <HysButton @click="open = true">查看尺寸</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      :placement="placement"
      :size="size"
      :width="custom ? length : undefined"
      title="尺寸与视口约束"
      footer
      ><p>
        横向抽屉控制宽度，纵向抽屉优先使用 height；未提供 height 时沿用 width 或
        size。尺寸始终限制在容器内。
      </p></HysDrawer
    >
    <p class="scenario-note">
      预设为 xs、sm、md、lg、xl、full，默认 md 保持 520px。size
      也可直接使用数值或 CSS 长度；显式 width / height 优先。
    </p>
  </div>
</template>
