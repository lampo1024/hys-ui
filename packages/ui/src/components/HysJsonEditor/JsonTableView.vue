<script setup lang="ts">
import { computed, ref, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysVirtualTable from "../HysVirtualTable/HysVirtualTable.vue";
import type { HysVirtualTableCell, HysVirtualTableColumn, HysVirtualTableSort } from "../../composables/virtualTable";
import type { JsonNode } from "./jsonDocument";
import { jsonColumns, jsonTableArrays } from "./jsonConvert";
import { compareJsonFields, jsonPathLabel, jsonValue } from "./jsonStructure";

const props = defineProps<{ root: JsonNode; source: string; editable: boolean; disabled: boolean }>();
const target = defineModel<string>("target", { required: true });
const emit = defineEmits<{ edit: [row: JsonNode, key: string, field?: JsonNode]; reveal: [node: JsonNode]; tree: [node: JsonNode] }>();
type Row = { id: string; node: JsonNode; fields: Map<string, JsonNode> };
const query = ref("");
const sort = ref<HysVirtualTableSort | null>(null);
const selected = ref<{ id: string; key: string }>();
const arrays = computed(() => jsonTableArrays(props.root));
const array = computed(() => arrays.value.find(node => node.id === target.value) ?? arrays.value[0]);
const rows = computed<Row[]>(() => (array.value?.children ?? []).map(node =>
  ({ id: node.id, node, fields: new Map(node.children!.map(field => [field.label, field])) })));
const keys = computed(() => jsonColumns(array.value?.children ?? []));
const columns = computed<HysVirtualTableColumn<Row>[]>(() => keys.value.map((key, i) => ({
  key: String(i), label: key || '""', width: 154, sortable: "custom", valueGetter: row => row.fields.get(key),
})));
const visible = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  const filtered = text ? rows.value.filter(row => [...row.fields.values()].some(node => {
    const value = node.type === "string" ? JSON.parse(node.preview) as string : jsonValue(props.source, node);
    return value.toLocaleLowerCase().includes(text);
  })) : rows.value;
  if (!sort.value) return filtered;
  const key = keys.value[Number(sort.value.key)];
  if (key === undefined) return filtered;
  const direction = sort.value.direction === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => compareJsonFields(a.fields.get(key), b.fields.get(key), direction));
});
const activeRow = computed(() => selected.value && visible.value.find(row => row.id === selected.value!.id));
const activeField = computed(() => activeRow.value?.fields.get(selected.value!.key));
watch(() => array.value?.id, (id) => {
  if (id !== undefined && target.value !== id) target.value = id;
  selected.value = undefined;
  sort.value = null;
}, { immediate: true });
watch(keys, (after, before) => {
  if (after.length !== before.length || after.some((key, i) => key !== before[i])) sort.value = null;
});
function select(row: Row, columnKey: string) {
  if (!props.disabled) selected.value = { id: row.id, key: keys.value[Number(columnKey)] };
}
function cellAttributes({ row, column }: HysVirtualTableCell<Row>) {
  return { "data-json-row": row.id, "data-json-column": column.key } as import("vue").HTMLAttributes;
}
function selectFocused(event: KeyboardEvent) {
  if (props.disabled || event.isComposing || event.key !== "Enter" && event.key !== " ") return;
  const grid = event.currentTarget as HTMLElement;
  if (event.target !== grid) return;
  const cellId = grid.getAttribute("aria-activedescendant");
  const cell = cellId && grid.ownerDocument.getElementById(cellId);
  if (!cell || !grid.contains(cell)) return;
  const row = visible.value.find(item => item.id === cell.dataset.jsonRow);
  if (!row || cell.dataset.jsonColumn === undefined) return;
  event.preventDefault();
  event.stopPropagation();
  select(row, cell.dataset.jsonColumn);
}
</script>

<template>
  <section class="hys-json-tool-panel" aria-label="JSON 表格">
    <template v-if="array">
      <div class="hys-json-tool-line">
        <HysSelect :model-value="array.id" :options="arrays.map(node => ({ value: node.id, label: jsonPathLabel(node) }))"
          aria-label="表格数组" size="sm" :disabled="disabled" @update:model-value="target = $event" />
        <HysInput v-model="query" placeholder="搜索表格值" aria-label="搜索表格值" size="sm" :disabled="disabled" />
        <span role="status">{{ visible.length }} / {{ rows.length }} 行</span>
      </div>
      <HysVirtualTable v-if="columns.length" v-model:sort-state="sort" :rows="visible" :columns="columns" row-key="id"
        :height="300" :row-height="36" virtual-columns keyboard :disabled="disabled" aria-label="JSON 对象数组"
        :custom-cell="cellAttributes" @keydown.capture="selectFocused" @cell-click="({ row, column }) => select(row, column.key)">
        <template #cell="{ value, row, column }">
          <span class="hys-json-table-value" :data-json-active="selected?.id === row.id && selected?.key === keys[Number(column.key)] || undefined">
            {{ (value as JsonNode | undefined)?.preview ?? "—" }}
          </span>
        </template>
      </HysVirtualTable>
      <p v-else class="hys-json-tool-note">这个数组暂无可显示的对象字段。</p>
      <div v-if="activeRow && selected" class="hys-json-tool-line">
        <code>{{ activeField ? jsonPathLabel(activeField) : jsonPathLabel(activeRow.node) + " · " + selected.key }}</code>
        <HysButton size="sm" variant="secondary" :disabled="!editable" @click="emit('edit', activeRow.node, selected.key, activeField)">编辑单元格</HysButton>
        <HysButton size="sm" variant="ghost" :disabled="disabled" @click="emit('reveal', activeField ?? activeRow.node)">在源码中定位</HysButton>
        <HysButton v-if="activeField?.children" size="sm" variant="ghost" :disabled="disabled" @click="emit('tree', activeField)">在树中查看</HysButton>
      </div>
    </template>
    <p v-else class="hys-json-tool-note">文档中暂无可在表格中浏览的对象数组。</p>
  </section>
</template>
