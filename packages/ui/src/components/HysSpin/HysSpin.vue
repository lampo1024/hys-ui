<script setup lang="ts">
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  ref,
  useAttrs,
  watch,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { usePageVisibility } from "../../composables/usePageVisibility";
import SpinGlyph from "./SpinGlyph/SpinGlyph.vue";
import { useSpinConfig } from "./spinConfig";
import { bounded, spinStyle } from "./spinStyle";
import { clampSpinProgress, useHysSpinTask } from "./useHysSpinTask";
import { useSpinVisibility } from "./useSpinVisibility";
import { useSpinFullscreen } from "./useSpinFullscreen";
import type {
  HysSpinContext,
  HysSpinProps,
  HysSpinRunOptions,
  HysSpinSnapshot,
  HysSpinUpdate,
  HysSpinWork,
} from "./spinTypes";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysSpinProps>(), {
  spinning: undefined,
  modelValue: undefined,
  defaultSpinning: undefined,
  showResult: undefined,
  showPercentage: undefined,
  mask: undefined,
  blockInteraction: undefined,
  lockScroll: undefined,
  cancellable: undefined,
  retryable: undefined,
  escapeCancel: undefined,
  animated: undefined,
  paused: undefined,
  pauseWhenHidden: undefined,
});
const emit = defineEmits<{
  "update:modelValue": [spinning: boolean];
  "update:spinning": [spinning: boolean];
  change: [context: HysSpinSnapshot];
  start: [context: HysSpinSnapshot];
  end: [context: HysSpinSnapshot];
  show: [context: HysSpinSnapshot];
  hide: [context: HysSpinSnapshot];
  afterHide: [context: HysSpinSnapshot];
  cancel: [context: HysSpinSnapshot];
  timeout: [context: HysSpinSnapshot];
  retry: [context: HysSpinSnapshot];
  error: [error: unknown, context: HysSpinSnapshot];
  success: [context: HysSpinSnapshot];
}>();
const slots = defineSlots<{
  default?: () => VNodeChild;
  indicator?: (context: HysSpinContext) => VNodeChild;
  icon?: (context: HysSpinContext) => VNodeChild;
  message?: (context: HysSpinContext) => VNodeChild;
  progress?: (context: HysSpinContext) => VNodeChild;
  overlay?: (context: HysSpinContext) => VNodeChild;
  actions?: (context: HysSpinContext) => VNodeChild;
}>();
const config = useSpinConfig(),
  skin = useHysRootAttrs(),
  attrs = useAttrs();
const options = computed<HysSpinProps>(() => {
  const configured = config.defaults.value;
  const preset = props.preset ?? configured.preset;
  return {
    ...configured,
    ...(preset ? config.presets.value[preset] : {}),
    ...Object.fromEntries(
      Object.entries(props).filter(([, value]) => value !== undefined),
    ),
  };
});
const task = useHysSpinTask();
const local = ref<boolean>();
const active = ref(true),
  mounted = ref(false),
  panel = ref<HTMLElement>();
const manual = ref<HysSpinUpdate>({});
const paused = ref(false),
  stopped = ref(false),
  animationKey = ref(0);
