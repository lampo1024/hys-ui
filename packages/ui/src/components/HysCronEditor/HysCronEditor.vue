<script setup lang="ts">
import { computed, nextTick, onDeactivated, ref, useId, useModel, watch } from "vue";
import { useHysControlState } from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysDatePicker from "../HysDatePicker/HysDatePicker.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import CronComposer from "./CronComposer.vue";
import CronFieldBuilder from "./CronFieldBuilder.vue";
import { cronDefaults, cronFieldDescriptions, cronPresets, describeCron } from "./cronDescriptions";
import { cronRuns } from "./cronSchedule";
import { cronClock, cronRunFormatter } from "./cronTimeZone";
import { cronTokens, normalizeCron, parseCron } from "./cronValidation";

export type HysCronFormat = import("./cronValidation").CronFormat;
export interface HysCronPreset {
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{
  modelValue?: string;
  presets?: readonly HysCronPreset[];
  disabled?: boolean;
  readonly?: boolean;
  showFormatSelector?: boolean;
  showBuilder?: boolean;
  defaultMode?: "source" | "fields";
  showPreviewControls?: boolean;
  previewCount?: number;
}>(), { showFormatSelector: true, showBuilder: true, defaultMode: "source", showPreviewControls: true, previewCount: 0 });
const format = defineModel<HysCronFormat>("format", { default: "unix" });
const value = useModel(props, "modelValue");
const model = computed(() => value.value ?? cronDefaults[format.value]);
const timeZone = defineModel<string>("timeZone", { default: "UTC" });
const previewFrom = defineModel<Date | null>("previewFrom");
const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [expression: string];
  copy: [expression: string];
}>();

const hysRootAttrs = useHysRootAttrs();
const { disabled } = useHysControlState(props);
const messageId = useId();
const mode = ref(props.defaultMode);
const reference = ref(new Date());
const copyStatus = ref("");
const composerOpen = ref(false);
const composerTrigger = ref<InstanceType<typeof HysButton>>();
const locked = computed(() => disabled.value || props.readonly);
const result = computed(() => parseCron(model.value, format.value));
const error = computed(() => result.value.kind === "invalid" ? result.value.issue.message : "");
const summary = computed(() => describeCron(result.value));
const breakdown = computed(() => result.value.kind === "calendar" ? cronFieldDescriptions(result.value) : []);
const tokens = computed(() => cronTokens(model.value, format.value));
const presets = computed(() => (props.presets ?? cronPresets[format.value]).map(preset => ({ ...preset })));
const zoneValid = computed(() => !!cronClock(timeZone.value));
const start = computed(() => previewFrom.value ?? reference.value);
const validStart = computed(() => Number.isFinite(start.value.getTime()));
const count = computed(() => Number.isFinite(props.previewCount) ? Math.min(10, Math.max(0, Math.floor(props.previewCount))) : 0);
const runs = computed(() => count.value ? getNextRuns(start.value, count.value) : []);
const formatter = computed(() => zoneValid.value ? cronRunFormatter(timeZone.value, format.value === "quartz") : undefined);
const hasDayOr = computed(() => result.value.kind === "calendar" && format.value === "unix"
  && !result.value.fields.day.wildcard && !result.value.fields.weekday.wildcard);
