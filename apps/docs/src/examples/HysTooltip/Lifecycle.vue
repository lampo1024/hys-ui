<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from "vue";
import { HysTooltip, HysButton, HysCheckbox } from "hys-ui";
const retained = ref(true),
  warm = ref(false),
  mounts = ref(0),
  events = ref<string[]>([]);
const Content = defineComponent({
  setup() {
    const number = ref(0);
    onMounted(() => mounts.value++);
    return () => h("span", "内容已经挂载；每次重新挂载都会累计实例次数。");
  },
});
function record(name: string) {
  events.value = [...events.value.slice(-5), name];
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="retained" label="关闭后保留内容" /><HysCheckbox
        v-model="warm"
        label="预先挂载内容"
      />
    </div>
    <HysTooltip
      trigger="click"
      :destroy-on-hide="!retained"
      :force-render="warm"
      @show="record('show')"
      @opened="record('opened')"
      @hide="record('hide')"
      @closed="record('closed')"
      ><HysButton variant="secondary">内容挂载策略</HysButton
      ><template #content><Content /></template></HysTooltip
    ><output class="state-output"
      >挂载 {{ mounts }} 次 · {{ events.join(" → ") || "尚未打开" }}</output
    >
    <p class="scenario-note">
      show/hide 表示实际显示变化，opened/closed
      表示过渡结束。页面缓存停用时会清理浮层，返回后不会恢复过期的显示状态。
    </p>
  </div>
</template>
