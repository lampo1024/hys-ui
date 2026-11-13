<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref, shallowRef } from "vue";
import HysModal from "../../HysModal/HysModal.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysInput from "../../HysInput/HysInput.vue";
import type { HysTabItem } from "../tabsTypes";

type Prompt =
  { kind: "dirty"; items: HysTabItem[] } | { kind: "rename"; item: HysTabItem };
const prompt = shallowRef<Prompt>(),
  name = ref("");
let resolve: ((value: boolean | string) => void) | undefined;
let cleanup: (() => void) | undefined;
function finish(value: boolean | string) {
  cleanup?.();
  cleanup = undefined;
  const done = resolve;
  resolve = undefined;
  prompt.value = undefined;
  done?.(value);
}
function ask(request: Prompt, signal?: AbortSignal) {
  if (resolve || signal?.aborted) return Promise.resolve(false);
  prompt.value = request;
  return new Promise<boolean | string>((done) => {
    resolve = done;
    if (signal) {
      const abort = () => finish(false);
      signal.addEventListener("abort", abort, { once: true });
      cleanup = () => signal.removeEventListener("abort", abort);
    }
  });
}
const title = computed(() =>
  prompt.value?.kind === "rename" ? "重命名页签" : "关闭未保存的页签？",
);
defineExpose({
  confirm: async (items: HysTabItem[], signal: AbortSignal) =>
    (await ask({ kind: "dirty", items }, signal)) === true,
  rename: async (item: HysTabItem) => {
    if (resolve) return false;
    name.value = item.label;
    return ask({ kind: "rename", item });
  },
});
onDeactivated(() => finish(false));
onBeforeUnmount(() => finish(false));
</script>

<template>
  <HysModal
    v-if="prompt"
    :open="true"
    :title="title"
    :width="420"
    :close-on-mask="false"
    @update:open="(value) => !value && finish(false)"
  >
    <p v-if="prompt.kind === 'dirty'">
      「{{
        prompt.items
          .slice(0, 3)
          .map((item) => item.label)
          .join("、")
      }}」{{
        prompt.items.length > 3 ? "等 " + prompt.items.length + " 项" : ""
      }}包含未保存的修改。关闭后这些修改可能丢失。
    </p>
    <HysInput
      v-else
      v-model="name"
      aria-label="页签名称"
      :maxlength="120"
      autofocus
      clearable
      @keydown.enter="name.trim() && finish(name.trim())"
    />
    <template #footer>
      <HysButton variant="secondary" @click="finish(false)">取消</HysButton>
      <HysButton
        v-if="prompt.kind === 'dirty'"
        variant="danger"
        @click="finish(true)"
        >仍然关闭</HysButton
      >
      <HysButton v-else :disabled="!name.trim()" @click="finish(name.trim())"
        >保存名称</HysButton
      >
    </template>
  </HysModal>
</template>
