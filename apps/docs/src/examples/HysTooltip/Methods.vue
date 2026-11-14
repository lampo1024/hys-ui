<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton, type HysPopupSurfaceInstance } from "hys-ui";
const instance = ref<HysPopupSurfaceInstance>();
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="instance?.show()">展开</HysButton
      ><HysButton variant="secondary" @click="instance?.hide()">收起</HysButton
      ><HysButton variant="secondary" @click="instance?.toggle()"
        >切换</HysButton
      ><HysButton variant="ghost" @click="instance?.updatePosition()"
        >重新定位</HysButton
      ><HysButton variant="ghost" @click="instance?.focus({ suppressTooltip: true })"
        >收起并聚焦参考元素</HysButton
      >
    </div>
    <div class="demo-content">
      <HysTooltip
        ref="instance"
        trigger="manual"
        :close-on-outside="false"
        text="由实例方法打开的提示。"
        show-arrow
        ><HysButton variant="secondary">定位参考</HysButton></HysTooltip
      >
    </div>
    <p class="scenario-note">
      show、hide、close 和 toggle 返回请求是否被接受；受控模式下同样由宿主决定。
      使用 <code>focus({ suppressTooltip: true })</code> 恢复焦点时会取消待显示的提示并收起已显示的提示。
    </p>
  </div>
</template>
