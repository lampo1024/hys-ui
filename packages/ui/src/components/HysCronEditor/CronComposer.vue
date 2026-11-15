<script setup lang="ts">
import { computed, provide, reactive, ref, type InjectionKey } from "vue";
import { fieldKey, type HysFieldContext } from "../../composables/formContext";
import HysButton from "../HysButton/HysButton.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import HysRadioGroup from "../HysRadioGroup/HysRadioGroup.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysTabs from "../HysTabs/HysTabs.vue";
import CronRuleInputs from "./CronRuleInputs.vue";
import { cronDefaults, describeCron } from "./cronDescriptions";
import { cronComposerRuleGroups, cronComposerTabs, type CronComposerTab } from "./cronComposerRules";
import { newCronFieldDraft, readCronFieldDraft, updateCronField, writeCronFieldDraft, type CronFieldDraft } from "./cronFieldDraft";
import { cronTokens, fieldOrder, parseCron, type CronField, type CronFormat } from "./cronValidation";

const props = defineProps<{ expression: string; format: CronFormat }>();
const emit = defineEmits<{ save: [expression: string]; cancel: [] }>();
provide(fieldKey as InjectionKey<HysFieldContext | undefined>, undefined);
type FieldEdit = { field: CronField; draft: CronFieldDraft };

const tabs = computed(() => cronComposerTabs(props.format));
const selected = ref<CronComposerTab>(tabs.value[0].value);
const selectedDay = ref<"day" | "weekday">();
const edits = reactive<Partial<Record<CronField, CronFieldDraft>>>({});
const original = computed(() => cronTokens(props.expression, props.format));
const fields = computed(() => fieldOrder(props.format, true));
const canReadFields = computed(() => fieldOrder(props.format, original.value.length === 7).length === original.value.length);
const base = computed(() => canReadFields.value ? original.value : cronTokens(cronDefaults[props.format], props.format));
const tokenFor = (field: CronField) => base.value[fields.value.indexOf(field)] ?? "";
const groups = computed(() => cronComposerRuleGroups(selected.value, props.format));
const options = computed(() => groups.value.flatMap(group => group.options));

const active = computed<FieldEdit>(() => {
  const preferWeekday = tokenFor("day") === "?" || props.format === "unix" && tokenFor("day") === "*" && tokenFor("weekday") !== "*";
  const field = selected.value === "day" ? selectedDay.value ?? (preferWeekday ? "weekday" : "day") : selected.value;
  const pending = edits[field];
  if (pending) return { field, draft: pending };
  const draft = readCronFieldDraft(field, props.format, tokenFor(field), true);
  if (selected.value === "day" && field === "weekday" && draft.mode === "any") {
    return { field: "day", draft: newCronFieldDraft("day", props.format, "any") };
  }
  if (!options.value.some(option => option.field === field && option.mode === draft.mode)) draft.mode = "custom";
  return { field, draft };
});
const rule = computed(() => active.value.field + ":" + active.value.draft.mode);
const dirty = computed(() => Object.keys(edits).length > 0);
const generated = computed(() => {
  let tokens = base.value;
  for (const field of fields.value) {
    const draft = edits[field];
    if (!draft) continue;
    const token = writeCronFieldDraft(field, props.format, draft);
    if ((!token && draft.mode !== "omit") || /\s/.test(token)) {
      const tab = tabs.value.find(item => item.value === (field === "weekday" ? "day" : field));
      return { expression: "", issue: "请完善「" + tab?.label + "」的配置。" };
    }
    tokens = updateCronField(tokens, props.format, field, token);
  }
  const expression = !dirty.value && canReadFields.value ? props.expression : tokens.join(" ");
  const parsed = parseCron(expression, props.format);
  return parsed.kind === "invalid"
    ? { expression, issue: parsed.issue.message }
    : { expression, issue: "", description: describeCron(parsed) };
});

