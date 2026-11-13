<script setup lang="ts">
import { nextTick, ref } from "vue";
import { HysButton, HysPopconfirm } from "hys-ui";
const original = [
  { id: "RP-102", name: "库存盘点报告", group: "运营" },
  { id: "RP-103", name: "渠道数据汇总", group: "市场" },
  { id: "RP-104", name: "月末结算明细", group: "财务" },
];
const rows = ref([...original]),
  status = ref("当前有 3 份报告");
const region = ref<HTMLElement>();
async function remove(index: number) {
  const [removed] = rows.value.splice(index, 1);
  if (!removed) return;
  status.value = `已删除「${removed.name}」，剩余 ${rows.value.length} 份报告`;
  await nextTick();
  const buttons = region.value?.querySelectorAll<HTMLElement>(
    "[data-report-delete]",
  );
  const next = buttons?.[Math.min(index, rows.value.length - 1)];
  (
    next ?? region.value?.querySelector<HTMLElement>("[data-report-restore]")
  )?.focus();
}
function restore() {
  rows.value = [...original];
  status.value = "已恢复 3 份示例报告";
}
</script>

<template>
  <div ref="region" class="demo-stack">
    <div class="report-table">
      <table>
        <thead>
          <tr>
            <th scope="col">报告</th>
            <th scope="col">部门</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.group }}</td>
            <td>
              <HysPopconfirm
                :title="`删除「${row.name}」？`"
                description="这份报告将从列表中移除。"
                tone="danger"
                confirm-text="删除报告"
                placement="left"
                :restore-focus="false"
                @confirm="remove(index)"
              >
                <HysButton
                  size="sm"
                  variant="danger"
                  text
                  data-report-delete
                  :aria-label="'删除' + row.name"
                >
                  删除
                </HysButton>
              </HysPopconfirm>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="3">暂无报告</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="demo-control-actions">
      <HysButton variant="secondary" data-report-restore @click="restore"
        >恢复示例数据</HysButton
      >
    </div>
    <output class="state-output" aria-live="polite">{{ status }}</output>
  </div>
</template>

<style scoped>
.report-table {
  overflow: auto;
  border: 1px solid var(--docs-border);
  border-radius: 9px;
}
.report-table table {
  width: 100%;
  border-collapse: collapse;
  text-align: start;
  font-size: 13px;
}
.report-table :is(th, td) {
  padding: 8px 12px;
  text-align: start;
}
.report-table th {
  background: var(--docs-bg);
}
.report-table td {
  border-block-start: 1px solid var(--docs-border);
}
.report-table :is(th, td):last-child {
  width: 1%;
  white-space: nowrap;
}
</style>