const background = usePageVisibility();
const mode = computed(
  () => options.value.mode ?? (slots.default ? "container" : "inline"),
);
const covered = computed(() =>
  ["container", "overlay", "fullscreen"].includes(mode.value),
);
const fullscreen = computed(() => mode.value === "fullscreen");
const target = computed(() => options.value.appendTo ?? "body");
const requested = computed(
  () =>
    active.value &&
    (options.value.spinning ??
      options.value.modelValue ??
      local.value ??
      (options.value.task ? false : (options.value.defaultSpinning ?? true))),
);
const status = computed(
  () =>
    options.value.status ??
    manual.value.status ??
    (task.state.value.status === "idle"
      ? requested.value
        ? "loading"
        : "idle"
      : task.state.value.status),
);
const progress = computed(() =>
  clampSpinProgress(
    options.value.progress ??
      ("progress" in manual.value
        ? (manual.value.progress ?? undefined)
        : task.state.value.progress),
  ),
);
const isResult = computed(
  () => !["idle", "loading", "retrying"].includes(status.value),
);
const snapshot = computed<HysSpinSnapshot>(() => ({
  spinning: requested.value,
  status: status.value,
  progress: progress.value,
  message:
    options.value.message ?? manual.value.message ?? task.state.value.message,
  stage:
    options.value.stage ??
    manual.value.stage ??
    (task.state.value.spinning ? task.state.value.stage : undefined),
  remainingTime:
    options.value.remainingTime ??
    manual.value.remainingTime ??
    (task.state.value.spinning ? task.state.value.remainingTime : undefined),
  error: task.state.value.error,
}));
function request(value: boolean) {
  local.value = value;
  emit("update:modelValue", value);
  emit("update:spinning", value);
}
function show() {
  manual.value = {};
  if (!task.state.value.spinning) task.reset();
  request(true);
}
function hide() {
  request(false);
}
function update(patch: HysSpinUpdate) {
  manual.value = { ...manual.value, ...patch };
}
function cancel() {
  if (task.state.value.spinning) task.cancel();
  else {
    update({ status: "cancelled" });
    hide();
    emit("cancel", snapshot.value);
  }
}
function retry() {
  const result = task.retry();
  if (result) manual.value = {};
  emit("retry", snapshot.value);
  return result;
}
function run<T>(work: HysSpinWork<T>, settings?: HysSpinRunOptions) {
  manual.value = {};
  return task.run(work, { timeout: options.value.timeout, ...settings });
}
watch(() => task.state.value.spinning, request, { flush: "sync" });
watch(
  () => task.state.value.status,
  (value) => {
    if (value === "error")
      emit("error", task.state.value.error, snapshot.value);
    if (value === "success") emit("success", snapshot.value);
    if (value === "cancelled") emit("cancel", snapshot.value);
    if (value === "timeout") emit("timeout", snapshot.value);
  },
);
watch(
  () => options.value.task,
  (work) => {
    if (!mounted.value || !active.value) return;
    if (work) void run(work).catch(() => {});
    else if (task.state.value.spinning) task.cancel();
  },
);
onMounted(() => {
  mounted.value = true;
  if (options.value.task) void run(options.value.task).catch(() => {});
});
onDeactivated(() => {
  active.value = false;
  task.reset();
});
onActivated(() => {
  active.value = true;
});
const visible = useSpinVisibility({
  requested: () => requested.value,
  delay: () => options.value.delay,
  minimum: () => options.value.minDuration,
  timeout: () =>
    task.state.value.spinning ? undefined : options.value.timeout,
  autoEnd: () => options.value.autoEnd,
  start: () => emit("start", snapshot.value),
  end: () => emit("end", snapshot.value),
  stop(reason) {
    if (reason === "timeout") {
      update({ status: "timeout" });
      emit("timeout", snapshot.value);
    } else if (task.state.value.spinning) task.cancel();
    hide();
  },
});
const showLayer = computed(
  () =>
    active.value &&
    (visible.value || (options.value.showResult && isResult.value)),
);
const busy = computed(() => visible.value && !isResult.value);
const block = computed(
  () => busy.value && covered.value && options.value.blockInteraction !== false,
);
const overlay = useSpinFullscreen(panel, {
  trap: () => fullscreen.value && block.value,
  lock: () =>
    fullscreen.value && busy.value && options.value.lockScroll !== false,
  zIndex: () => options.value.zIndex ?? 2200,
  escape: () => {
    if (options.value.escapeCancel && options.value.cancellable) cancel();
  },
});
const numeric = computed(() => progress.value !== undefined);
const progressKind = computed(() => options.value.progressType ?? "ring");
const percentText = computed(() =>
  numeric.value
    ? (options.value.formatProgress?.(progress.value!) ??
      Math.round(progress.value!) + "%")
    : "",
);
const context = computed<HysSpinContext>(() => ({
  ...snapshot.value,
  visible: showLayer.value === true,
  percentText: percentText.value,
  cancel,
  retry,
}));
const rootStyle = computed(() =>
  spinStyle(
    options.value,
    paused.value ||
      !!options.value.paused ||
      (options.value.pauseWhenHidden !== false && background.value),
  ),
);
const feedback: Record<string, string> = {
  retrying: "正在重试",
  success: "加载完成",
  error: "加载失败",
  cancelled: "已取消加载",
  timeout: "加载超时",
};
const feedbackText = computed(() =>
  Object.hasOwn(feedback, status.value) ? feedback[status.value] : undefined,
);
const displayMessage = computed(() =>
  isResult.value
    ? (options.value.message ??
      manual.value.message ??
      feedbackText.value ??
      snapshot.value.message)
    : (snapshot.value.message ?? feedbackText.value),
);
const label = computed(
  () =>
    options.value.ariaLabel ||
    displayMessage.value ||
    options.value.title ||
    "正在加载",
);
const segments = computed(() =>
  Math.round(bounded(options.value.segments, 8, 2, 30)),
);
watch(snapshot, (value) => emit("change", value));
let reportedVisible = false;
function reportVisibility() {
  const value = showLayer.value === true;
  if (reportedVisible === value) return;
  reportedVisible = value;
  if (value) emit("show", snapshot.value);
  else emit("hide", snapshot.value);
}
watch(showLayer, reportVisibility);
onMounted(reportVisibility);
defineExpose({
  show,
  hide,
  toggle: () => (requested.value ? hide() : show()),
  run,
  cancel,
  retry,
  update,
  pause: () => {
    paused.value = true;
  },
  resume: () => {
    paused.value = stopped.value = false;
  },
  stop: () => {
    stopped.value = true;
  },
  restart: () => {
    stopped.value = paused.value = false;
    animationKey.value++;
  },
  clearResult: () => {
    if (!task.state.value.spinning) {
      task.reset();
      manual.value = {};
    }
  },
  visible,
  snapshot,
});
</script>

