<script setup lang="ts">
import { ref } from "vue";
import {
  HysDrawer,
  HysButton,
  HysSelect,
  HysNumberInput,
  type HysDrawerPlacement,
} from "hys-ui";
const open = ref(false),
  effect = ref<"slide" | "fade" | "slide-fade" | "none">("slide"),
  duration = ref(240),
  placement = ref<HysDrawerPlacement>("right"),
  effects = ["slide", "fade", "slide-fade", "none"].map((value) => ({
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
          ><span>过渡效果</span
          ><HysSelect v-model="effect" :options="effects" /></label
        ><label class="demo-field"
          ><span>方向</span
          ><HysSelect v-model="placement" :options="placements" /></label
        ><label class="demo-field"
          ><span>时长（毫秒）</span
          ><HysNumberInput v-model="duration" :min="0" :max="1500" :step="40"
        /></label>
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="open = true">查看进入与退出动画</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      title="方向与动效"
      :transition="effect"
      :transition-duration="duration"
      :placement="placement"
      footer
      show-fullscreen
      ><p>
        进入和退出方向跟随
        placement；支持滑入、淡入、滑入与淡入组合以及关闭动效。时长设为
        0、全局关闭动效或系统开启减少动态效果时立即切换。
      </p></HysDrawer
    >
  </div>
</template>
