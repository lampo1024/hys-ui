<script setup lang="ts">
import { computed, ref } from "vue";
import TabsWorkbench from "./TabsWorkbench/TabsWorkbench.vue";
import { useTabsOptions } from "./tabsConfig";
import { collectTabPanes } from "./tabsItems";
import type {
  HysTabCloseScope,
  HysTabItem,
  HysTabsEmits,
  HysTabsProps,
  HysTabsSlots,
  HysTabValue,
  TabsEmit,
} from "./tabsTypes";

export type { HysTabItem, HysTabValue } from "./tabsTypes";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysTabsProps>(), {
  workbench: undefined,
  disabled: undefined,
  readonly: undefined,
  vertical: undefined,
  responsive: undefined,
  stretch: undefined,
  centered: undefined,
  separator: undefined,
  sticky: undefined,
  fixed: undefined,
  closable: undefined,
  addable: undefined,
  editable: undefined,
  autoActivate: undefined,
  preview: undefined,
  lazy: undefined,
  preload: undefined,
  destroyOnHide: undefined,
  animated: undefined,
  animationName: undefined,
  showScrollButtons: undefined,
  dragScroll: undefined,
  swipe: undefined,
  draggable: undefined,
  dragHandle: undefined,
  contextMenu: undefined,
  shortcuts: undefined,
  titleTooltip: undefined,
  moreSearch: undefined,
  confirmDirty: undefined,
  persistScroll: undefined,
});
const emit = defineEmits<HysTabsEmits>();
const slots = defineSlots<HysTabsSlots>();
const options = useTabsOptions(props);
const controller = ref<InstanceType<typeof TabsWorkbench>>();
const active = computed(
  () =>
    controller.value?.active ??
    options.value.modelValue ??
    options.value.defaultValue ??
    "",
);
function declarations() {
  const settings = options.value;
  if (settings.items !== undefined || settings.defaultItems !== undefined)
    return [];
  return collectTabPanes(
    slots.panes
      ? slots.panes()
      : settings.workbench
        ? undefined
        : slots.default?.({ active: active.value }),
  );
}
const no = () => Promise.resolve(false);
defineExpose({
  active,
  recent: computed(() => controller.value?.recent ?? []),
  closed: computed(() => controller.value?.closed ?? []),
  select: (value: HysTabValue) => controller.value?.select(value) ?? no(),
  focus: (value?: HysTabValue) => controller.value?.focus(value),
  scrollToActiveTab: () => controller.value?.scrollToActiveTab(),
  add: (item?: HysTabItem) => controller.value?.add(item) ?? no(),
  close: (value?: HysTabValue) => controller.value?.close(value) ?? no(),
  closeMany: (
    scope: HysTabCloseScope | readonly HysTabValue[],
    anchor?: HysTabValue,
  ) => controller.value?.closeMany(scope, anchor) ?? Promise.resolve([]),
  rename: (value: HysTabValue, label: string) =>
    controller.value?.rename(value, label) ?? no(),
  move: (value: HysTabValue, target: HysTabValue, after?: boolean) =>
    controller.value?.move(value, target, after) ?? no(),
  pin: (value: HysTabValue, pinned?: boolean) =>
    controller.value?.pin(value, pinned) ?? no(),
  favorite: (value: HysTabValue, favorite?: boolean) =>
    controller.value?.favorite(value, favorite) ?? no(),
  restore: () => controller.value?.restore() ?? no(),
  preload: (value: HysTabValue) => controller.value?.preload(value) ?? no(),
  reload: (value?: HysTabValue) => controller.value?.reload(value) ?? no(),
  save: () => controller.value?.save() ?? false,
});
</script>

<template>
  <TabsWorkbench
    ref="controller"
    v-bind="$attrs"
    :options="options"
    :declarations="declarations()"
    :declarative="
      !!slots.panes &&
      options.items === undefined &&
      options.defaultItems === undefined
    "
    :slots="slots"
    :emit="emit as TabsEmit"
  />
</template>
