<script setup lang="ts">
import { ArrowDown } from "lucide-vue-next";
import { ref } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysSelect,
  type HysNumberTrigger,
} from "hys-ui";

const mode = ref<HysNumberTrigger>("visible");
const once = ref(true);
const allowed = ref(true);
const target = ref(320);
const count = ref(0);
const modes = [
  { value: "visible", label: "进入视口" },
  { value: "click", label: "点击或按键" },
  { value: "hover", label: "悬停或聚焦" },
  { value: "mount", label: "挂载" },
  { value: "update", label: "目标变化" },
];
const hints: Partial<Record<HysNumberTrigger, string>> = {
  click: "点击数字，或聚焦后按回车键播放。",
  hover: "将指针移到数字上，或用 Tab 聚焦播放。",
  mount: "切换到此方式时，数字重新挂载并播放。",
  update: "点击「更新目标」播放到新数值。",
};
</script>

<template>
  <div class="demo-stack demo-interaction">
    <div class="demo-input-toolbar">
      <label class="demo-toolbar-field">
        触发方式
        <HysSelect v-model="mode" :options="modes" />
      </label>
      <HysButton @click="target += 100">更新目标</HysButton>
      <div class="demo-toolbar-options">
        <HysCheckbox v-model="allowed" label="允许播放" />
        <HysCheckbox
          v-if="mode === 'visible'"
          v-model="once"
          label="视口仅触发一次"
        />
      </div>
    </div>
    <div class="demo-preview trigger-panel">
      <div
        :key="mode"
        class="demo-metric-preview trigger-preview"
        :class="{ 'trigger-scroll': mode === 'visible' }"
        :role="mode === 'visible' ? 'region' : undefined"
        :aria-label="mode === 'visible' ? '数字动画滚动预览' : undefined"
        :tabindex="mode === 'visible' ? 0 : undefined"
      >
        <div v-if="mode === 'visible'" class="trigger-prompt">
          <span class="trigger-prompt-icon" aria-hidden="true">
            <ArrowDown :size="18" />
          </span>
          <div>
            <strong>在框内向下滚动</strong>
            <p>数字出现后自动播放。</p>
          </div>
        </div>
        <div class="trigger-value">
          <HysAnimatedNumber
            title="当前销量"
            :from="0"
            :value="target"
            :duration="1400"
            :trigger="mode"
            :can-play="allowed"
            :visible-once="once"
            :pause-outside="mode === 'visible'"
            :value-style="{ fontSize: '2rem', fontWeight: 650 }"
            @start="count++"
          />
          <p v-if="hints[mode]">{{ hints[mode] }}</p>
        </div>
      </div>
      <dl class="demo-metric-stats">
        <div>
          <dt>目标销量</dt>
          <dd>{{ target }}</dd>
        </div>
        <div>
          <dt>播放次数</dt>
          <dd aria-live="polite">{{ count }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.trigger-preview {
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-surface);
}
.trigger-panel .demo-metric-stats {
  flex-basis: 10rem;
  max-inline-size: 16rem;
}
.trigger-scroll {
  block-size: 6.75rem;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.trigger-scroll:focus-visible {
  outline: 2px solid var(--hys-ui-primary);
  outline-offset: 2px;
}
.trigger-prompt,
.trigger-value {
  display: flex;
  min-block-size: 100%;
  align-items: center;
  padding: 0.75rem;
}
.trigger-prompt {
  gap: 0.75rem;
  color: var(--docs-text);
  font-size: 0.875rem;
}
.trigger-prompt-icon {
  display: grid;
  flex: 0 0 2rem;
  block-size: 2rem;
  place-items: center;
  border-radius: 8px;
  background: var(--docs-bg);
  color: var(--hys-ui-primary);
}
.trigger-value {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.375rem;
}
.trigger-scroll .trigger-value {
  border-block-start: 1px solid var(--docs-border);
}
.trigger-preview p {
  margin: 0;
  color: var(--docs-muted);
  font-size: 0.8rem;
}
</style>
