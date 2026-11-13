<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import { useHysRootAttrs } from "../../config";
import { collectSpaceItems, spaceGap } from "./spaceItems";
import type { HysSpaceProps, HysSpaceSlots } from "./spaceTypes";

const props = withDefaults(defineProps<HysSpaceProps>(), {
  direction: "horizontal",
  size: "sm",
  justify: "start",
});
const slots = defineSlots<HysSpaceSlots>();
const skin = useHysRootAttrs();
const justifyValues = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};
const alignValues = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  baseline: "baseline",
  stretch: "stretch",
};
const style = computed<CSSProperties>(() => {
  const gap = props.size;
  const [inline, block] = typeof gap === "object" ? gap : [gap, gap];
  const align =
    props.align ??
    (props.direction === "horizontal"
      ? "center"
      : props.fill
        ? "stretch"
        : "start");
  return {
    "--hys-space-inline-gap": spaceGap(inline),
    "--hys-space-block-gap": spaceGap(block),
    "--hys-space-basis": Number.isFinite(props.fillRatio)
      ? Math.max(0, Math.min(100, props.fillRatio!)) + "%"
      : props.wrap
        ? "auto"
        : "0%",
    alignItems: alignValues[align],
    justifyContent: justifyValues[props.justify],
  };
});
</script>

<template>
  <div
    v-bind="skin"
    class="hys-ui-space"
    :style="style"
    :data-direction="direction"
    :data-wrap="(wrap && direction === 'horizontal') || undefined"
    :data-block="block || fill || undefined"
    :data-fill="fill || undefined"
  >
    <template
      v-for="items in [collectSpaceItems(slots.default?.() ?? [])]"
      :key="0"
    >
      <div
        v-for="(item, index) in items"
        :key="item.key"
        class="hys-space-item"
      >
        <div
          v-if="index && (slots.separator || separator)"
          class="hys-space-separator"
          aria-hidden="true"
        >
          <slot name="separator" :index="index" :count="items.length">{{
            separator
          }}</slot>
        </div>
        <div class="hys-space-content"><component :is="item.node" /></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hys-ui-space {
  display: inline-flex;
  max-inline-size: 100%;
  min-inline-size: 0;
  row-gap: var(--hys-space-block-gap);
  column-gap: var(--hys-space-inline-gap);
  vertical-align: middle;
}
.hys-ui-space[data-direction="vertical"] {
  flex-direction: column;
}
.hys-ui-space[data-wrap] {
  flex-wrap: wrap;
}
.hys-ui-space[data-block] {
  display: flex;
  inline-size: 100%;
}
.hys-space-item {
  display: flex;
  align-items: inherit;
  row-gap: inherit;
  column-gap: inherit;
  min-inline-size: 0;
  max-inline-size: 100%;
}
.hys-space-content {
  min-inline-size: 0;
  max-inline-size: 100%;
}
.hys-space-separator {
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  user-select: none;
}
[data-direction="vertical"] > .hys-space-item {
  flex-direction: column;
}
[data-fill][data-direction="horizontal"] > .hys-space-item {
  flex: 1 1 var(--hys-space-basis);
}
[data-fill] > .hys-space-item > .hys-space-content {
  flex: 1;
  align-self: stretch;
}
</style>
