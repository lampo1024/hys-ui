<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, type HysPopupSurfaceInstance } from "hys-ui";
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
      >
    </div>
    <div class="demo-content">
      <HysPopover
        ref="instance"
        trigger="manual"
        :close-on-outside="false"
        title="由实例控制"
        content="可通过实例方法更新位置、聚焦触发器或请求关闭。"
        show-arrow
        ><template #trigger
          ><HysButton variant="secondary">定位参考</HysButton></template
        ></HysPopover
      >
    </div>
    <p class="scenario-note">
      show、hide、close 和 toggle 返回请求是否被接受；受控模式下同样由宿主决定。
    </p>
  </div>
</template>
