<script setup lang="ts">
import { computed, h, ref } from "vue";
import { CircleAlert, TriangleAlert } from "lucide-vue-next";
import {
  HysBadge,
  HysProGrid,
  type HysProGridColumn,
  type HysProGridEditHandler,
  type HysProGridChange,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import { createProGridConditionalFormat } from "hys-ui/pro-grid/conditional-format";
import "hys-ui/pro-grid/conditional-format.css";

interface Budget {
  id: string;
  project: string;
  limit: number;
  requested: number;
  stage: "pending" | "approved";
}
const rows = ref<Budget[]>([
  {
    id: "A-01",
    project: "数据平台续费",
    limit: 80000,
    requested: 56000,
    stage: "pending",
  },
  {
    id: "A-02",
    project: "客服培训",
    limit: 25000,
    requested: 27000,
    stage: "pending",
  },
  {
    id: "A-03",
    project: "机房设备更新",
    limit: 50000,
    requested: 46000,
    stage: "approved",
  },
]);
const attempts = new Set<string>();
const feedback = ref("");
const approved = computed(
  () => rows.value.filter((row) => row.stage === "approved").length,
);
const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

function budgetRisk({ requested, limit }: Budget) {
  if (requested > limit) return "over";
  if (requested >= limit * 0.9) return "near";
}

const cellClassName = createProGridConditionalFormat<Budget>([
  {
    columnKey: "requested",
    when: ({ row }) => budgetRisk(row) === "over",
    tone: "danger",
  },
  {
    columnKey: "requested",
    when: ({ row }) => budgetRisk(row) === "near",
    tone: "warning",
  },
]);

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

const columns: HysProGridColumn<Budget>[] = [
  {
    key: "project",
    label: "项目",
    width: 132,
    pinned: "left",
    pinnable: false,
  },
  {
    key: "requested",
    label: "申请金额",
    width: 140,
    align: "right",
    formatter: ({ row }) => money.format(row.requested),
    render: ({ row }) => {
      const risk = budgetRisk(row);
      return h("span", { class: "budget-amount" }, [
        risk &&
          h(risk === "over" ? CircleAlert : TriangleAlert, {
            size: 13,
            "aria-hidden": "true",
          }),
        money.format(row.requested),
        risk &&
          h(
            "span",
            { class: "budget-sr-only" },
            risk === "over" ? "，超出额度" : "，接近额度",
          ),
      ]);
    },
    editor: { type: "number", min: 1 },
    canEdit: ({ row }) => row.stage === "pending",
    async validate(change, { signal }) {
      await delay(350, signal);
      if (
        change.editor === "number" &&
        change.value != null &&
        change.value > change.row.limit
      )
        return `申请金额不能超过 ${money.format(change.row.limit)}`;
      return true;
    },
  },
  {
    key: "limit",
    label: "可用额度",
    width: 132,
    align: "right",
    formatter: ({ row }) => money.format(row.limit),
  },
  {
    key: "stage",
    label: "审批状态",
    width: 118,
    filterable: false,
    render: ({ row }) =>
      h(HysBadge, {
        status: row.stage === "approved" ? "success" : "warning",
        text: row.stage === "approved" ? "已通过" : "待审批",
      }),
  },
];

const save: HysProGridEditHandler<Budget> = async (change, { signal }) => {
  await delay(450, signal);
  if (!attempts.has(change.row.id)) {
    attempts.add(change.row.id);
    return "审批服务暂不可用，申请金额已保留，可重试保存。";
  }
  return true;
};

function commit(change: HysProGridChange<Budget>) {
  if (change.editor !== "number" || change.value == null) return;
  const requested = change.value;
  rows.value = rows.value.map((row) =>
    row.id === change.rowKey ? { ...row, requested } : row,
  );
  feedback.value = `${change.row.project}已保存，申请金额 ${money.format(requested)}`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="budget-overview">
      <div class="budget-counts">
        <span
          ><strong>{{ rows.length - approved }}</strong> 项待审批</span
        >
        <span
          ><strong>{{ approved }}</strong> 项已通过</span
        >
      </div>
      <div class="budget-legend" aria-label="金额高亮图例">
        <span
          ><TriangleAlert
            :size="14"
            class="budget-near"
            aria-hidden="true"
          />接近额度</span
        >
        <span
          ><CircleAlert
            :size="14"
            class="budget-over"
            aria-hidden="true"
          />超出额度</span
        >
      </div>
    </div>
    <HysProGrid
      :rows="rows"
      :columns="columns"
      row-key="id"
      :grid-options="{
        selectable: false,
        defaultQuery: { pageSize: 10 },
        cellClassName,
      }"
      :save-cell="save"
      @edit-start="feedback = ''"
      @cell-commit="commit"
    />
    <output v-if="feedback" class="state-output" role="status">{{
      feedback
    }}</output>
    <p class="scenario-note">
      申请金额达到额度的 90%
      时显示黄色，超出额度时显示红色。试着把“客服培训”改为
      ¥24,000。首次保存会模拟失败，重试成功后红色会变为黄色。
    </p>
  </div>
</template>

<style scoped>
.budget-overview,
.budget-counts,
.budget-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  color: var(--docs-muted);
  font-size: 13px;
}
.budget-overview {
  justify-content: space-between;
}
.budget-legend > span,
:deep(.budget-amount) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.budget-near,
:deep(.hys-ui-pro-grid-format-warning .budget-amount > svg) {
  color: var(--hys-ui-orange, var(--hys-ui-theme-orange, #a16207));
}
.budget-over,
:deep(.hys-ui-pro-grid-format-danger .budget-amount > svg) {
  color: var(--hys-ui-red, var(--hys-ui-theme-red, #b91c1c));
}
:deep(.budget-sr-only) {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  clip-path: inset(50%);
  overflow: hidden;
}
.budget-overview strong {
  color: var(--docs-text);
  font-size: 17px;
  font-variant-numeric: tabular-nums;
}
</style>
