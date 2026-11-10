<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, HysNumberInput } from "hys-ui";
const width = ref(500),
  maximum = ref(280),
  height = ref(160);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>宽度</span
          ><HysNumberInput
            v-model="width"
            :min="160"
            :max="800"
            :step="20" /></label
        ><label class="demo-field"
          ><span>最大宽度</span
          ><HysNumberInput
            v-model="maximum"
            :min="160"
            :max="800"
            :step="20" /></label
        ><label class="demo-field"
          ><span>内容最大高度</span
          ><HysNumberInput v-model="height" :min="80" :max="500" :step="20"
        /></label>
      </div>
    </div>
    <HysPopover
      :width="width"
      :max-width="maximum"
      :max-height="height"
      trigger="click"
      enterable
      show-arrow
      title="尺寸与滚动约束"
      ><template #trigger
        ><HysButton variant="secondary">尺寸与滚动内容</HysButton></template
      >
      <div>
        <p v-for="index in 24" :key="index">
          第
          {{ index }} 条说明：内容较多时在内部滚动，尺寸约束和箭头定位保持稳定。
        </p>
      </div></HysPopover
    >
    <p class="scenario-note">
      宽度超过最大宽度时按上限展示；长内容独立滚动，并同时遵守视口边界。
    </p>
  </div>
</template>
