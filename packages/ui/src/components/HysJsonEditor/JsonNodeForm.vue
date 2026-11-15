<script setup lang="ts">
import { computed, ref } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysTextarea from "../HysTextarea/HysTextarea.vue";
import { parseJsonDocument, typeLabels, type JsonType } from "./jsonDocument";
import { initialJsonValue, type JsonNodeAction } from "./jsonTreeEdits";

const props = defineProps<{
  action: JsonNodeAction;
  keyName?: string;
  type: JsonType;
  value: string;
  error: string;
  schemaHints?: (key: string) => { keys: string[]; values: string[] };
}>();
const emit = defineEmits<{ close: []; submit: [key: string, type: JsonType, value: string] }>();
const name = ref(props.keyName ?? "");
const type = ref(props.type);
const value = ref(props.value);
const titles = { add: "添加子节点", edit: "编辑节点值", rename: "重命名字段" };
const options = (Object.keys(typeLabels) as JsonType[]).map(type => ({ value: type, label: typeLabels[type] }));
const booleans = [{ value: "true", label: "true" }, { value: "false", label: "false" }];
const hints = computed(() => props.schemaHints?.(name.value));
function chooseLiteral(raw: string) {
  const document = parseJsonDocument(raw);
  if (!document.valid) return;
  type.value = document.root.type;
  value.value = type.value === "string" ? JSON.parse(raw) : raw;
}
function changeType(next: JsonType) {
  type.value = next;
  value.value = next === "boolean" ? "false" : initialJsonValue(next);
}
function submit() { emit("submit", name.value, type.value, value.value); }
</script>

<template>
  <HysModal open :title="titles[action]" size="sm" drag-mode="preview" @close="emit('close')">
    <form class="hys-json-node-form" @submit.prevent="submit">
      <label v-if="keyName !== undefined">
        <span>字段名</span>
        <HysInput v-model="name" aria-label="字段名" />
      </label>
      <HysSelect v-if="action === 'add' && hints?.keys.length" :options="hints.keys.map(key => ({ value: key, label: key || '&quot;&quot;' }))"
        aria-label="Schema 字段建议" placeholder="选择 Schema 字段" @update:model-value="name = $event" />
      <template v-if="action !== 'rename'">
        <HysSelect v-if="hints?.values.length" :key="name" :options="hints.values.map(value => ({ value, label: value }))"
          aria-label="Schema 枚举建议" placeholder="选择 Schema 枚举值" @update:model-value="chooseLiteral" />
        <label>
          <span>值类型</span>
          <HysSelect :model-value="type" :options="options" aria-label="值类型" @update:model-value="changeType" />
        </label>
        <label v-if="type !== 'null'">
          <span>节点值</span>
          <HysSelect v-if="type === 'boolean'" v-model="value" :options="booleans" aria-label="节点值" />
          <HysInput v-else-if="type === 'number'" v-model="value" aria-label="节点值" spellcheck="false" />
          <HysTextarea v-else v-model="value" aria-label="节点值" :rows="type === 'string' ? 2 : 4" spellcheck="false" />
        </label>
      </template>
      <p v-if="error" class="hys-json-form-error" role="alert">{{ error }}</p>
    </form>
    <template #footer>
      <HysButton variant="secondary" @click="emit('close')">取消</HysButton>
      <HysButton @click="submit">应用</HysButton>
    </template>
  </HysModal>
</template>
