<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSelect, type HysSelectSearchContext } from "hys-ui";
const value = ref<number | null>(null),
  fail = ref(false),
  last = ref(""),
  records = [
    { value: 0, label: "Keller · 产品" },
    { value: 1, label: "Lisa · 研发" },
    { value: 2, label: "Amy · 质量" },
  ];
function load(query: string, { signal }: HysSelectSearchContext) {
  last.value = "请求：" + (query || "全部");
  return new Promise<typeof records>((resolve, reject) => {
    const stop = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      timer = setTimeout(() => {
        signal.removeEventListener("abort", stop);
        if (fail.value) reject(Error("模拟网络故障"));
        else
          resolve(
            records.filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase()),
            ),
          );
      }, 450);
    signal.addEventListener("abort", stop, { once: true });
    if (signal.aborted) stop();
  });
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="fail" label="模拟网络故障" /><label
      class="select-demo-field"
      ><span>自动管理加载与取消的远程搜索</span
      ><HysSelect
        v-model="value"
        :remote-method="load"
        :debounce="180"
        :clear-value="null"
        filterable
        clearable
        aria-label="自动远程成员"
        @search-error="last = '请求失败，可在浮层中重试'" /></label
    ><output class="state-output"
      >{{ last || "展开后加载成员" }} · 当前值：{{ value }}</output
    >
    <p class="scenario-note">
      remoteMethod
      返回选项数组即可，组件管理加载、异常及重试。新查询、关闭、禁用或离开缓存页面会中止旧请求；返回过晚的结果不会覆盖当前列表。
    </p>
  </div>
</template>
