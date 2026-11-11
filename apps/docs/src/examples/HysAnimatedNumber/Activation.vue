<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
} from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  type HysAnimatedNumberInstance,
} from "hys-ui";

const metric = useTemplateRef<HysAnimatedNumberInstance>("metric");
const active = ref(true);
const value = ref(620);
const loading = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function load() {
  loading.value = true;
  timer = setTimeout(async () => {
    value.value = value.value === 620 ? 845 : 620;
    loading.value = false;
    await nextTick();
    if (active.value) metric.value?.restart();
  }, 350);
}
function cancel() {
  clearTimeout(timer);
  loading.value = false;
}
onDeactivated(cancel);
onBeforeUnmount(cancel);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="active = !active">{{
        active ? "离开缓存页" : "返回缓存页"
      }}</HysButton>
      <HysButton size="sm" variant="secondary" :loading="loading" @click="load"
        >模拟加载数据</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!active"
        @click="metric?.restart()"
        >外部事件重播</HysButton
      >
    </div>
    <div class="activation-preview">
      <KeepAlive>
        <HysAnimatedNumber
          v-if="active"
          ref="metric"
          title="已同步记录"
          :from="0"
          :value="value"
          :trigger="['mount', 'activate']"
          :duration="750"
          effect="fade"
          :value-style="{ fontSize: '2rem', fontWeight: 650 }"
        />
      </KeepAlive>
      <small v-if="!active">返回缓存页时从起始值重播。</small>
    </div>
  </div>
</template>

<style scoped>
.activation-preview {
  display: flex;
  align-items: center;
  min-block-size: 5.5rem;
  padding-inline: 1rem;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-bg);
}
small {
  color: var(--docs-muted);
}
</style>
