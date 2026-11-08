<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented } from "hys-ui";
const view = ref("总览"),
  options = ["总览", "进行中", "已完成"];
</script>
<template>
  <div class="demo-content">
    <div class="demo-stack">
      <HysSegmented
        v-model="view"
        :options="options"
        block
        aria-label="铺满布局"
      /><HysSegmented
        v-model="view"
        :options="options"
        round
        size="sm"
        aria-label="圆角布局"
      />
      <div style="max-width: 240px">
        <HysSegmented
          v-model="view"
          :options="options"
          direction="vertical"
          block
          aria-label="纵向布局"
        />
      </div>
      <HysSegmented
        v-model="view"
        :options="options"
        size="lg"
        aria-label="大尺寸布局"
      />
    </div>
    <output>{{ view }}</output>
  </div>
</template>
