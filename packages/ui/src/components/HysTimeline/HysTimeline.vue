<script setup lang="ts" generic="T extends object = HysTimelineItem">
import { computed, onActivated, onDeactivated, ref, toRaw } from "vue";
import { LoaderCircle } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import {
  timelineRead,
  timelineText,
  timelineTone,
  type HysTimelineItem,
  type HysTimelineProps,
  type HysTimelineSlots,
  type HysTimelineItemContext,
  type HysTimelineKey,
  type HysTimelinePosition,
  type HysTimelineTone,
} from "../../composables/timeline";
import { feedbackNumber } from "../../composables/feedback";
const props = withDefaults(defineProps<HysTimelineProps<T>>(), {
  pending: undefined,
  pendingLoading: undefined,
  mode: "left",
  size: "md",
  showTime: true,
  timePlacement: "bottom",
  responsive: true,
  lineStyle: "solid",
  pendingPosition: "end",
  pendingText: "加载中…",
});
const slots = defineSlots<HysTimelineSlots<T>>(),
  skin = useHysRootAttrs(),
  element = ref<HTMLOListElement>(),
  live = ref(true);
onActivated(() => (live.value = true));
onDeactivated(() => (live.value = false));
const identities = new WeakMap<object, number>();
let sequence = 0;
const read = (item: T, name: keyof HysTimelineItem) =>
  timelineRead(item, props.fieldNames?.[name] ?? name);
const entries = computed(() => {
  const used = new Set<string>(),
    renderedKeys = new Set<string>();
  const values = props.items
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .filter(({ item }) => item && typeof item === "object")
    .map(({ item, sourceIndex }) => {
      const value =
        typeof props.itemKey === "function"
          ? props.itemKey(item, sourceIndex)
          : props.itemKey
            ? timelineRead(item, props.itemKey)
            : (read(item, "id") ?? read(item, "key"));
      const valid =
          typeof value === "string" ||
          (typeof value === "number" && Number.isFinite(value)),
        typed = typeof value + ":" + String(value);
      const raw = toRaw(item);
      if (!identities.has(raw)) identities.set(raw, ++sequence);
      let renderKey =
        valid && !used.has(typed)
          ? "key:" + typed
          : "object:" + identities.get(raw);
      used.add(typed);
      if (renderedKeys.has(renderKey))
        renderKey += ":occurrence:" + sourceIndex;
      renderedKeys.add(renderKey);
      const rawStatus = read(item, "status");
      const status = ["done", "current", "pending"].includes(
        rawStatus as string,
      )
        ? (rawStatus as HysTimelineItem["status"])
        : undefined;
      const rawTone = read(item, "tone");
      const tone = (
        ["primary", "success", "warning", "danger", "info", "neutral"].includes(
          rawTone as string,
        )
          ? rawTone
          : status === "done" || status === "current"
            ? "primary"
            : "neutral"
      ) as HysTimelineTone;
      const rawPosition = read(item, "position"),
        position =
          rawPosition === "left" || rawPosition === "right"
            ? rawPosition
            : undefined;
      const candidate = read(item, "icon") as HysTimelineItem["icon"],
        icon =
          candidate && typeof candidate === "object"
            ? toRaw(candidate)
            : candidate,
        loading = !!read(item, "loading");
      const itemSize = read(item, "size"),
        nodeSize =
          typeof itemSize === "number"
            ? feedbackNumber(itemSize, 10, 4, 64)
            : ({ sm: 8, md: 10, lg: 14 }[itemSize as "sm" | "md" | "lg"] ??
              (icon || slots.dot || loading
                ? 18
                : ({ sm: 8, md: 10, lg: 14 }[props.size] ?? 10)));
      return {
        item,
        sourceIndex,
        renderKey,
        key: valid ? (value as HysTimelineKey) : identities.get(raw)!,
        status,
        tone,
        icon,
        loading,
        nodeSize,
        title: timelineText(read(item, "title")),
        description: timelineText(read(item, "description")),
        time: timelineText(read(item, "time")),
        dateTime: timelineText(read(item, "dateTime")),
        label: timelineText(read(item, "label")),
        color: timelineText(read(item, "color")) || timelineTone(tone),
        position,
        explicitPosition: !!position,
        hollow: read(item, "hollow") ?? props.hollow,
        hideTime: read(item, "hideTime"),
        placement: read(item, "timePlacement") ?? props.timePlacement,
      };
    });
  return (props.reverse ? [...values].reverse() : values).map(
    (entry, index) => ({
      ...entry,
      index,
      position: (entry.position ??
        (props.mode === "right" ||
        (props.mode === "alternate" && index % 2 === 1) ||
        (props.mode === "alternate-reverse" && index % 2 === 0)
          ? "left"
          : "right")) as HysTimelinePosition,
    }),
  );
});
const centered = computed(
  () =>
    props.mode.startsWith("alternate") ||
    !!slots.label ||
    entries.value.some((entry) => entry.label || entry.explicitPosition),
);
const pending = computed(
  () =>
    props.pending !== false &&
    (props.pending === true || !!props.pending || !!slots.pending),
);
const pendingLoading = computed(
    () => props.pendingLoading ?? props.pending === true,
  ),
  pendingContext = computed(() => ({
    pending: props.pending,
    loading: pendingLoading.value,
  }));