const formatOptions = [
  { label: "Unix · 五段", value: "unix" },
  { label: "Quartz · 六或七段", value: "quartz" },
];
const modeOptions = [{ label: "表达式", value: "source" }, { label: "按字段", value: "fields" }] as const;
const zoneOptions = computed(() => {
  const common = ["UTC", "Asia/Shanghai", "Asia/Tokyo", "Asia/Singapore", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles"];
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return [...new Set([...common, timeZone.value, ...all])].map(value => ({ label: value, value }));
});

watch([model, format], () => {
  copyStatus.value = "";
  composerOpen.value = false;
});
watch([locked, () => props.showBuilder], ([isLocked, showBuilder]) => {
  if (isLocked || !showBuilder) composerOpen.value = false;
});
onDeactivated(() => { composerOpen.value = false; });

function update(expression: string) {
  if (locked.value || expression === model.value) return;
  value.value = expression;
  emit("change", expression);
}

function chooseFormat(value: unknown) {
  if (!locked.value && (value === "unix" || value === "quartz")) format.value = value;
}

function choosePreset(value: unknown) {
  if (typeof value === "string" && presets.value.some(preset => preset.value === value)) update(value);
}

function closeComposer() {
  composerOpen.value = false;
  void nextTick(() => composerTrigger.value?.focus());
}

function saveComposer(expression: string) {
  if (!composerOpen.value || locked.value) return;
  update(expression);
  closeComposer();
}

function getNextRuns(from = start.value, limit = count.value || 5) {
  const plan = result.value;
  return plan.kind === "calendar" ? cronRuns(plan, from, limit, timeZone.value) : [];
}

async function copy() {
  const value = model.value;
  if (disabled.value || !value.trim()) return;
  try {
    await navigator.clipboard.writeText(value);
    emit("copy", value);
    if (value === model.value) copyStatus.value = "已复制表达式";
  } catch {
    if (value === model.value) copyStatus.value = "无法访问剪贴板，可选中表达式手动复制";
  }
}

function resetReference() {
  if (disabled.value) return;
  reference.value = new Date();
  previewFrom.value = reference.value;
}

defineExpose({ validate: () => !error.value, describe: () => summary.value, getNextRuns });
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-cron-editor" :aria-disabled="disabled || undefined">
    <div class="hys-cron-toolbar">
      <div v-if="showFormatSelector" class="hys-cron-format">
        <HysSelect :model-value="format" :options="formatOptions" :disabled="locked" size="sm"
          aria-label="Cron 格式" @update:model-value="chooseFormat" />
      </div>
      <HysSegmented v-if="showBuilder" :model-value="mode" :options="modeOptions" :disabled="disabled"
        size="sm" aria-label="编辑方式" @update:model-value="value => { if (value) mode = value }" />
      <div v-if="presets.length" class="hys-cron-presets">
        <HysSelect :model-value="presets.some(preset => preset.value === model) ? model : undefined"
          :options="presets" size="sm" :disabled="locked" aria-label="常用预设" placeholder="常用预设"
          @update:model-value="choosePreset" />
      </div>
    </div>

    <div class="hys-cron-expression">
      <HysInput :model-value="model" size="sm" :disabled="disabled" :readonly="readonly"
        :status="error ? 'error' : undefined" aria-label="Cron 表达式" :aria-describedby="messageId"
        :input-props="{ spellcheck: false, autocapitalize: 'off' }"
        placeholder="输入 Cron 表达式" @update:model-value="update" />
      <div class="hys-cron-expression-actions">
        <HysPopover v-if="showBuilder" v-model:open="composerOpen" trigger="click" placement="bottom-end" show-arrow
          :disabled="locked" :width="548" max-width="calc(100vw - 24px)" max-height="var(--hys-cron-composer-max-height)"
          aria-label="Cron 可视化配置" content-class="hys-cron-composer-surface">
          <template #trigger>
            <HysButton ref="composerTrigger" size="sm" variant="secondary" :disabled="locked">可视化配置</HysButton>
          </template>
          <CronComposer v-if="composerOpen" :expression="model" :format="format" @save="saveComposer" @cancel="closeComposer" />
        </HysPopover>
        <HysButton size="sm" variant="ghost" :disabled="locked || normalizeCron(model) === model"
          @click="update(normalizeCron(model))">规范化</HysButton>
        <HysButton size="sm" variant="secondary" :disabled="disabled || !model.trim()" @click="copy">复制</HysButton>
      </div>
    </div>

    <p :id="messageId" class="hys-cron-summary" :class="{ 'hys-cron-error': error }" role="status">
      {{ error || summary }}
    </p>
    <small v-if="copyStatus" class="hys-cron-muted" role="status">{{ copyStatus }}</small>

    <CronFieldBuilder v-if="showBuilder && mode === 'fields'" :format="format" :tokens="tokens"
      :readonly="readonly" :disabled="disabled" @apply="value => update(value.join(' '))"
      @reset="update(cronDefaults[format])" />

    <dl v-if="breakdown.length && (!showBuilder || mode === 'source')" class="hys-cron-breakdown">
      <div v-for="field in breakdown" :key="field.key">
        <dt>{{ field.label }}</dt>
        <dd><code>{{ field.token }}</code><span v-if="field.meaning !== field.token">{{ field.meaning }}</span></dd>
      </div>
    </dl>
    <p v-if="hasDayOr" class="hys-cron-muted">日期和星期满足任一条件即可运行。</p>

    <section v-if="count && !error" class="hys-cron-preview" aria-label="下次运行">
      <div class="hys-cron-preview-heading">
        <strong>下次运行 <span>{{ timeZone }}</span></strong>
        <HysButton v-if="showPreviewControls" size="sm" variant="ghost" :disabled="disabled"
          @click="resetReference">从现在预览</HysButton>
      </div>
      <div v-if="showPreviewControls" class="hys-cron-preview-controls">
        <div class="hys-cron-control">
          <span>调度时区</span>
          <HysSelect :model-value="timeZone" :options="zoneOptions" filterable size="sm"
            :disabled="disabled" aria-label="调度时区"
            @update:model-value="value => { if (typeof value === 'string') timeZone = value }" />
        </div>
        <div class="hys-cron-control">
          <span>预览起点（本机时间）</span>
          <HysDatePicker :model-value="start" type="datetime" value-type="date" size="sm"
            :disabled="disabled" aria-label="预览起点"
            @update:model-value="value => { if (value instanceof Date) previewFrom = value }" />
        </div>
      </div>
      <p v-if="!zoneValid" class="hys-cron-error" role="status">请输入有效的时区名称。</p>
      <p v-else-if="!validStart" class="hys-cron-error" role="status">预览起点无效。</p>
      <p v-else-if="result.kind === 'reboot'" class="hys-cron-muted">运行时刻取决于调度服务何时启动。</p>
      <ol v-else-if="runs.length" class="hys-cron-runs">
        <li v-for="run in runs" :key="run.getTime()">
          <time :datetime="run.toISOString()">{{ formatter?.format(run) }}</time>
        </li>
      </ol>
      <p v-else class="hys-cron-muted">
        {{ format === 'quartz' && tokens.length === 7 ? '指定年份内没有未来运行时间。' : '未来五年内没有匹配时间。' }}
      </p>
    </section>
  </div>
</template>

<style src="./cronEditor.css"></style>
