<script setup lang="ts">
import { useHysRootAttrs } from "../../config";
import { computed } from "vue";
import HysColorPicker from "../HysColorPicker/HysColorPicker.vue";

const props = defineProps<{
  labels?: Readonly<Record<string, string>>;
  defaults?: Readonly<Record<string, string>>;
  lockedKeys?: readonly string[];
  disabled?: boolean;
  resetAll?: boolean;
}>();
const model = defineModel<Record<string, string>>({
  default: () => ({ primary: "#3674e9", accent: "#22a06b" }),
});
const emit = defineEmits<{
  change: [key: string, value: string, previous: string];
  reset: [keys: string[]];
}>();
const hysRootAttrs = useHysRootAttrs();
function locked(key: string) {
  return props.disabled || props.lockedKeys?.includes(key);
}
const resettable = computed(() => Object.keys(model.value).filter((key) =>
  !locked(key) && props.defaults && Object.hasOwn(props.defaults, key) && props.defaults[key] !== model.value[key],
));
function resetColors() {
  const keys = resettable.value;
  const defaults = props.defaults;
  if (!keys.length || !defaults) return;
  const previous = model.value;
  const next = { ...previous };
  for (const key of keys) next[key] = defaults[key];
  model.value = next;
  for (const key of keys) emit("change", key, next[key], previous[key]);
  emit("reset", keys);
}
function set(key: string, value: string) {
  const previous = model.value[key];
  if (locked(key) || previous === value) return;
  model.value = { ...model.value, [key]: value };
  emit("change", key, value, previous);
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <div v-if="resetAll" class="hys-ui-ent-toolbar">
      <button type="button" :disabled="!resettable.length" @click="resetColors">恢复全部默认色</button>
    </div>
    <div v-for="(value, key) in model" :key="key" class="hys-ui-ent-token">
      <span class="hys-token-name">{{ labels?.[key] ?? key }}</span>
      <span v-if="locked(key)" class="hys-token-lock">已锁定</span>
      <HysColorPicker
        :model-value="value"
        :disabled="locked(key)"
        :label="'调整 ' + (labels?.[key] ?? key)"
        @update:model-value="set(key, $event)"
      />
      <button
        v-if="defaults && Object.hasOwn(defaults, key)"
        type="button"
        :disabled="locked(key) || value === defaults[key]"
        :aria-label="'重置 ' + (labels?.[key] ?? key)"
        @click="set(key, defaults[key])"
      >
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.hys-ui-ent-token {
  flex-wrap: wrap;
}
.hys-token-name {
  margin-inline-end: auto;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-token-lock {
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
</style>
