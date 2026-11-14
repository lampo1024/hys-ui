<script setup lang="ts">
import { HysTooltip, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysTooltip trigger="hover" show-arrow
        ><HysButton variant="secondary">鼠标悬停</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip trigger="focus" show-arrow
        ><HysButton variant="secondary">键盘聚焦</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip trigger="click" show-arrow
        ><HysButton variant="secondary">点击切换</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip trigger="contextmenu" show-arrow
        ><HysButton variant="secondary">右键打开</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip :trigger="['hover', 'click']" show-arrow
        ><HysButton variant="secondary">悬停与点击组合</HysButton
        ><template #content
          >点击可固定显示，再次点击关闭。</template
        ></HysTooltip
      >
      <HysTooltip text="拖动开始后提示会收起。">
        <HysButton variant="secondary" draggable="true">拖动试试</HysButton>
      </HysTooltip>
    </div>
    <p class="scenario-note">
      支持悬停、焦点、点击、右键和组合触发；manual
      模式由宿主或实例方法控制。右键模式也可使用 Shift +
      F10。输入控件内的空格与回车保留原有输入行为。
    </p>
  </div>
</template>
