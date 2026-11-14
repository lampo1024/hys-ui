<script setup lang="ts">
import { ChevronDown, ChevronUp, X } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";

defineProps<{ readonly: boolean; count: number; index: number }>();
const find = defineModel<string>("find", { required: true });
const replacement = defineModel<string>("replacement", { required: true });
const sensitive = defineModel<boolean>("sensitive", { required: true });
const emit = defineEmits<{ step: [direction: 1 | -1]; replace: []; replaceAll: []; close: [] }>();
const field = ref<{ focus(): void }>();
onMounted(() => field.value?.focus());
function enter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  emit("step", event.shiftKey ? -1 : 1);
}
</script>

<template>
  <section class="hys-md-find" aria-label="查找与替换" @keydown.esc.stop="emit('close')">
    <div class="hys-md-find-line">
      <HysInput ref="field" v-model="find" size="sm" aria-label="查找内容" placeholder="查找内容" @keydown.enter="enter" />
      <span class="hys-md-find-count" aria-live="polite">{{ find ? (count ? `${index + 1} / ${count}` : "无匹配") : "" }}</span>
      <HysTooltip v-for="direction in [-1, 1] as const" :key="direction" :text="direction === -1 ? '上一项' : '下一项'">
        <HysButton size="sm" variant="ghost" :aria-label="direction === -1 ? '上一项' : '下一项'" :icon="direction === -1 ? ChevronUp : ChevronDown"
          :disabled="!count" @click="emit('step', direction)" />
      </HysTooltip>
      <HysTooltip text="关闭查找">
        <HysButton size="sm" variant="ghost" aria-label="关闭查找" :icon="X" @click="emit('close')" />
      </HysTooltip>
    </div>
    <div class="hys-md-find-options">
      <HysCheckbox v-model="sensitive" size="sm" label="区分大小写" />
      <template v-if="!readonly">
        <HysInput v-model="replacement" size="sm" aria-label="替换为" placeholder="替换为" />
        <HysButton size="sm" variant="ghost" :disabled="index < 0" @click="emit('replace')">替换</HysButton>
        <HysButton size="sm" variant="ghost" :disabled="!count" @click="emit('replaceAll')">全部替换</HysButton>
      </template>
    </div>
  </section>
</template>

<style scoped>
.hys-md-find { padding: 8px 12px; display: grid; gap: 6px; border-top: 1px solid var(--hys-ui-theme-border); }
.hys-md-find-line, .hys-md-find-options { display: flex; align-items: center; gap: 6px; min-width: 0; }
.hys-md-find-options { flex-wrap: wrap; }
.hys-md-find-line > :first-child { flex: 1; min-width: 45px; }
.hys-md-find-options :deep(.hys-ui-pf-input) { flex: 1 1 130px; min-width: 75px; }
.hys-md-find-count { color: var(--hys-ui-theme-muted); font-size: 12px; white-space: nowrap; }
</style>
