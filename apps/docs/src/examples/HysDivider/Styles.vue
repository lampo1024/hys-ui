<script setup lang="ts">
import { HysDivider, HysBadge } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <p>不带文字的分隔线</p>
    <HysDivider />
    <HysDivider label="实线" /><HysDivider
      border-style="dashed"
      label="虚线"
    /><HysDivider border-style="dotted" label="点线" /><HysDivider
      border-style="double"
      label="双线"
    /><HysDivider orientation="left" :orientation-margin="0" plain
      >靠左，无前置间距</HysDivider
    ><HysDivider orientation="right" orientation-margin="24px" size="lg"
      ><HysBadge tone="green">自定义内容</HysBadge></HysDivider
    >
  </div>
</template>