const pendingCustom = computed(
  () => pendingLoading.value || !!slots["pending-dot"],
);
const pendingNodeSize = computed(() =>
  pendingCustom.value ? 18 : ({ sm: 8, md: 10, lg: 14 }[props.size] ?? 10),
);
const context = (
  entry: (typeof entries.value)[number],
): HysTimelineItemContext<T> => ({
  item: entry.item,
  index: entry.index,
  sourceIndex: entry.sourceIndex,
  key: entry.key,
  title: entry.title,
  time: entry.time,
  description: entry.description,
  label: entry.label,
  position: entry.position,
  status: entry.status,
  tone: entry.tone,
  loading: entry.loading,
});
const nodes = computed(() => {
  const rows: (
    | { kind: "item"; entry: (typeof entries.value)[number] }
    | { kind: "pending" }
  )[] = entries.value.map((entry) => ({ kind: "item", entry }));
  if (pending.value)
    props.pendingPosition === "start"
      ? rows.unshift({ kind: "pending" })
      : rows.push({ kind: "pending" });
  return rows;
});
defineExpose({
  element,
  getItems: () => entries.value.map((entry) => entry.item),
});
</script>
<template>
  <ol
    ref="element"
    v-bind="skin"
    class="hys-ui-ex-timeline hys-ui-timeline"
    :class="[
      'hys-ui-timeline-' + size,
      {
        'hys-ui-timeline-centered': centered,
        'hys-ui-timeline-responsive': responsive,
        'hys-ui-timeline-motion': live && skin['data-hys-motion'] !== 'off',
      },
    ]"
    :data-mode="mode"
    :style="{
      '--hys-ui-timeline-line-color':
        lineColor || 'var(--hys-ui-border,var(--hys-ui-theme-border))',
      '--hys-ui-timeline-line-style': lineStyle,
    }"
    role="list"
    :aria-label="ariaLabel"
    :aria-busy="
      (pendingLoading && pending) ||
      entries.some((entry) => entry.loading) ||
      undefined
    "
  >
    <li
      v-for="node in nodes"
      :key="node.kind === 'pending' ? 'pending' : node.entry.renderKey"
      class="hys-ui-timeline-item"
      :class="
        node.kind === 'item'
          ? [
              node.entry.status ? 'hys-ui-' + node.entry.status : undefined,
              {
                'hys-ui-timeline-has-label':
                  !!node.entry.label || !!slots.label,
              },
            ]
          : ['hys-ui-pending', 'hys-ui-timeline-pending']
      "
      :data-position="
        node.kind === 'item'
          ? node.entry.position
          : mode === 'right'
            ? 'left'
            : 'right'
      "
      :aria-current="
        node.kind === 'item' && node.entry.status === 'current'
          ? 'step'
          : undefined
      "
      :style="{
        '--hys-ui-timeline-color':
          node.kind === 'item'
            ? node.entry.color
            : pendingLoading
              ? 'var(--hys-ui-primary,var(--hys-ui-theme-primary))'
              : 'var(--hys-ui-muted,var(--hys-ui-theme-muted))',
        '--hys-ui-timeline-node-size':
          (node.kind === 'item' ? node.entry.nodeSize : pendingNodeSize) + 'px',
      }"
    >
      <template v-if="node.kind === 'item'">
        <div
          v-if="node.entry.label || slots.label"
          class="hys-ui-timeline-label"
        >
          <slot name="label" v-bind="context(node.entry)">{{
            node.entry.label
          }}</slot>
        </div>
        <div class="hys-ui-timeline-rail" aria-hidden="true">
          <span
            class="hys-ui-timeline-dot"
            :class="{
              'hys-ui-timeline-hollow': node.entry.hollow,
              'hys-ui-timeline-custom-dot':
                !!node.entry.icon || !!slots.dot || node.entry.loading,
            }"
            ><slot name="dot" v-bind="context(node.entry)"
              ><LoaderCircle
                v-if="node.entry.loading"
                class="hys-ui-timeline-spinner"
                :size="node.entry.nodeSize" /><component
                v-else-if="node.entry.icon"
                :is="node.entry.icon"
                :size="node.entry.nodeSize" /></slot
          ></span>
        </div>
        <div class="hys-ui-timeline-content">
          <slot name="item" v-bind="context(node.entry)">
            <time
              v-if="
                showTime &&
                !node.entry.hideTime &&
                node.entry.placement === 'top' &&
                (node.entry.time || slots.time)
              "
              class="hys-ui-timeline-time hys-ui-timeline-time-top"
              :datetime="node.entry.dateTime || undefined"
              ><slot name="time" v-bind="context(node.entry)">{{
                node.entry.time
              }}</slot></time
            >
            <strong
              v-if="node.entry.title || slots.title"
              class="hys-ui-timeline-title"
              ><slot name="title" v-bind="context(node.entry)">{{
                node.entry.title
              }}</slot></strong
            >
            <time
              v-if="
                showTime &&
                !node.entry.hideTime &&
                node.entry.placement !== 'top' &&
                (node.entry.time || slots.time)
              "
              class="hys-ui-timeline-time"
              :datetime="node.entry.dateTime || undefined"
              ><slot name="time" v-bind="context(node.entry)">{{
                node.entry.time
              }}</slot></time
            >
            <div
              v-if="node.entry.description || slots.description"
              class="hys-ui-timeline-description"
            >
              <slot name="description" v-bind="context(node.entry)">{{
                node.entry.description
              }}</slot>
            </div>
          </slot>
        </div>
      </template>
      <template v-else
        ><div class="hys-ui-timeline-rail" aria-hidden="true">
          <span
            class="hys-ui-timeline-dot hys-ui-timeline-hollow"
            :class="{ 'hys-ui-timeline-custom-dot': pendingCustom }"
            ><slot name="pending-dot" v-bind="pendingContext"
              ><LoaderCircle
                v-if="pendingLoading"
                class="hys-ui-timeline-spinner"
                :size="18" /></slot
          ></span>
        </div>
        <div class="hys-ui-timeline-content">
          <slot name="pending" v-bind="pendingContext">{{
            typeof props.pending === "string" ? props.pending : pendingText
          }}</slot>
        </div></template
      >
    </li>
    <li
      v-if="!nodes.length && (slots.empty || emptyText)"
      class="hys-ui-timeline-empty"
    >
      <slot name="empty">{{ emptyText }}</slot>
    </li>
  </ol>
