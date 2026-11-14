<script setup lang="ts">
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed } from "vue";
import HysAutocomplete from "../../HysAutocomplete/HysAutocomplete.vue";
import HysDatePicker from "../../HysDatePicker/HysDatePicker.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import HysTextarea from "../../HysTextarea/HysTextarea.vue";
import type { HysSpreadsheetCellOptions } from "../spreadsheetTypes";

const props = defineProps<{
  id: string;
  draft: unknown;
  options?: HysSpreadsheetCellOptions;
  errorId?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ change: [value: string]; commit: [] }>();
const text = computed(() => String(props.draft ?? ""));
const type = computed(() => props.options?.type ?? "auto");
const inputType = computed(() => (type.value === "time" ? "time" : "text"));
const multiple = computed(() => type.value === "multiple");
const choices = computed(() =>
  (type.value === "boolean"
    ? ["true", "false"]
    : (props.options?.options ?? [])
  ).map((value) => ({ label: value, value })),
);
const selected = computed(() =>
  multiple.value ? (text.value ? text.value.split("\n") : []) : text.value,
);
const dateFormat = computed(() =>
  type.value === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD[T]HH:mm",
);

function select(value: string | string[]) {
  emit("change", Array.isArray(value) ? value.join("\n") : value);
}

function commitMultiline(event: KeyboardEvent) {
  if (event.isComposing || !(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  event.stopPropagation();
  emit("commit");
}
</script>

<template>
  <HysTextarea
    v-if="type === 'multiline'"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    :model-value="text"
    size="sm"
    :bordered="false"
    :disabled="disabled"
    :aria-describedby="errorId"
    :rows="2"
    @update:model-value="emit('change', $event)"
    @press-enter="commitMultiline"
  />
  <HysSelect
    v-else-if="type === 'multiple' || type === 'select' || type === 'boolean'"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :native-label-tooltip="false"
    :multiple="multiple"
    :model-value="selected"
    :options="choices"
    :placeholder="message('请选择')"
    :clearable="!multiple"
    :disabled="disabled"
    :aria-describedby="errorId"
    data-pro-grid-input
    @update:model-value="select"
  />
  <HysAutocomplete
    v-else-if="type === 'autocomplete'"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :disabled="disabled"
    :model-value="text"
    :suggestions="options?.options ? [...options.options] : []"
    :placeholder="options?.validation?.prompt"
    :aria-describedby="errorId"
    data-pro-grid-input
    @update:model-value="emit('change', $event)"
  />
  <HysDatePicker
    v-else-if="type === 'date' || type === 'datetime-local'"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :disabled="disabled"
    :type="type === 'date' ? 'date' : 'datetime'"
    :model-value="text"
    :value-format="dateFormat"
    :format="dateFormat"
    :placeholder="options?.validation?.prompt"
    :aria-describedby="errorId"
    @update:model-value="emit('change', String($event ?? ''))"
    @change="emit('commit')"
  />
  <HysInput
    v-else
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :type="inputType"
    :inputmode="
      ['number', 'currency', 'percent'].includes(type) ? 'decimal' : undefined
    "
    :model-value="text"
    :placeholder="options?.validation?.prompt"
    :disabled="disabled"
    :aria-describedby="errorId"
    data-pro-grid-input
    @update:model-value="emit('change', $event)"
  />
</template>
