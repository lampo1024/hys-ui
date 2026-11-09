<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton } from "hys-ui";
const visible = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div
      v-for="effect in ['light', 'dark', 'plain'] as const"
      :key="effect"
      class="demo-row"
    >
      <HysBadge
        v-for="tone in [
          'blue',
          'green',
          'orange',
          'red',
          'purple',
          'gray',
        ] as const"
        :key="tone"
        :tone="tone"
        :effect="effect"
        >{{ tone }}</HysBadge
      >
    </div>
    <div class="demo-row">
      <HysBadge size="sm">小尺寸</HysBadge><HysBadge size="md">中尺寸</HysBadge
      ><HysBadge size="lg" round>大尺寸圆角</HysBadge
      ><HysBadge color="#8b5c2a" effect="plain">自定义颜色</HysBadge>
    </div>
    <div class="demo-row">
      <HysBadge
        v-if="visible"
        closable
        close-text="移除"
        @close="visible = false"
        >可移除标签</HysBadge
      ><HysButton v-else size="sm" variant="secondary" @click="visible = true"
        >恢复标签</HysButton
      >
    </div>
  </div>
  <p class="hint">关闭事件交给调用方处理，便于同步列表数据或在移除前确认。</p>
</template>