</template>
<style scoped>
.hys-ui-ex-timeline.hys-ui-timeline {
  --hys-ui-timeline-axis: 28px;
  --hys-ui-timeline-gap: 20px;
  --hys-ui-timeline-line-height: 22px;
  container: hys-ui-timeline / inline-size;
  list-style: none;
  padding: 0;
  margin: 0;
  border: 0;
  min-width: 0;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font-size: 14px;
  line-height: var(--hys-ui-timeline-line-height);
}
.hys-ui-timeline.hys-ui-timeline-sm {
  --hys-ui-timeline-axis: 24px;
  --hys-ui-timeline-gap: 14px;
  font-size: 12px;
}
.hys-ui-timeline.hys-ui-timeline-lg {
  --hys-ui-timeline-axis: 36px;
  --hys-ui-timeline-gap: 26px;
  --hys-ui-timeline-line-height: 26px;
  font-size: 16px;
}
.hys-ui-timeline > .hys-ui-timeline-item {
  --hys-ui-timeline-marker-top: max(
    0px,
    calc(
      (var(--hys-ui-timeline-line-height) - var(--hys-ui-timeline-node-size)) /
        2
    )
  );
  position: relative;
  display: grid;
  grid-template-columns: var(--hys-ui-timeline-axis) minmax(0, 1fr);
  grid-template-rows: auto;
  column-gap: 8px;
  padding: 0 0 var(--hys-ui-timeline-gap);
  min-width: 0;
}
.hys-ui-timeline-item:before {
  display: none;
}
.hys-ui-timeline-content {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  padding-top: max(
    0px,
    calc(
      (var(--hys-ui-timeline-node-size) - var(--hys-ui-timeline-line-height)) /
        2
    )
  );
}
.hys-ui-timeline-rail {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}
.hys-ui-timeline-rail:after {
  content: "";
  position: absolute;
  left: 50%;
  top: calc(
    var(--hys-ui-timeline-marker-top) + var(--hys-ui-timeline-node-size)
  );
  height: calc(
    100% + var(--hys-ui-timeline-gap) - var(--hys-ui-timeline-node-size)
  );
  border-left: 2px var(--hys-ui-timeline-line-style)
    var(--hys-ui-timeline-line-color);
  transform: translateX(-50%);
}
.hys-ui-timeline-dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: var(--hys-ui-timeline-node-size);
  height: var(--hys-ui-timeline-node-size);
  margin-top: var(--hys-ui-timeline-marker-top);
  border: 2px solid var(--hys-ui-timeline-color);
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--hys-ui-timeline-color);
  color: var(--hys-ui-timeline-color);
}
.hys-ui-timeline-dot.hys-ui-timeline-hollow {
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.hys-ui-timeline-dot.hys-ui-timeline-custom-dot {
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  border: 0;
}
.hys-ui-timeline-title {
  display: block;
  margin: 0;
  font-size: inherit;
  font-weight: 600;
}
.hys-ui-timeline-time {
  display: block;
  margin: 3px 0 0;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 0.86em;
  line-height: 1.5;
}
.hys-ui-timeline-time-top {
  margin: 0 0 3px;
}
.hys-ui-timeline-description {
  margin-top: 4px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 0.93em;
  line-height: 1.65;
}
.hys-ui-timeline-label {
  grid-row: 1;
  min-width: 0;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 0.86em;
  padding-top: max(
    0px,
    calc(
      (var(--hys-ui-timeline-node-size) - var(--hys-ui-timeline-line-height)) /
        2
    )
  );
  overflow-wrap: anywhere;
}
.hys-ui-timeline:not(.hys-ui-timeline-centered)[data-mode="right"]
  > .hys-ui-timeline-item {
  grid-template-columns: minmax(0, 1fr) var(--hys-ui-timeline-axis);
}
.hys-ui-timeline:not(.hys-ui-timeline-centered)[data-mode="right"]
  .hys-ui-timeline-rail {
  grid-column: 2;
}
.hys-ui-timeline:not(.hys-ui-timeline-centered)[data-mode="right"]
  .hys-ui-timeline-content {
  grid-column: 1;
  text-align: right;
}
.hys-ui-timeline.hys-ui-timeline-centered > .hys-ui-timeline-item {
  grid-template-columns: minmax(0, 1fr) var(--hys-ui-timeline-axis) minmax(
      0,
      1fr
    );
}
.hys-ui-timeline-centered .hys-ui-timeline-rail {
  grid-column: 2;
}
.hys-ui-timeline-centered [data-position="right"] > .hys-ui-timeline-content {
  grid-column: 3;
  text-align: left;
}
.hys-ui-timeline-centered [data-position="right"] > .hys-ui-timeline-label {
  grid-column: 1;
  text-align: right;
}
.hys-ui-timeline-centered [data-position="left"] > .hys-ui-timeline-content {
  grid-column: 1;
  text-align: right;
}
.hys-ui-timeline-centered [data-position="left"] > .hys-ui-timeline-label {
  grid-column: 3;
  text-align: left;
}
.hys-ui-timeline-item:last-child {
  padding-bottom: 0;
}
.hys-ui-timeline-item:last-child > .hys-ui-timeline-rail:after {
  display: none;
}
.hys-ui-timeline-empty {
  padding: 20px;
  text-align: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-timeline-empty:before {
  display: none;
}
.hys-ui-timeline-motion .hys-ui-timeline-spinner {
  animation: hys-ui-timeline-spin 1s linear infinite;
}
@keyframes hys-ui-timeline-spin {
  to {
    transform: rotate(360deg);
  }
}
@container hys-ui-timeline (max-width:480px) {
  .hys-ui-timeline-responsive > .hys-ui-timeline-item {
    grid-template-columns: var(--hys-ui-timeline-axis) minmax(
        0,
        1fr
      ) !important;
  }
  .hys-ui-timeline-responsive .hys-ui-timeline-rail {
    grid-column: 1 !important;
    grid-row: 1/-1;
  }
  .hys-ui-timeline-responsive .hys-ui-timeline-content,
  .hys-ui-timeline-responsive .hys-ui-timeline-label {
    grid-column: 2 !important;
    text-align: left !important;
  }
  .hys-ui-timeline-responsive > .hys-ui-timeline-has-label {
    grid-template-rows: auto auto;
  }
  .hys-ui-timeline-responsive
    .hys-ui-timeline-has-label
    > .hys-ui-timeline-content {
    grid-row: 2;
    padding-top: 3px;
  }
  .hys-ui-timeline-responsive .hys-ui-timeline-label {
    grid-row: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-timeline-spinner {
    animation: none !important;
  }
}
</style>
