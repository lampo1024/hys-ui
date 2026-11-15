<script setup lang="ts">
import { computed } from "vue";
import HysInput from "../HysInput/HysInput.vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import { cronFieldChoices, type CronFieldDraft } from "./cronFieldDraft";
import { fieldInfo, type CronField, type CronFormat } from "./cronValidation";

const props = defineProps<{ field: CronField; format: CronFormat }>();
const draft = defineModel<CronFieldDraft>({ required: true });
const spec = computed(() => fieldInfo(props.field, props.format));
const choices = computed(() => cronFieldChoices(props.field, props.format));
const rule = computed(() => draft.value.mode);
const hasStart = computed(() => ["range", "interval", "monthEnd", "monthEndWorkday", "workday", "lastWeekday", "nthWeekday"].includes(rule.value));
const hasEnd = computed(() => rule.value === "range" || rule.value === "interval");
const offset = computed(() => rule.value === "monthEnd" || rule.value === "monthEndWorkday");
const startLabel = computed(() => {
  if (offset.value) return "距月末天数";
  if (rule.value === "workday") return "指定日期";
  if (rule.value === "lastWeekday" || rule.value === "nthWeekday") return "星期几";
  return rule.value === "interval" ? "起点（可选）" : "起点";
});

function set<K extends keyof CronFieldDraft>(key: K, value: CronFieldDraft[K]) {
  draft.value = { ...draft.value, [key]: value };
}
function selectNumber(key: "first" | "last", value: unknown) {
  set(key, typeof value === "string" ? Number(value) : null);
}
</script>

<template>
  <div v-if="hasStart || rule === 'list' || rule === 'custom'" class="hys-cron-rule-inputs">
    <div v-if="rule === 'interval'" class="hys-cron-rule-control">
      <span>每隔</span>
      <HysNumberInput :model-value="draft.step" size="sm" :min="1" :precision="0"
        :max="format === 'quartz' && field !== 'year' && draft.last == null ? spec.max : undefined"
        aria-label="步长" @update:model-value="set('step', $event)" />
    </div>
    <div v-if="rule === 'nthWeekday'" class="hys-cron-rule-control">
      <span>第几次</span>
      <HysNumberInput :model-value="draft.occurrence" size="sm" :min="1" :max="5" :precision="0"
        aria-label="星期出现次数" @update:model-value="set('occurrence', $event)" />
    </div>
    <div v-if="hasStart" class="hys-cron-rule-control">
      <span>{{ startLabel }}</span>
      <HysSelect v-if="field === 'weekday'" :model-value="draft.first == null ? null : String(draft.first)"
        :options="choices" size="sm" :list-height="168" :native-label-tooltip="false"
        :clearable="rule === 'interval'" :aria-label="startLabel"
        @update:model-value="selectNumber('first', $event)" />
      <HysNumberInput v-else :model-value="draft.first" size="sm"
        :min="offset ? rule === 'monthEnd' ? 1 : 0 : spec.min" :max="offset ? 30 : spec.max"
        :precision="0" :aria-label="startLabel" @update:model-value="set('first', $event)" />
    </div>
    <div v-if="hasEnd" class="hys-cron-rule-control">
      <span>{{ rule === 'interval' ? '终点（可选）' : '终点' }}</span>
      <HysSelect v-if="field === 'weekday'" :model-value="draft.last == null ? null : String(draft.last)"
        :options="choices" size="sm" :list-height="168" :native-label-tooltip="false"
        :clearable="rule === 'interval'" aria-label="终点"
        @update:model-value="selectNumber('last', $event)" />
      <HysNumberInput v-else :model-value="draft.last" size="sm" :min="spec.min" :max="spec.max"
        :precision="0" aria-label="终点" @update:model-value="set('last', $event)" />
    </div>
    <div v-if="rule === 'list'" class="hys-cron-rule-control hys-cron-rule-control-wide">
      <HysSelect :model-value="draft.multiple" :options="choices" size="sm" multiple filterable collapse-tags
        :list-height="168" :native-label-tooltip="false" placeholder="选择一个或多个值" aria-label="指定值"
        @update:model-value="value => { if (Array.isArray(value)) set('multiple', value.map(String)) }" />
    </div>
    <div v-if="rule === 'custom'" class="hys-cron-rule-control hys-cron-rule-control-wide">
      <HysInput :model-value="draft.custom" size="sm" aria-label="字段表达式" :validate-event="false"
        @update:model-value="set('custom', $event)" />
    </div>
  </div>
</template>
