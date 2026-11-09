<script setup lang="ts">
import { HysSkeleton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysSkeleton
      :count="3"
      avatar
      avatar-shape="square"
      :avatar-size="44"
      :title-width="'30%'"
      :lines="2"
      :widths="['90%', '55%']"
    /><HysSkeleton
      round
      :active="false"
      :title="false"
      :lines="2"
      :widths="['70%', '45%']"
    />
  </div>
  <p class="hint">
    count 重复整个占位模板，widths
    分别控制段落行宽。建议让占位接近真实内容的高度；active=false 适合静态占位。
  </p>
</template>
