<script setup lang="ts">
import HysButton from "../HysButton/HysButton.vue";
import HysProgress from "../HysProgress/HysProgress.vue";
import { computed, ref, useId } from "vue";
import {
  CircleCheck,
  CircleX,
  FileQuestion,
  Info,
  LockKeyhole,
  Clock,
  ServerCrash,
  Sparkles,
  TriangleAlert,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import type {
  HysResultContext,
  HysResultProps,
  HysResultSlots,
} from "./resultTypes";

const props = withDefaults(defineProps<HysResultProps>(), {
  status: "info",
  icon: undefined,
  showCode: true,
  size: "md",
  align: "center",
  headingLevel: 2,
  announce: "off",
  layout: "stacked",
  detailsLabel: "查看详情",
  detailsOpen: undefined,
  defaultDetailsOpen: false,
});
const slots = defineSlots<HysResultSlots>();
const emit = defineEmits<{
  "update:detailsOpen": [open: boolean];
  detailsToggle: [open: boolean];
}>();
const localDetailsOpen = ref(props.defaultDetailsOpen);
const detailsOpen = computed(() => props.detailsOpen ?? localDetailsOpen.value);
function toggleDetails() {
  const next = !detailsOpen.value;
  localDetailsOpen.value = next;
  emit("update:detailsOpen", next);
  emit("detailsToggle", next);
}
const skin = useHysRootAttrs();
const id = useId() + "-result-title";
const detailsId = id + "-details";
const element = ref<HTMLElement>(),
  heading = ref<HTMLElement>();
const states = {
  primary: { title: "操作结果", icon: Sparkles, tone: "primary" },
  info: { title: "提示信息", icon: Info, tone: "primary" },
  success: { title: "操作成功", icon: CircleCheck, tone: "success" },
  warning: { title: "操作需要注意", icon: TriangleAlert, tone: "warning" },
  error: { title: "操作失败", icon: CircleX, tone: "error" },
  pending: { title: "正在处理", icon: Clock, tone: "primary" },
  "403": { title: "无权访问", icon: LockKeyhole, tone: "warning" },
  "404": { title: "页面不存在", icon: FileQuestion, tone: "primary" },
  "500": { title: "服务暂不可用", icon: ServerCrash, tone: "error" },
};
const state = computed(() => {
  const status = String(props.status);
  return Object.hasOwn(states, status)
    ? (status as keyof typeof states)
    : "info";
});
const context = computed<HysResultContext>(() => ({
  status: state.value,
  code:
    state.value === "403" || state.value === "404" || state.value === "500"
      ? state.value
      : undefined,
  title: props.title ?? states[state.value].title,
  subtitle: props.subtitle,
  detailsOpen: detailsOpen.value,
}));
const icon = computed(() => props.icon ?? states[state.value].icon);
const message = computed(() =>
  props.announce === "off"
    ? ""
    : (props.announcement ??
      [context.value.code, context.value.title, context.value.subtitle]
        .filter(Boolean)
        .join(" ")),
);
const iconSize = computed(() => ({ sm: 24, md: 32, lg: 40 })[props.size]);
const progressValue = computed(() => typeof props.progress === "number" && Number.isFinite(props.progress) ? Math.min(100, Math.max(0, props.progress)) : undefined);
defineExpose({
  element,
  focus: (options?: FocusOptions) =>
    (heading.value ?? element.value)?.focus(options),
});
</script>

<template>
  <section
    ref="element"
    v-bind="skin"
    class="hys-ui-result"
    tabindex="-1"
    :data-status="context.status"
    :data-tone="states[state].tone"
    :data-size="size"
    :data-align="align"
    :data-layout="layout"
    :data-with-icon="icon !== false || !!slots.icon"
    :aria-busy="context.status === 'pending' || undefined"
    :aria-labelledby="context.title || slots.title ? id : undefined"
  >
    <div
      v-if="icon !== false || slots.icon"
      class="hys-result-icon"
      aria-hidden="true"
    >
      <slot name="icon" v-bind="context">
        <component
          :is="icon || undefined"
          :size="iconSize"
          :stroke-width="1.8"
        />
      </slot>
    </div>
    <div v-if="context.code && showCode" class="hys-result-code">
      {{ context.code }}
    </div>
    <div
      v-if="context.title || context.subtitle || slots.title || slots.subtitle"
      class="hys-result-copy"
    >
      <component
        v-if="context.title || slots.title"
        :is="'h' + headingLevel"
        :id="id"
        ref="heading"
        class="hys-result-title"
        tabindex="-1"
        ><slot name="title" v-bind="context">{{
          context.title
        }}</slot></component
      >
      <div
        v-if="context.subtitle || slots.subtitle"
        class="hys-result-subtitle"
      >
        <slot name="subtitle" v-bind="context">{{ context.subtitle }}</slot>
      </div>
    </div>
    <div v-if="slots.default" class="hys-result-details">
      <slot v-bind="context" />
    </div>
    <div v-if="context.status === 'pending' && progressValue !== undefined" class="hys-result-progress">
      <HysProgress :value="progressValue" :stroke-width="6" color="var(--hys-result-accent)" aria-label="处理进度" />
    </div>
    <div v-if="slots.details" class="hys-result-disclosure">
      <HysButton size="sm" variant="secondary" :aria-controls="detailsId" :aria-expanded="detailsOpen" @click="toggleDetails">
        {{ detailsLabel }}
      </HysButton>
      <div :id="detailsId" v-show="detailsOpen" class="hys-result-disclosure-content">
        <slot name="details" v-bind="context" />
      </div>
    </div>
    <div v-if="slots.extra" class="hys-result-actions">
      <slot name="extra" v-bind="context" />
    </div>
    <span
      v-if="announce !== 'off'"
      class="hys-result-sr"
      :aria-live="announce"
      aria-atomic="true"
      >{{ message }}</span
    >
  </section>
</template>

<style scoped src="./result.css"></style>
