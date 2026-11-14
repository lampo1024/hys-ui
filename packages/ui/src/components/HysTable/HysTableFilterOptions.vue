<script setup lang="ts">
import { computed, ref } from "vue";
import HysInput from "../HysInput/HysInput.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysRadio from "../HysRadio/HysRadio.vue";
import HysTree from "../HysTree/HysTree.vue";
import {
  tableFilterOptions,
  type HysTableFilter,
  type HysTableFilterValue,
} from "../../composables/table";
const props = defineProps<{
  options: readonly HysTableFilter[];
  values: readonly HysTableFilterValue[];
  multiple: boolean;
  mode?: "menu" | "tree";
  search?: boolean | ((query: string, option: HysTableFilter) => boolean);
  disabled?: boolean;
  searchLabel: string;
  emptyText: string;
}>();
const emit = defineEmits<{
  "update:values": [values: HysTableFilterValue[]];
}>();
const query = ref("");
const token = (value: HysTableFilterValue) =>
  typeof value + ":" + String(value);
const all = computed(() => tableFilterOptions(props.options));
const byKey = computed(
  () => new Map(all.value.map((option) => [token(option.value), option])),
);
const matches = (option: HysTableFilter) =>
  !query.value.trim() ||
  (typeof props.search === "function"
    ? props.search(query.value.trim(), option)
    : option.label
        .toLocaleLowerCase()
        .includes(query.value.trim().toLocaleLowerCase()));
const visible = computed(() => all.value.filter(matches));
interface FilterNode {
  id: string;
  label: string;
  disabled?: boolean;
  children?: FilterNode[];
  option: HysTableFilter;
}
const nodes = computed(() => {
  const map = new Map(
    all.value.map((option) => [
      option,
      {
        id: token(option.value),
        label: option.label,
        disabled: option.disabled,
        option,
      } as FilterNode,
    ]),
  );
  for (const option of all.value)
    map.get(option)!.children = option.children
      ?.map((child) => map.get(child)!)
      .filter(Boolean);
  return props.options.map((option) => map.get(option)!).filter(Boolean);
});
function setKeys(keys: readonly (string | number)[]) {
  emit(
    "update:values",
    keys.flatMap((key) => {
      const option = byKey.value.get(String(key));
      return option ? [option.value] : [];
    }),
  );
}
function toggle(option: HysTableFilter, checked: boolean) {
  if (props.disabled || option.disabled) return;
  emit(
    "update:values",
    props.multiple
      ? checked
        ? [
            ...props.values.filter((v) => !Object.is(v, option.value)),
            option.value,
          ]
        : props.values.filter((v) => !Object.is(v, option.value))
      : checked
        ? [option.value]
        : [],
  );
}
</script>
<template>
  <div class="hys-ui-table-filter-choice">
    <HysInput
      v-if="search"
      v-model="query"
      clearable
      size="sm"
      :aria-label="searchLabel"
      :placeholder="searchLabel"
      :disabled="disabled"
      @keydown.enter.prevent
    />
    <HysTree
      v-if="mode === 'tree'"
      class="hys-ui-scrollbar"
      :searchable="false"
      :nodes="nodes"
      :checked-keys="values.map(token)"
      :model-value="multiple ? null : values.length ? token(values[0]) : null"
      :checkable="multiple"
      :selectable="!multiple"
      :allow-deselect="false"
      :search-value="query"
      :filter-node="(q, node) => matches(node.option)"
      :check-on-click-node="multiple"
      :inherit-disabled="true"
      :disabled="disabled"
      :default-expand-all="true"
      :empty-text="emptyText"
      :validate-event="false"
      size="sm"
      @update:checked-keys="setKeys"
      @update:model-value="
        (key) =>
          !multiple &&
          setKeys(key === null ? [] : Array.isArray(key) ? key : [key])
      "
    />
    <div v-else class="hys-ui-table-filter-options hys-ui-scrollbar">
      <template v-for="(option, index) in visible" :key="token(option.value)">
        <HysCheckbox
          v-if="multiple"
          :model-value="values.some((v) => Object.is(v, option.value))"
          :disabled="disabled || option.disabled"
          size="sm"
          @update:model-value="toggle(option, $event === true)"
          >{{ option.label }}</HysCheckbox
        >
        <HysRadio
          v-else
          :model-value="values[0] ?? null"
          :value="option.value"
          :disabled="disabled || option.disabled"
          size="sm"
          @update:model-value="toggle(option, true)"
          >{{ option.label }}</HysRadio
        >
      </template>
      <p v-if="!visible.length" role="status">{{ emptyText }}</p>
    </div>
  </div>
</template>
<style scoped>
.hys-ui-table-filter-choice {
  display: grid;
  gap: 10px;
  min-height: 0;
}
.hys-ui-table-filter-options {
  display: grid;
  gap: 8px;
  max-height: min(280px, 40dvh);
  overflow: auto;
  overscroll-behavior: contain;
  padding: 2px;
}
.hys-ui-table-filter-options p {
  margin: 12px 4px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-table-filter-choice :deep(.hys-ui-pf-tree) {
  max-height: min(280px, 40dvh);
  overflow: auto;
  overscroll-behavior: contain;
}
</style>
