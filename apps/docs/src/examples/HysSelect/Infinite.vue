<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, ref } from "vue";
import { HysButton, HysSelect } from "hys-ui";
const all = Array.from({ length: 3000 }, (_, value) => ({
    label: "成员 " + String(value + 1).padStart(4, "0"),
    value,
  })),
  options = ref(all.slice(0, 200)),
  value = ref<number | null>(null),
  loading = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined,
  live = true;
function load() {
  if (loading.value || !live || options.value.length >= all.length) return;
  loading.value = true;
  timer = setTimeout(() => {
    if (live) options.value = all.slice(0, options.value.length + 100);
    loading.value = false;
  }, 400);
}
function stop() {
  live = false;
  clearTimeout(timer);
  loading.value = false;
}
onActivated(() => {
  live = true;
});
onDeactivated(stop);
onBeforeUnmount(stop);
</script>
<template>
  <div class="demo-content">
    <label class="select-demo-field"
      ><span>滚动至末尾自动追加数据，也可使用底部按钮</span
      ><HysSelect
        v-model="value"
        :options="options"
        :list-height="252"
        :popup-width="340"
        :clear-value="null"
        clearable
        aria-label="分页加载成员"
        @reach-end="load"
        ><template #footer
          ><div class="load-more">
            <span>已加载 {{ options.length }} 条</span
            ><HysButton
              size="sm"
              variant="ghost"
              :loading="loading"
              :disabled="options.length >= all.length"
              @click="load"
              >{{
                options.length >= all.length ? "已加载全部" : "加载更多"
              }}</HysButton
            >
          </div></template
        ></HysSelect
      ></label
    ><output class="state-output"
      >当前成员：{{ value === null ? "未选择" : value }} · 已加载
      {{ options.length }} 条</output
    >
    <p class="scenario-note">
      追加期间将加载反馈放在 footer，保留原有列表和滚动位置。reachEnd
      触发加载请求，调用方控制分页、并发与数据合并；离开页面会取消尚未完成的演示加载。
    </p>
  </div>
</template>
<style scoped>
.load-more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--docs-muted);
  font-size: 12px;
}
</style>
