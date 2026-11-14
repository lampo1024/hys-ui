<script setup lang="ts">
import { computed, ref } from "vue";
import { useHysRootAttrs } from "../../config";

export interface HysShortcut {
  keys: string;
  description: string;
  group?: string;
  macKeys?: string;
  sequence?: readonly (readonly string[])[];
  macSequence?: readonly (readonly string[])[];
}
const props = defineProps<{
  shortcuts: HysShortcut[];
  searchable?: boolean;
  platform?: "default" | "mac";
  emptyText?: string;
}>();
const hysRootAttrs = useHysRootAttrs();
const query = ref("");
const groups = computed(() => {
  const term = props.searchable ? query.value.trim().toLowerCase() : "";
  const result = new Map<string, HysShortcut[]>();
  for (const item of props.shortcuts) {
    const group = item.group ?? "";
    if (
      term &&
      ![item.keys, item.macKeys, item.description, group, item.sequence?.flat().join(" "), item.macSequence?.flat().join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
      continue;
    const list = result.get(group);
    if (list) list.push(item);
    else result.set(group, [item]);
  }
  return Array.from(result);
});
function sequence(item: HysShortcut) {
  return props.platform === "mac" ? item.macSequence ?? (item.macKeys ? undefined : item.sequence) : item.sequence;
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <input
      v-if="searchable"
      v-model="query"
      type="search"
      aria-label="搜索快捷键"
      placeholder="搜索快捷键或操作"
    />
    <section v-for="[group, items] in groups" :key="group">
      <h3 v-if="group" class="hys-shortcut-group">{{ group }}</h3>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="hys-ui-ent-shortcut"
      >
        <span>{{ item.description }}</span>
        <span v-if="sequence(item)?.length" class="hys-shortcut-sequence">
          <span v-for="(chord, step) in sequence(item)" :key="step" class="hys-shortcut-chord">
            <span v-if="step">再按</span>
            <template v-for="(key, index) in chord" :key="index">
              <span v-if="index" aria-hidden="true">+</span><kbd>{{ key }}</kbd>
            </template>
          </span>
        </span>
        <kbd v-else>{{
          platform === "mac" ? (item.macKeys ?? item.keys) : item.keys
        }}</kbd>
      </div>
    </section>
    <p v-if="!groups.length" class="hys-ui-ent-muted" role="status">
      {{ emptyText || "没有匹配的快捷键" }}
    </p>
  </div>
</template>

<style scoped>
.hys-shortcut-group {
  margin: 14px 0 2px;
  font-size: 13px;
  font-weight: 650;
}
.hys-ui-ent-shortcut > span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-ent-shortcut kbd {
  flex: none;
  white-space: nowrap;
}
.hys-shortcut-sequence, .hys-shortcut-chord {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: end;
  gap: 4px;
}
</style>
