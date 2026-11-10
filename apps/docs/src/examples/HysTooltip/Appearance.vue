<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton, HysCheckbox } from "hys-ui";
const arrow = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="arrow" label="显示箭头" />
    </div>
    <div class="demo-control-actions">
      <HysTooltip effect="light" :show-arrow="arrow"
        ><HysButton variant="secondary">浅色外观</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip effect="dark" :show-arrow="arrow"
        ><HysButton variant="secondary">深色外观</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip color="#146b57" text-color="#ffffff" :show-arrow="arrow"
        ><HysButton variant="secondary">自定义颜色</HysButton
        ><template #content
          >自定义颜色会同时应用到内容背景和箭头。</template
        ></HysTooltip
      >
    </div>
    <p class="scenario-note">
      浅色外观跟随当前 HYS UI
      主题；可分别设置浮层与内容区域的类名、样式和宽度约束。
    </p>
  </div>
</template>