function selectTab(value: unknown) {
  const tab = tabs.value.find(item => item.value === value);
  if (tab) selected.value = tab.value;
}
function selectRule(value: string) {
  const option = options.value.find(item => item.value === value);
  if (!option) return;
  if (props.format === "unix" && option.field === "day" && option.mode === "any") {
    edits.weekday = newCronFieldDraft("weekday", props.format, "any");
  }
  const existing = edits[option.field] ?? readCronFieldDraft(option.field, props.format, tokenFor(option.field), true);
  if (existing.mode === option.mode) {
    stage(option.field, existing);
    return;
  }
  const draft = newCronFieldDraft(option.field, props.format, option.mode, tokenFor(option.field));
  if (option.field === "year" && (option.mode === "range" || option.mode === "interval")) {
    draft.first = Math.min(2099, Math.max(1970, new Date().getUTCFullYear()));
    if (option.mode === "range") draft.last = draft.first;
  }
  stage(option.field, draft);
}
function stage(field: CronField, draft: CronFieldDraft) {
  if (field === "day" || field === "weekday") {
    selectedDay.value = field;
    if (props.format === "quartz") delete edits[field === "day" ? "weekday" : "day"];
  }
  edits[field] = draft;
}
function changeDraft(draft: CronFieldDraft) {
  stage(active.value.field, draft);
}
function save() {
  if (!generated.value.issue) emit("save", generated.value.expression);
}
</script>

<template>
  <div class="hys-cron-composer">
    <div class="hys-cron-composer-heading">
      <strong>可视化配置</strong>
      <span>{{ format === 'quartz' ? 'Quartz' : 'Unix' }}</span>
    </div>
    <HysScrollbar direction="vertical" wrap-class="hys-cron-composer-viewport" :tabindex="null">
      <HysTabs :model-value="selected" :items="tabs" size="sm" type="line" stretch sticky :animated="false"
        :context-menu="false" :shortcuts="false" :title-tooltip="false" @update:model-value="selectTab">
        <template #panel="{ item }">
          <div v-if="item.value === selected" class="hys-cron-composer-settings">
            <HysRadioGroup :model-value="rule" size="sm" aria-label="调度规则" class="hys-cron-composer-rules"
              :class="{ 'hys-cron-composer-calendar': item.value === 'day' && format === 'quartz' }" @update:model-value="selectRule">
              <div v-for="group in groups" :key="group.key" class="hys-cron-rule-group"
                :class="{ 'hys-cron-rule-group-custom': group.key === 'custom' }"
                :role="group.label ? 'group' : undefined" :aria-label="group.label">
                <p v-if="group.label" class="hys-cron-rule-heading" aria-hidden="true">{{ group.label }}</p>
                <div v-for="option in group.options" :key="option.value" class="hys-cron-rule"
                  :class="{ 'hys-cron-rule-active': option.value === rule }">
                  <HysRadio :value="option.value" :label="option.label" />
                </div>
              </div>
            </HysRadioGroup>
            <CronRuleInputs :field="active.field" :format="format" :model-value="active.draft"
              @update:model-value="changeDraft" />
            <p v-if="active.draft.mode === 'interval' && active.field === 'weekday'" class="hys-cron-composer-note">
              步长在每周内重新计算。比如从周一开始、步长为 2，会匹配周一、周三和周五。
            </p>
            <p v-else-if="active.draft.mode === 'interval' && active.field === 'day'" class="hys-cron-composer-note">
              步长从每月的起点重新计算。
            </p>
          </div>
        </template>
      </HysTabs>
      <p v-if="!canReadFields" class="hys-cron-composer-note">当前表达式无法拆分为字段，已用 {{ format === 'quartz' ? 'Quartz' : 'Unix' }} 模板初始化草稿。</p>
    </HysScrollbar>
    <div class="hys-cron-composer-footer">
      <div class="hys-cron-composer-result" aria-live="polite">
        <code v-if="generated.expression">{{ generated.expression }}</code>
        <small :class="{ 'hys-cron-composer-error': generated.issue }">{{ generated.issue || generated.description }}</small>
      </div>
      <div class="hys-cron-composer-actions">
        <HysButton size="sm" variant="ghost" @click="emit('cancel')">取消</HysButton>
        <HysButton size="sm" :disabled="!!generated.issue" @click="save">保存</HysButton>
      </div>
    </div>
  </div>
</template>
