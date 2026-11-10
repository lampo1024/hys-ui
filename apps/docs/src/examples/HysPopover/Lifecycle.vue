<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from "vue";
import { HysPopover, HysButton, HysCheckbox } from "hys-ui";
const retained = ref(true),
  warm = ref(false),
  mounts = ref(0),
  events = ref<string[]>([]);
const Content = defineComponent({
  setup() {
    const number = ref(0);
    onMounted(() => mounts.value++);
    return () =>
      h(
        HysButton,
        { onClick: () => number.value++ },
        () => "内容内部计数 " + number.value,
      );
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
    <HysPopover
      :destroy-on-hide="!retained"
      :force-render="warm"
      title="保留内容状态"
      @show="record('show')"
      @opened="record('opened')"
      @hide="record('hide')"
      @closed="record('closed')"
      ><template #trigger
        ><HysButton variant="secondary">内容挂载策略</HysButton></template
      ><Content /></HysPopover
    ><output class="state-output"
      >挂载 {{ mounts }} 次 · {{ events.join(" → ") || "尚未打开" }}</output
    >
    <p class="scenario-note">
      show/hide 表示实际显示变化，opened/closed
      表示过渡结束。页面缓存停用时会清理浮层，返回后不会恢复过期的显示状态。
    </p>
  </div>
</template>
