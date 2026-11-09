<script setup lang="ts">
import { ref } from "vue";
import { HysCard, HysButton, HysBadge } from "hys-ui";
const active = ref<string | number>("overview"),
  events = ref("尚未切换");
const tabs = [
  { value: "overview", label: "概览" },
  { value: "activity", label: "动态" },
  { value: "restricted", label: "权限设置", disabled: true },
];
</script>
<template>
  <div class="demo-stack">
    <HysCard
      v-model:active-tab="active"
      title="团队空间"
      :tabs="tabs"
      tabs-label="团队空间内容"
      @tab-change="events = '当前页签：' + $event"
    >
      <template #tab="{ tab }"
        ><span>{{ tab.label }}</span
        ><HysBadge v-if="tab.value === 'activity'" :value="3"
      /></template>
      <template #tab-extra
        ><HysButton size="sm" variant="ghost" @click="active = 'overview'"
          >回到概览</HysButton
        ></template
      >
      <template #default="{ activeTab }"
        ><p>
          {{
            activeTab === "overview"
              ? "查看团队的近期工作和协作信息。"
              : "今天新增了三个协作动态。"
          }}
        </p></template
      >
    </HysCard>
    <HysCard
      :tabs="[
        { label: '基本信息', value: 0 },
        { label: '使用说明', value: 1 },
      ]"
      :default-active-tab="1"
    >
      <template #default="{ activeTab }"
        ><p>
          {{
            activeTab === 0
              ? "支持数字和字符串页签值。"
              : "未绑定 activeTab 时，由卡片维护当前页签。"
          }}
        </p></template
      >
    </HysCard>
  </div>
  <output>{{ events }}</output>
  <p class="hint">
    使用左右方向键、Home 和 End 切换页签，自动跳过禁用项。自定义内容通过插槽的
    activeTab 读取当前值。
  </p>
</template>
