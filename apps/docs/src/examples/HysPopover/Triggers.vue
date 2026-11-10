<script setup lang="ts">
import { HysPopover, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysPopover trigger="hover" show-arrow title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">鼠标悬停</HysButton></template
        >这里展示辅助说明。</HysPopover
      ><HysPopover trigger="focus" show-arrow title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">键盘聚焦</HysButton></template
        >这里展示辅助说明。</HysPopover
      ><HysPopover trigger="click" show-arrow title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">点击切换</HysButton></template
        >这里展示辅助说明。</HysPopover
      ><HysPopover trigger="contextmenu" show-arrow title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">右键打开</HysButton></template
        >这里展示辅助说明。</HysPopover
      ><HysPopover :trigger="['hover', 'click']" show-arrow title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">悬停与点击组合</HysButton></template
        >点击可固定显示，再次点击关闭。</HysPopover
      >
    </div>
    <p class="scenario-note">
      支持悬停、焦点、点击、右键和组合触发；manual
      模式由宿主或实例方法控制。右键模式也可使用 Shift +
      F10。输入控件内的空格与回车保留原有输入行为。
    </p>
  </div>
</template>
