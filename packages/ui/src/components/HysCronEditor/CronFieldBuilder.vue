<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import { fieldInfo, fieldOrder, type CronField, type CronFormat } from "./cronValidation";
import { cronFieldChoices, newCronFieldDraft, readCronFieldDraft, updateCronField, writeCronFieldDraft, type CronRule } from "./cronFieldDraft";

const props = defineProps<{
  format: CronFormat;
  tokens: string[];
  readonly?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ apply: [tokens: string[]]; reset: [] }>();
const selected = ref<CronField>("minute");
const key = computed(() => fieldOrder(props.format, props.tokens.length === 7));
const ready = computed(() => key.value.length === props.tokens.length);
const index = computed(() => key.value.indexOf(selected.value));
const token = computed(() => props.tokens[index.value] ?? "");
const info = computed(() => fieldInfo(selected.value, props.format));
const locked = computed(() => props.disabled || props.readonly);
const fieldDraft = reactive(newCronFieldDraft("minute", props.format, "any"));
const { mode, first, last, step, occurrence, custom, multiple } = toRefs(fieldDraft);
const baseOptions: { value: CronRule; label: string }[] = [
  { value: "any", label: "任意" },
  { value: "value", label: "固定值" },
  { value: "list", label: "多个值" },
  { value: "range", label: "范围" },
  { value: "interval", label: "步长" },
];
const modes = computed(() => {
  const options = [...baseOptions];
  if (props.format === "quartz" && [ "day", "weekday" ].includes(selected.value)) {
    options.push({ value: "skip", label: "不指定（?）" });
    if (selected.value === "day") {
      options.push(
        { value: "lastDay", label: "月末最后一天" },
        { value: "monthEnd", label: "月末或倒数第几天" },
        { value: "workday", label: "最接近指定日期的工作日" },
        { value: "monthEndWorkday", label: "最接近月末的工作日" },
      );
    } else {
      options.push(
        { value: "lastWeekday", label: "每月最后一个指定星期" },
        { value: "nthWeekday", label: "每月第几个指定星期" },
      );
    }
  }
  options.push({ value: "custom", label: "自定义" });
  return options;
});
const values = computed(() => cronFieldChoices(selected.value, props.format));

watch(key, fields => {
  if (!fields.includes(selected.value)) selected.value = "minute";
});
watch([selected, token, () => props.format], ([field, value, format]) => {
  Object.assign(fieldDraft, readCronFieldDraft(field, format, value));
}, { immediate: true });

function pickMode(value: unknown) {
  const next = modes.value.find(option => option.value === value)?.value;
  if (!next || locked.value) return;
  Object.assign(fieldDraft, newCronFieldDraft(selected.value, props.format, next, token.value));
}

const draft = computed(() => writeCronFieldDraft(selected.value, props.format, fieldDraft));
const showsNumber = computed(() => ["value", "range", "interval", "monthEnd", "workday"].includes(mode.value));
const showsWeekday = computed(() => ["lastWeekday", "nthWeekday"].includes(mode.value));
function apply() {
  if (locked.value || !draft.value || /\s/.test(draft.value) || !ready.value || index.value < 0) return;
  emit("apply", updateCronField(props.tokens, props.format, selected.value, draft.value));
}
</script>

<template>
  <div v-if="!ready" class="hys-cron-builder">
    <p class="hys-cron-muted">当前表达式无法拆分为字段。可以切回表达式修正，或从模板开始。</p>
    <HysButton size="sm" variant="secondary" :disabled="locked" @click="emit('reset')">使用当前格式的模板</HysButton>
  </div>
  <section v-else class="hys-cron-builder" aria-label="Cron 字段配置">
    <div class="hys-cron-field-nav">
      <HysButton v-for="(field, i) in key" :key="field" size="sm"
        :variant="selected === field ? 'secondary' : 'ghost'" :disabled="disabled"
        :aria-pressed="selected === field" @click="selected = field">
        {{ fieldInfo(field, format).label }} <code>{{ tokens[i] }}</code>
      </HysButton>
      <HysButton v-if="format === 'quartz'" size="sm" variant="ghost" :disabled="locked"
        @click="emit('apply', tokens.length === 7 ? tokens.slice(0, 6) : [...tokens, '*'])">
        {{ tokens.length === 7 ? '移除年份' : '添加年份' }}
      </HysButton>
    </div>
    <div class="hys-cron-field-options">
      <div class="hys-cron-control">
        <span>{{ info.label }}规则</span>
        <HysSelect size="sm" :model-value="mode" :options="modes" :disabled="locked"
          :aria-label="info.label + '规则'" @update:model-value="pickMode" />
      </div>
      <div v-if="showsNumber" class="hys-cron-control">
        <span>{{ mode === 'monthEnd' ? '月末偏移天数' : mode === 'range' ? '起点' : mode === 'interval' ? '起点（可留空）' : '取值' }}</span>
        <HysNumberInput v-model="first" size="sm" :min="mode === 'monthEnd' ? 0 : info.min"
          :max="mode === 'monthEnd' ? 30 : info.max" :precision="0" :disabled="locked" aria-label="字段起点" />
      </div>
      <div v-if="mode === 'range' || mode === 'interval'" class="hys-cron-control">
        <span>{{ mode === 'interval' ? '终点（可留空）' : '终点' }}</span>
        <HysNumberInput v-model="last" size="sm" :min="info.min" :max="info.max" :precision="0" :disabled="locked" aria-label="字段终点" />
      </div>
      <div v-if="mode === 'interval'" class="hys-cron-control">
        <span>步长</span>
        <HysNumberInput v-model="step" size="sm" :min="1" :max="format === 'quartz' && selected !== 'year' && last == null ? info.max : undefined"
          :precision="0" :disabled="locked" aria-label="字段步长" />
      </div>
      <div v-if="mode === 'list'" class="hys-cron-control">
        <span>可选值</span>
        <HysSelect size="sm" :model-value="multiple" :options="values" multiple filterable collapse-tags
          :disabled="locked" aria-label="字段可选值" @update:model-value="value => { if (Array.isArray(value)) multiple = value.map(String) }" />
      </div>
      <div v-if="showsWeekday" class="hys-cron-control">
        <span>星期</span>
        <HysSelect size="sm" :model-value="String(first)" :options="values" :disabled="locked"
          aria-label="指定星期" @update:model-value="value => { if (typeof value === 'string') first = Number(value) }" />
      </div>
      <div v-if="mode === 'nthWeekday'" class="hys-cron-control">
        <span>第几次出现</span>
        <HysNumberInput v-model="occurrence" size="sm" :min="1" :max="5" :precision="0" :disabled="locked"
          aria-label="星期出现次数" />
      </div>
      <div v-if="mode === 'custom'" class="hys-cron-control">
        <span>字段表达式</span>
        <HysInput v-model="custom" size="sm" :disabled="locked" :validate-event="false" aria-label="字段表达式" @press-enter="apply" />
      </div>
      <HysButton size="sm" :disabled="locked || !draft || /\s/.test(draft)" @click="apply">应用字段</HysButton>
    </div>
  </section>
</template>
