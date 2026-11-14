<script setup lang="ts">
import { computed, useId } from "vue";
import { useHysRootAttrs } from "../../config";
import { nextCronRuns, validateCron } from "./cronValidation";

export interface HysCronPreset {
  label: string;
  value: string;
}
const props = defineProps<{
  presets?: readonly HysCronPreset[];
  disabled?: boolean;
  readonly?: boolean;
  previewCount?: number;
  previewFrom?: Date;
}>();
const model = defineModel<string>({ default: "0 0 * * *" });
const hysRootAttrs = useHysRootAttrs();
const messageId = useId();
const error = computed(() => validateCron(model.value));
const previewCount = computed(() => typeof props.previewCount === "number" && Number.isFinite(props.previewCount)
  ? Math.min(10, Math.max(0, Math.floor(props.previewCount))) : 0);
const reference = new Date();
const runs = computed(() => previewCount.value && !error.value
  ? nextCronRuns(model.value, props.previewFrom ?? reference, previewCount.value) : []);
const builtIn = [
  { label: "每小时", value: "0 * * * *" },
  { label: "每天 09:00", value: "0 9 * * *" },
  { label: "每周一 09:00", value: "0 9 * * 1" },
  { label: "每月 1 日", value: "0 0 1 * *" },
];
function choose(value: string) {
  if (!props.disabled && !props.readonly) model.value = value;
}
defineExpose({ validate: () => error.value === "" });
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <div v-if="(presets ?? builtIn).length" class="hys-ui-ent-toolbar">
      <button
        v-for="preset in presets ?? builtIn"
        :key="preset.label"
        type="button"
        :disabled="disabled || readonly"
        :aria-pressed="model === preset.value"
        @click="choose(preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>
    <label class="hys-ui-ent-field">
      <span>标准五段 Cron 表达式</span>
      <input
        v-model="model"
        aria-label="Cron 表达式"
        :aria-describedby="messageId"
        :aria-invalid="!!error"
        :disabled="disabled"
        :readonly="readonly"
        spellcheck="false"
      />
    </label>
    <small
      :id="messageId"
      :class="error ? 'hys-ui-ent-error' : 'hys-ui-ent-ok'"
      >{{ error || "五段表达式格式有效" }}</small
    >
    <div v-if="previewCount && !error" class="hys-cron-runs">
      <strong>下次运行 · UTC</strong>
      <ol v-if="runs.length">
        <li v-for="run in runs" :key="run.getTime()">
          <time :datetime="run.toISOString()">{{ run.toISOString().slice(0, 16).replace('T', ' ') }}</time>
        </li>
      </ol>
      <p v-else>未来五年内没有匹配时间。</p>
    </div>
  </div>
</template>
<style scoped>
.hys-cron-runs { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--hys-ui-theme-border); font-size: 13px; }
.hys-cron-runs ol { margin: 6px 0 0; padding-inline-start: 1.5em; font-variant-numeric: tabular-nums; }
</style>
