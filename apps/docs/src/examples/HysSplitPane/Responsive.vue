<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSplitPane,
  type HysSplitPaneLayout,
} from "hys-ui";

const narrow = ref(false);
const layout = ref<HysSplitPaneLayout>("horizontal");
const selected = ref("INC-104");
const tickets = [
  {
    id: "INC-104",
    title: "数据导出失败",
    owner: "数据平台",
    status: "处理中",
    description: "昨天新增了报表字段，正在检查导出模板的字段映射。",
  },
  {
    id: "INC-105",
    title: "修复筛选条件",
    owner: "业务应用",
    status: "待验收",
    description: "已修复日期筛选边界，请验收跨月查询结果。",
  },
  {
    id: "INC-106",
    title: "更新权限说明",
    owner: "基础平台",
    status: "已完成",
    description: "权限说明已更新，新增只读角色和审计角色的示例。",
  },
];
const current = computed(() =>
  tickets.find((ticket) => ticket.id === selected.value)!,
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="narrow" label="缩窄预览容器" />
      <span class="ticket-layout"
        >当前为{{ layout === "vertical" ? "上下布局" : "左右布局" }}</span
      >
    </div>
    <HysSplitPane
      :class="{ 'ticket-narrow': narrow }"
      class="ticket-split"
      :default-value="42"
      :responsive-breakpoint="540"
      :first-panel="{ min: '28%', max: '65%' }"
      aria-label="调整工单列表与详情"
      @layout-change="layout = $event"
    >
      <template #first>
        <section class="ticket-list">
          <h4>工单列表</h4>
          <HysButton
            v-for="ticket in tickets"
            :key="ticket.id"
            size="sm"
            :variant="selected === ticket.id ? 'secondary' : 'ghost'"
            :aria-pressed="selected === ticket.id"
            @click="selected = ticket.id"
            >{{ ticket.title }}</HysButton
          >
        </section>
      </template>
      <template #second>
        <article class="ticket-detail">
          <small>{{ current.id }} · {{ current.status }}</small>
          <h4>{{ current.title }}</h4>
          <p>{{ current.description }}</p>
          <span>负责团队 · {{ current.owner }}</span>
        </article>
      </template>
    </HysSplitPane>
  </div>
</template>

<style scoped>
.ticket-split {
  height: 292px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 10px;
}
.ticket-split[data-layout="vertical"] {
  height: 356px;
}
.ticket-split.ticket-narrow {
  width: min(100%, 392px);
}
.ticket-list,
.ticket-detail {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 14px;
  min-block-size: 100%;
}
.ticket-list {
  background: var(--hys-ui-theme-surface-alt);
}
.ticket-list > [data-hys-ui] {
  justify-self: start;
  max-inline-size: 100%;
}
.ticket-list h4,
.ticket-detail h4,
.ticket-detail p {
  margin: 0;
  overflow-wrap: anywhere;
}
.ticket-detail span,
.ticket-detail small,
.ticket-layout {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
