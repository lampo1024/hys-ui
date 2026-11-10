<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, HysSelect } from "hys-ui";
const value = ref("alpha"),
  options = [
    { label: "方案 Alpha", value: "alpha" },
    { label: "方案 Beta", value: "beta" },
  ];
</script>
<template>
  <div class="demo-stack">
    <HysPopover
      trigger="hover"
      :hide-delay="200"
      :width="300"
      title="快捷设置"
      show-arrow
      ><template #trigger><HysButton>悬停进入快捷设置</HysButton></template
      ><template #default="{ close }"
        ><div class="demo-stack">
          <HysSelect v-model="value" :options="options" /><HysButton
            @click="close"
            >完成设置</HysButton
          >
        </div></template
      ></HysPopover
    ><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      移入内容可继续操作。子选择浮层与父浮层分别处理 Escape，避免一起关闭。
    </p>
  </div>
</template>