<template>
  <div
    v-bind="{ ...skin, ...attrs }"
    class="hys-ui-spin"
    :data-mode="mode"
    :style="[rootStyle, attrs.style]"
  >
    <div
      v-if="$slots.default"
      class="hys-spin-content"
      :inert="block || undefined"
      :aria-busy="busy || undefined"
      :class="{
        'hys-spin-scroll-locked':
          covered && !fullscreen && busy && options.lockScroll,
      }"
    >
      <slot />
    </div>
    <Teleport :to="target" :disabled="!fullscreen">
      <Transition
        name="hys-spin-fade"
        appear
        @after-leave="emit('afterHide', snapshot)"
      >
        <div
          v-if="showLayer"
          ref="panel"
          v-bind="skin"
          class="hys-spin-layer hys-ui-scrollbar"
          :style="[
            rootStyle,
            { zIndex: overlay?.zIndex.value ?? options.zIndex },
            options.overlayStyle,
          ]"
          :data-mode="mode"
          :data-placement="options.placement ?? 'center'"
          :data-block="block || undefined"
          :data-mask="(covered && options.mask !== false) || undefined"
          :data-motion-off="stopped || options.animated === false || undefined"
          :data-status="status"
          :role="fullscreen && block ? 'dialog' : undefined"
          :aria-modal="(fullscreen && block) || undefined"
          :aria-label="fullscreen ? label : undefined"
          :tabindex="fullscreen && block ? -1 : undefined"
        >
          <slot name="overlay" v-bind="context">
            <div
              class="hys-spin-indicator"
              :data-layout="
                options.layout ??
                (mode === 'inline' || mode === 'indicator' ? 'left' : 'top')
              "
              :data-align="options.align ?? 'center'"
              :style="options.indicatorStyle"
            >
              <div
                v-if="
                  progressKind === 'ring' ||
                  !numeric ||
                  isResult ||
                  $slots.indicator ||
                  $slots.icon
                "
                :key="animationKey"
                class="hys-spin-icon"
                :class="{ 'hys-spin-custom': options.animationName }"
                :aria-busy="(!$slots.default && busy) || undefined"
              >
                <slot name="indicator" v-bind="context">
                  <slot name="icon" v-bind="context">
                    <SpinGlyph
                      :animation="options.animation ?? 'circle'"
                      :status="status"
                      :progress="progressKind === 'ring' ? progress : undefined"
                      :stroke="bounded(options.strokeWidth, 4, 0.5, 8)"
                      :dot="bounded(options.dotSize, 4, 1, 8)"
                      :spacing="bounded(options.dotGap, 11, 6, 17)"
                      :colors="options.colors"
                      :gradient="options.gradient"
                      :path="options.path"
                    />
                  </slot>
                </slot>
              </div>
              <div class="hys-spin-details" :style="options.messageStyle">
                <span v-if="options.title" class="hys-spin-title">{{
                  options.title
                }}</span>
                <div
                  v-if="displayMessage || $slots.message"
                  class="hys-spin-message"
                >
                  <slot name="message" v-bind="context">{{
                    displayMessage
                  }}</slot>
                </div>
                <span v-if="options.description" class="hys-spin-description">{{
                  options.description
                }}</span>
                <span v-if="snapshot.stage" class="hys-spin-description">{{
                  snapshot.stage
                }}</span>
                <span
                  v-if="snapshot.remainingTime !== undefined"
                  class="hys-spin-description"
                  >约剩
                  {{ Math.max(0, Math.ceil(snapshot.remainingTime / 1000)) }}
                  秒</span
                >
                <slot name="progress" v-bind="context">
                  <span
                    v-if="numeric && progressKind === 'line'"
                    class="hys-spin-line"
                    aria-hidden="true"
                  >
                    <i :style="{ inlineSize: (progress ?? 0) + '%' }" />
                  </span>
                  <span
                    v-else-if="numeric && progressKind === 'segments'"
                    class="hys-spin-segments"
                    aria-hidden="true"
                  >
                    <i
                      v-for="index in segments"
                      :key="index"
                      :style="{
                        '--hys-spin-segment-fill':
                          Math.min(
                            1,
                            Math.max(
                              0,
                              (progress! / 100) * segments - index + 1,
                            ),
                          ) *
                            100 +
                          '%',
                      }"
                    />
                  </span>
                  <span
                    v-if="numeric && options.showPercentage !== false"
                    class="hys-spin-percent"
                    >{{ percentText }}</span
                  >
                </slot>
              </div>
              <div
                class="hys-spin-actions"
                v-if="
                  $slots.actions ||
                  (options.cancellable && busy) ||
                  (options.retryable &&
                    ['error', 'timeout', 'cancelled'].includes(status))
                "
              >
                <slot name="actions" v-bind="context">
                  <button
                    v-if="options.cancellable && busy"
                    type="button"
                    @click="cancel"
                  >
                    {{ options.cancelLabel ?? "取消加载" }}
                  </button>
                  <button
                    v-else-if="options.retryable"
                    type="button"
                    @click="retry()?.catch(() => {})"
                  >
                    {{ options.retryLabel ?? "重试" }}
                  </button>
                </slot>
              </div>
            </div>
          </slot>
          <div
            v-if="numeric && !isResult"
            class="hys-spin-sr"
            role="progressbar"
            :aria-label="label"
            :aria-valuenow="progress"
            aria-valuemin="0"
            aria-valuemax="100"
          />
          <span
            v-else
            class="hys-spin-sr"
            :role="
              status === 'error' || status === 'timeout' ? 'alert' : 'status'
            "
            >{{ label }}</span
          >
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped src="./spin.css"></style>
