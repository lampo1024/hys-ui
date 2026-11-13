<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  HysSpin,
  hysSpinAnimations,
  type HysSpinAnimation,
} from "hys-ui";
const selected = ref<HysSpinAnimation>("dual-ring"),
  speed = ref(1),
  duration = ref(900),
  angle = ref(360),
  reverse = ref(false),
  active = ref(true);
const sample = ref<InstanceType<typeof HysSpin>>();
const choices = hysSpinAnimations.map(({ label, name }) => ({
  label,
  value: name,
}));
const settings = computed(() => ({
  speed: speed.value,
  animationDuration: duration.value,
  angle: angle.value,
  direction: reverse.value ? ("reverse" as const) : ("normal" as const),
}));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >动画预设<HysSelect
            v-model="selected"
            :options="choices"
            aria-label="动画预设"
        /></label>
        <label class="demo-field"
          >速度倍数<HysNumberInput
            v-model="speed"
            :min="0.2"
            :max="4"
            :step="0.1"
            :precision="1"
        /></label>
        <label class="demo-field"
          >循环时长（ms）<HysNumberInput
            v-model="duration"
            :min="100"
            :max="4000"
            :step="100"
        /></label>
        <label class="demo-field"
          >旋转角度<HysNumberInput
            v-model="angle"
            :min="-720"
            :max="720"
            :step="45"
        /></label>
      </div>
    </div>
    <div class="demo-panel spin-preview">
      <HysSpin
        ref="sample"
        mode="indicator"
        :animation="selected"
        size="xl"
        v-bind="settings"
        :animation-name="
          selected === 'custom' ? 'hys-doc-spin-diamond' : undefined
        "
      >
        <template v-if="selected === 'custom'" #indicator>
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 3l15 15-15 15L3 18Z"
              stroke="currentColor"
              stroke-width="3"
            />
          </svg>
        </template>
      </HysSpin>
      <div class="demo-control-actions">
        <HysButton size="sm" variant="secondary" @click="sample?.pause()"
          >暂停</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="sample?.resume()"
          >继续</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="sample?.stop()"
          >停止</HysButton
        >
        <HysButton size="sm" variant="secondary" @click="sample?.restart()"
          >重播</HysButton
        >
        <HysCheckbox v-model="reverse" label="逆时针" />
      </div>
    </div>
    <HysCheckbox v-model="active" label="播放预设预览" />
    <div class="spin-animation-grid">
      <button
        v-for="item in hysSpinAnimations"
        :key="item.name"
        type="button"
        :aria-pressed="selected === item.name"
        @click="selected = item.name"
      >
        <HysSpin
          mode="indicator"
          size="md"
          :animation="item.name"
          :animated="active"
          :animation-name="
            item.name === 'custom' ? 'hys-doc-spin-diamond' : undefined
          "
        >
          <template v-if="item.name === 'custom'" #indicator>◇</template>
        </HysSpin>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.spin-preview {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.spin-animation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 94px), 1fr));
  gap: 6px;
}
.spin-animation-grid button {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 6px;
  min-height: 70px;
  border: 1px solid var(--docs-border);
  border-radius: 7px;
  background: var(--docs-surface);
  color: var(--docs-text);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.spin-animation-grid button[aria-pressed="true"] {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--docs-bg);
}
</style>
<style>
@keyframes hys-doc-spin-diamond {
  50% {
    transform: rotate(45deg) scale(0.7);
    opacity: 0.45;
  }
  100% {
    transform: rotate(90deg);
  }
}
</style>
