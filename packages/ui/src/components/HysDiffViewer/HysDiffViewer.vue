<script setup lang="ts">
import { computed } from "vue";
import { useHysRootAttrs } from "../../config";
import { diffRows } from "./diffRows";

const props = withDefaults(
  defineProps<{
    before: string;
    after: string;
    alignChanges?: boolean;
    changesOnly?: boolean;
    lineNumbers?: boolean;
    beforeLabel?: string;
    afterLabel?: string;
    contextLines?: number;
  }>(),
  { beforeLabel: "修改前", afterLabel: "修改后" },
);
const hysRootAttrs = useHysRootAttrs();
const rows = computed(() =>
  diffRows(props.before, props.after, props.alignChanges),
);
const visible = computed(() => {
  const data = rows.value;
  if (props.changesOnly) return data.filter(({ type }) => type !== "equal");
  if (props.contextLines === undefined || !Number.isFinite(props.contextLines)) return data;
  const context = Math.max(0, Math.floor(props.contextLines));
  const sections: (typeof data[number] | { type: "gap"; count: number })[] = [];
  const changed = data.flatMap(({ type }, index) => type === "equal" ? [] : [index]);
  let cursor = 0;
  for (const index of changed) {
    const start = Math.max(0, index - context);
    if (start > cursor) {
      sections.push({ type: "gap", count: start - cursor });
      cursor = start;
    }
    const end = Math.min(data.length, index + context + 1);
    while (cursor < end) sections.push(data[cursor++]);
  }
  if (cursor && cursor < data.length) sections.push({ type: "gap", count: data.length - cursor });
  return sections;
});
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-diff">
    <div class="hys-ui-ent-diff-title">
      {{ beforeLabel }} / {{ afterLabel }}
    </div>
    <template v-for="(row, index) in visible" :key="index">
    <div v-if="row.type === 'gap'" class="hys-diff-gap">省略 {{ row.count }} 行相同内容</div>
    <div v-else
      class="hys-ui-ent-diff-row"
      :data-change="row.type"
    >
      <pre><span v-if="lineNumbers" class="hys-diff-number">{{ row.beforeLine ?? "" }}</span>{{ row.before ?? "" }}</pre>
      <pre><span v-if="lineNumbers" class="hys-diff-number">{{ row.afterLine ?? "" }}</span>{{ row.after ?? "" }}</pre>
    </div>
    </template>
    <div v-if="!visible.length" class="hys-diff-empty">两份文本一致</div>
  </div>
</template>

<style scoped>
.hys-ui-ent-diff-row pre {
  min-width: 0;
  border-color: var(--hys-ui-theme-border);
}
.hys-ui-ent-diff-row[data-change="removed"] pre:first-child,
.hys-ui-ent-diff-row[data-change="changed"] pre:first-child {
  background: color-mix(in srgb, var(--hys-ui-theme-red) 12%, transparent);
}
.hys-ui-ent-diff-row[data-change="added"] pre:last-child,
.hys-ui-ent-diff-row[data-change="changed"] pre:last-child {
  background: color-mix(in srgb, var(--hys-ui-theme-green) 12%, transparent);
}
.hys-diff-number {
  display: inline-block;
  min-width: 3ch;
  margin-inline-end: 5px;
  user-select: none;
  color: var(--hys-ui-theme-muted);
}
.hys-diff-empty {
  padding: 12px;
  text-align: center;
  color: var(--hys-ui-theme-muted);
}
.hys-diff-gap {
  padding: 5px 10px;
  text-align: center;
  background: var(--hys-ui-theme-surface-alt);
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
</style>
