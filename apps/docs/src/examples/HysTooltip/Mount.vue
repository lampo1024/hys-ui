<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton } from "hys-ui";
const container = ref<HTMLElement>();
</script>
<template>
  <div class="demo-stack">
    <section ref="container" class="mount-area">
      <strong>自定义挂载容器</strong>
      <div class="demo-control-actions">
        <HysTooltip :append-to="false" trigger="click" show-arrow
          ><HysButton variant="secondary">原地挂载</HysButton
          ><template #content>这里展示辅助说明。</template></HysTooltip
        ><HysTooltip :append-to="container" trigger="click" show-arrow
          ><HysButton variant="secondary">挂载到容器</HysButton
          ><template #content>这里展示辅助说明。</template></HysTooltip
        >
      </div>
    </section>
    <p class="scenario-note">
      默认挂载到 body。可传元素、选择器或 false；原地挂载会受到祖先 overflow
      裁剪，适合已有定位容器的场景。
    </p>
  </div>
</template>
<style scoped>
.mount-area {
  position: relative;
  min-height: 170px;
  padding: 24px;
  border: 1px dashed var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}
</style>
