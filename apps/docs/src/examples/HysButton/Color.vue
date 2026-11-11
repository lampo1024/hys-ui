<script setup lang="ts">
import { HysButton } from "hys-ui";
const color = "#a78bfa";
</script>

<template>
  <div class="button-color-demo">
    <div class="button-color-surface">
      <small>浅色背景</small>
      <div class="demo-row">
        <HysButton :color="color">填充</HysButton>
        <HysButton :color="color" plain>朴素</HysButton>
        <HysButton :color="color" text bg>文字底色</HysButton>
      </div>
    </div>
    <div class="button-color-surface button-color-surface-dark">
      <small>深色背景</small>
      <div class="demo-row">
        <HysButton :color="color" dark>填充</HysButton>
        <HysButton :color="color" dark plain>朴素</HysButton>
        <HysButton :color="color" dark text bg>文字底色</HysButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.button-color-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 235px), 1fr)); gap: 12px; }
.button-color-surface {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  background: #fff;
  color: #334155;
}
.button-color-surface-dark { background: #141414; color: #e2e8f0; border-color: #303030; }
</style>
