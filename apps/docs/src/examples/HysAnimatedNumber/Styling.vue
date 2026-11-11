<script setup lang="ts">
import { ref } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  provideHysConfig,
  type HysAnimatedNumberContext,
  type HysTheme,
} from "hys-ui";
import { Activity } from "lucide-vue-next";

const theme = ref<HysTheme>("blue");
const custom = ref(false);
const announce = ref(false);
const value = ref(12500);
provideHysConfig({ theme });
const animationStyle = ({ progress }: HysAnimatedNumberContext) => ({
  textShadow: `0 0 ${Math.sin(progress * Math.PI) * 0.5}em var(--hys-ui-theme-primary)`,
});
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="value = value === 12500 ? 36800 : 12500"
        >刷新指标</HysButton
      >
      <HysCheckbox
        :model-value="theme === 'dark'"
        label="深色主题"
        @update:model-value="theme = $event ? 'dark' : 'blue'"
      />
      <HysCheckbox v-model="custom" label="自定义逐位渲染" />
      <HysCheckbox v-model="announce" label="朗读最终值" />
    </div>
    <div class="themed-preview" :data-dark="theme === 'dark'">
      <HysAnimatedNumber
        title="活跃用户"
        :value="value"
        compact="zh"
        :precision="2"
        unit="人"
        :effect="['flip', 'gradient']"
        :animation-style="animationStyle"
        :announce="announce"
        :duration="1100"
        class="styled-number"
        stable-width
      >
        <template #prefix><Activity :size="18" aria-hidden="true" /></template>
        <template v-if="custom" #digit="{ digit, position }">
          <strong
            class="custom-digit"
            :class="{ 'digit-tenths': position === 1 }"
            >{{ digit }}</strong
          >
        </template>
        <template #unit="{ unit }"
          ><small class="unit">{{ unit }}</small></template
        >
      </HysAnimatedNumber>
    </div>
  </div>
</template>

<style scoped>
.themed-preview {
  padding: 1rem;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: #f5f8ff;
  color: #172744;
}
.themed-preview[data-dark="true"] {
  background: #141e31;
  color: #e5efff;
}
.styled-number {
  --hys-number-font:
    650 clamp(1.55rem, 5vw, 2.75rem)/1.15 ui-monospace, monospace;
  --hys-number-digit-width: 0.8em;
  --hys-number-digit-radius: 0.12em;
  --hys-number-digit-bg: var(--hys-ui-theme-primary-soft);
  --hys-number-digit-border: 1px solid var(--hys-ui-theme-border);
  --hys-number-prefix-color: var(--hys-ui-theme-primary);
  --hys-number-separator-color: var(--hys-ui-theme-muted);
}
.custom-digit {
  font-weight: 750;
}
.digit-tenths {
  color: var(--hys-ui-theme-primary);
}
.unit {
  font-size: 0.45em;
  margin-inline-start: 0.35em;
}
</style>
