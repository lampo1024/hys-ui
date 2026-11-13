<script setup lang="ts">
import { computed, ref, useId, type CSSProperties } from "vue";
import { useHysRootAttrs } from "../../config";
import { resolveFormGrid } from "../../composables/formLayout";
import { useContainerWidth } from "../../composables/useContainerWidth";
import type {
  HysDescriptionContext,
  HysDescriptionsProps,
  HysDescriptionsSlots,
} from "./descriptionsTypes";

const props = withDefaults(defineProps<HysDescriptionsProps>(), {
  items: () => [],
  columns: () => ({ xs: 1, sm: 2, lg: 3 }),
  layout: "horizontal",
  size: "md",
  align: "start",
  labelAlign: "start",
  placeholder: "—",
  emptyText: "暂无详情",
});
const slots = defineSlots<HysDescriptionsSlots>();
const root = ref<HTMLElement>();
const skin = useHysRootAttrs();
const titleId = useId() + "-descriptions-title";
const width = useContainerWidth(root);
const count = computed(() => resolveFormGrid(props.columns, width.value));
const fields = computed<HysDescriptionContext[]>(() =>
  props.items
    .filter((item) => !item.hidden)
    .map((item, index) => {
      const value = item.value;
      const formatted = item.format ? item.format(value, item) : value;
      return {
        item,
        index,
        value,
        text:
          formatted === undefined || formatted === null || formatted === ""
            ? props.placeholder
            : String(formatted),
      };
    }),
);
function sizeInCss(value: string | number | undefined) {
  if (typeof value !== "number") return value;
  return Number.isFinite(value) ? Math.max(0, value) + "px" : undefined;
}
function span(value: number | undefined, limit: number) {
  return Number.isFinite(value)
    ? Math.min(limit, Math.max(1, Math.floor(value!)))
    : 1;
}
function fieldStyle(field: HysDescriptionContext): CSSProperties {
  const { item } = field;
  const columns = span(
    item.span === "full" ? count.value : item.span,
    count.value,
  );
  const rows = count.value === 1 ? 1 : span(item.rowSpan, fields.value.length);
  return {
    gridColumn: "span " + columns,
    gridRow: "span " + rows,
    "--hys-description-field-label-width": sizeInCss(item.labelWidth),
  };
}
</script>

<template>
  <section
    ref="root"
    v-bind="skin"
    class="hys-ui-descriptions"
    :data-layout="layout"
    :data-size="size"
    :data-bordered="bordered || undefined"
    :aria-label="ariaLabel"
    :aria-labelledby="
      !ariaLabel && (title || slots.title) ? titleId : undefined
    "
    :style="{
      '--hys-descriptions-columns': count,
      '--hys-descriptions-label-width': sizeInCss(labelWidth),
    }"
  >
    <header
      v-if="title || extra || slots.title || slots.extra"
      class="hys-descriptions-header"
    >
      <div
        v-if="title || slots.title"
        :id="titleId"
        class="hys-descriptions-title"
      >
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="extra || slots.extra" class="hys-descriptions-extra">
        <slot name="extra">{{ extra }}</slot>
      </div>
    </header>
    <dl v-if="fields.length" class="hys-descriptions-list">
      <div
        v-for="field in fields"
        :key="field.item.key"
        class="hys-descriptions-field"
        :style="fieldStyle(field)"
      >
        <dt
          class="hys-descriptions-label"
          :class="field.item.labelClass"
          :style="[
            { textAlign: field.item.labelAlign ?? labelAlign },
            labelStyle,
            field.item.labelStyle,
          ]"
        >
          <slot :name="`label-${field.item.key}`" v-bind="field">
            <slot name="label" v-bind="field">{{ field.item.label }}</slot>
          </slot>
          <span v-if="colon" aria-hidden="true">：</span>
        </dt>
        <dd
          class="hys-descriptions-value"
          :class="field.item.contentClass"
          :style="[
            { textAlign: field.item.align ?? align },
            contentStyle,
            field.item.contentStyle,
          ]"
        >
          <slot :name="`value-${field.item.key}`" v-bind="field">
            <slot name="value" v-bind="field">{{ field.text }}</slot>
          </slot>
        </dd>
      </div>
    </dl>
    <div v-else class="hys-descriptions-empty">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
  </section>
</template>

<style scoped src="./descriptions.css"></style>
