<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import type { HysFormPath, HysFormValidationResult } from "../../composables/formContext";
import { snapshotForm } from "../../composables/formValidation";
import HysButton from "../HysButton/HysButton.vue";
import HysForm from "../HysForm/HysForm.vue";
import HysSteps, { type HysStepItem } from "../HysSteps/HysSteps.vue";

export interface HysStepFormStep extends HysStepItem {
  /** 此条件为 false 时跳过步骤，事件仍使用原始索引。 */
  when?: (model: Record<string, unknown>) => boolean;
}
export interface HysStepFormIssue {
  message: string;
  field?: HysFormPath;
}
export interface HysStepDraft {
  step: number;
  values: Record<string, unknown>;
}
export interface HysStepFormProps {
  /** 步骤标题和说明，至少一项。 */
  steps: readonly (string | HysStepFormStep)[];
  /** 仅在步进时校验本步骤，返回错误可指定要聚焦的表单字段。 */
  validateStep?: (index: number, values: Record<string, unknown>) => HysStepFormIssue | void | Promise<HysStepFormIssue | void>;
  /** 允许通过步骤条前往已到达的步骤。向前跳转仍校验当前步骤。 */
  jumpToVisited?: boolean;
  /** 保存当前进度，传入表单值快照。持久化和序列化由调用方负责。 */
  saveDraft?: (draft: HysStepDraft) => void | Promise<void>;
  /** 读取草稿，应用时发出 restoreDraft，由调用方更新模型。 */
  loadDraft?: () => HysStepDraft | undefined | Promise<HysStepDraft | undefined>;
  /** 步骤共用的数据对象。通过内容插槽绑定相应字段。 */
  model: Record<string, unknown>;
  /** 受控步骤索引，从 0 开始。 */
  current?: number;
  /** 正在提交业务请求，禁止再次提交。 */
  loading?: boolean;
  /** 在操作区显示取消入口。 */
  cancellable?: boolean;
  /** 自定义上一步文字。 */
  previousText?: string;
  /** 自定义下一步文字。 */
  nextText?: string;
  /** 自定义完成按钮文字。 */
  finishText?: string;
  /** 自定义取消按钮文字。 */
  cancelText?: string;
}
const props = withDefaults(defineProps<HysStepFormProps>(), {
  previousText: "上一步", nextText: "下一步", finishText: "完成", cancelText: "取消",
});
const emit = defineEmits<{
  /** 请求改变当前步骤索引。 */
  "update:current": [index: number];
  /** 成功从一个步骤进入另一个时发出。 */
  change: [index: number];
  /** 最后一步通过验证后提供全部表单值。 */
  finish: [values: Record<string, unknown>];
  /** 激活取消按钮时发出。 */
  cancel: [];
  /** 当前表单字段未通过验证时发出校验结果。 */
  invalid: [result: HysFormValidationResult];
  /** 读到并恢复草稿时发出步骤和字段值。 */
  restoreDraft: [draft: HysStepDraft];
  /** 保存、读取或额外验证发生异常。 */
  processError: [error: unknown];
}>();
const slots = defineSlots<{
  /** 当前步骤内容。放入 HysFormItem 以参加本步骤校验。 */
  default?: (scope: { step: number; model: Record<string, unknown> }) => VNodeChild;
  /** 最后一步验证成功后展示复核页，点击完成后提交。 */
  review?: (scope: { values: Record<string, unknown> }) => VNodeChild;
  /** 替换底部操作，next 仍会触发本步骤校验。 */
  actions?: (scope: { step: number; last: boolean; busy: boolean; next: () => void; previous: () => void; cancel: () => void }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const form = ref<InstanceType<typeof HysForm>>();
const local = ref(0);
const failed = ref(false);
const message = ref("");
const reviewValues = ref<Record<string, unknown>>();
const visited = ref(new Set<number>());
let generation = 0;
let jumpTarget: number | undefined;
let restoring = false;
const submitting = ref(false);
const activeSteps = computed(() => props.steps.flatMap((step, index) =>
  typeof step === "string" || step.when?.(props.model) !== false ? [{ step, index }] : [],
));
const index = computed(() => {
  const requested = Math.max(0, Math.trunc(props.current ?? local.value) || 0);
  return activeSteps.value.find(entry => entry.index >= requested)?.index ?? activeSteps.value.at(-1)?.index ?? 0;
});
const position = computed(() => activeSteps.value.findIndex(entry => entry.index === index.value));
function canJump(target: number) {
  const entry = activeSteps.value[target];
  if (!entry || !visited.value.has(entry.index)) return false;
  if (typeof entry.step !== "string" && entry.step.disabled) return false;
  return activeSteps.value.slice(position.value + 1, target).every(step => visited.value.has(step.index));
}
const barItems = computed(() => activeSteps.value.map(({ step }, target) => {
  if (!props.jumpToVisited) return step;
  const item = typeof step === "string" ? { title: step } : step;
  return { ...item, disabled: !canJump(target) };
}));
const last = computed(() => position.value === activeSteps.value.length - 1);
const busy = computed(() => !!props.loading || submitting.value || !!form.value?.validating);
function stop() {
  generation++;
  jumpTarget = undefined;
  submitting.value = false;
  reviewValues.value = undefined;
}
onDeactivated(stop);
onBeforeUnmount(stop);
watch(index, () => {
  if (restoring) return;
  stop();
  failed.value = false;
  message.value = "";
  visited.value.add(index.value);
}, { immediate: true, flush: "sync" });
function move(index: number) {
  local.value = index;
  emit("update:current", index);
  emit("change", index);
}
function previous() {
  if (busy.value) return;
  if (reviewValues.value) { reviewValues.value = undefined; return; }
  const prior = activeSteps.value[position.value - 1];
  if (prior) move(prior.index);
}
function jump(next: number) {
  if (busy.value || !canJump(next)) return;
  const target = activeSteps.value[next].index;
  if (next < position.value) move(target);
  else if (!reviewValues.value) {
    jumpTarget = target;
    void form.value?.submit().then(() => {
      if (jumpTarget === target) jumpTarget = undefined;
    });
  }
}
async function draft(action: "save" | "load") {
  if (busy.value) return;
  const ticket = ++generation;
  submitting.value = true;
  message.value = "";
  try {
    if (action === "save" && props.saveDraft) {
      const values = snapshotForm(props.model) as Record<string, unknown>;
      await props.saveDraft({ step: index.value, values });
      if (ticket === generation) message.value = "已保存草稿";
    } else if (action === "load" && props.loadDraft) {
      const restore = await props.loadDraft();
      if (ticket !== generation) return;
      if (!restore) { message.value = "暂无可恢复的草稿"; return; }
      failed.value = false;
      reviewValues.value = undefined;
      restoring = true;
      try {
        emit("restoreDraft", restore);
        await nextTick();
        if (ticket !== generation) return;
        const target = activeSteps.value.find(step => step.index >= restore.step)
          ?? activeSteps.value.at(-1);
        if (!target) return;
        for (const step of activeSteps.value) {
          if (step.index <= target.index) visited.value.add(step.index);
        }
        move(target.index);
        await nextTick();
        if (ticket === generation) message.value = "已恢复草稿";
      } finally {
        restoring = false;
      }
    }
  } catch (error) {
    if (ticket === generation) { message.value = "草稿操作失败"; emit("processError", error); }
  } finally {
    if (ticket === generation) submitting.value = false;
  }
}
function cancel() { if (!busy.value) emit("cancel"); }
function next() {
  if (busy.value) return;
  if (reviewValues.value) { emit("finish", reviewValues.value); return; }
  jumpTarget = undefined;
  void form.value?.submit();
}
async function accepted(values: Record<string, unknown>) {
  if (props.loading || submitting.value) return;
  const target = jumpTarget;
  jumpTarget = undefined;
  const ticket = ++generation;
  failed.value = false;
  message.value = "";
  submitting.value = true;
  try {
    const issue = props.validateStep ? await props.validateStep(index.value, values) : undefined;
    if (ticket !== generation) return;
    if (issue) {
      failed.value = true;
      message.value = issue.message;
      if (issue.field !== undefined) {
        await nextTick();
        if (ticket !== generation) return;
        form.value?.scrollToField(issue.field);
        form.value?.focusField(issue.field);
      }
      return;
    }
    if (target !== undefined) {
      const jump = activeSteps.value.findIndex(step => step.index === target);
      if (canJump(jump)) move(target);
      return;
    }
    if (last.value) {
      if (slots.review) reviewValues.value = values;
      else emit("finish", values);
    } else move(activeSteps.value[position.value + 1].index);
  } catch (error) {
    if (ticket === generation) {
      failed.value = true;
      message.value = "当前步骤校验失败";
      emit("processError", error);
    }
  } finally {
    if (ticket === generation) submitting.value = false;
  }
}
function invalid(result: HysFormValidationResult) {
  jumpTarget = undefined;
  failed.value = true;
  emit("invalid", result);
}
</script>
<template>
  <section v-if="activeSteps.length" v-bind="skin" class="hys-step-form">
    <HysSteps :items="barItems" :current="position" :status="failed ? 'error' : 'process'"
      :clickable="jumpToVisited" :disabled="busy" @change="jump" />
    <slot v-if="reviewValues" name="review" :values="reviewValues" />
    <HysForm v-else :key="index" ref="form" :model="model" :loading="loading" scroll-to-error focus-on-error @submit="accepted" @invalid="invalid">
      <slot :step="index" :model="model" />
    </HysForm>
    <p v-if="message" role="status" class="step-message" :class="{ failed }">{{ message }}</p>
    <div class="step-actions">
      <slot name="actions" :step="index" :last="last" :busy="busy" :next="next" :previous="previous" :cancel="cancel">
        <HysButton v-if="cancellable" variant="ghost" :disabled="busy" @click="cancel">{{ cancelText }}</HysButton>
        <HysButton v-if="loadDraft" variant="text" :disabled="busy" @click="draft('load')">恢复草稿</HysButton>
        <HysButton v-if="saveDraft" variant="text" :disabled="busy" @click="draft('save')">保存草稿</HysButton>
        <HysButton v-if="position > 0 || reviewValues" variant="secondary" :disabled="busy" @click="previous">{{ reviewValues ? '返回编辑' : previousText }}</HysButton>
        <HysButton :loading="busy" @click="next">{{ last ? ($slots.review && !reviewValues ? '复核' : finishText) : nextText }}</HysButton>
      </slot>
    </div>
  </section>
</template>
<style scoped>
.hys-step-form { display: grid; gap: 16px; min-width: 0; }
.step-message { margin: 0; color: var(--hys-ui-theme-muted); font-size: 13px; }
.step-message.failed { color: var(--hys-ui-theme-red); }
.step-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: end; }
</style>
