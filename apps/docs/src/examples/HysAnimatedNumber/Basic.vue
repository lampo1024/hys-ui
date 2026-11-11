<script setup lang="ts">
import { ref } from "vue";
import { HysAnimatedNumber, HysButton } from "hys-ui";

const target = ref(128.5);
</script>

<template>
  <div class="demo-stack">
    <HysAnimatedNumber
      v-model="target"
      title="本期净增"
      :from="0"
      :precision="2"
      :value-style="{ fontSize: '2rem', fontWeight: 650 }"
      group-separator=","
      suffix="单"
      color-by-sign
      stable-width
    />
    <div class="demo-control-actions">
      <HysButton size="sm" @click="target += 137.25">增加 137.25</HysButton>
      <HysButton size="sm" variant="secondary" @click="target -= 300.5"
        >减少 300.50</HysButton
      >
      <HysButton size="sm" variant="ghost" @click="target = 0">归零</HysButton>
    </div>
  </div>
</template>
