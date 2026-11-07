<script setup lang="ts">
import { ref } from 'vue';
import { HysDataGrid, type GridColumn } from 'hys-ui';
import { HysSelect } from 'hys-ui';
import { HysButton } from 'hys-ui';
import { HysBadge } from 'hys-ui';
import { HysProgress } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const grid = ref<InstanceType<typeof HysDataGrid>>();
const columns: GridColumn[] = [
    { key: 'id', label: '编号', width: 120, pinned: 'left' },
    { key: 'name', label: '任务名称', width: 260 },
    { key: 'project', label: '所属项目', width: 180 },
    { key: 'owner', label: '负责人', width: 100 },
    { key: 'status', label: '状态', width: 120 },
    { key: 'priority', label: '优先级', width: 100 },
    { key: 'progress', label: '进度', width: 150, summary: 'avg' },
    { key: 'date', label: '计划日期', width: 150, pinned: 'right' }
];
const projects = ['药品中心 V2.0', '会员数据平台', 'Medical OneID', '处方审方系统', '统一支付平台', '研发效能平台'];
const owners = ['张工', '李工', '王工', '陈工', '刘工', '赵工', '孙工', '周工'];
const titles = ['完成数据库表结构设计', '实现接口权限控制', '优化数据同步任务', '完成 UI 交互验收', '接入统一登录服务', '补充接口自动化测试', '优化报表查询性能', '实现消息通知模块', '修复移动端适配问题', '编写发布回滚方案', '完成安全审计整改', '配置应用监控告警', '实现批量导入功能'];
const statuses = ['待办', '进行中', '待评审', '待测试', '已完成', '已延期'];
const rows = Array.from({ length: 156 }, (_, index) => {
    const status = statuses[Math.floor(index / 3) % statuses.length];
    return {
        id: 'TASK-' + String(index + 1).padStart(4, '0'),
        name: titles[index % titles.length],
        project: projects[Math.floor(index / 2) % projects.length],
        owner: owners[(index * 3 + Math.floor(index / 8)) % owners.length],
        status, priority: ['高', '中', '低'][Math.floor(index / 4) % 3],
        progress: status === '已完成' ? 100 : status === '待办' ? 0 : status === '待评审' ? 80 : status === '待测试' ? 90 : 15 + (index * 13) % 60,
        date: '2026-' + String(10 + Math.floor(index / 52)).padStart(2, '0') + '-' + String(index % 28 + 1).padStart(2, '0')
    };
});
const statusTones = { 待办: 'gray', 进行中: 'blue', 待评审: 'purple', 待测试: 'orange', 已完成: 'green', 已延期: 'red' } as const;
const message = ref('');
const density = ref('normal');
const densityOptions = [{ label: '紧凑', value: 'compact' }, { label: '标准', value: 'normal' }, { label: '宽松', value: 'comfortable' }];
function restoreColumns() { grid.value?.resetColumns(); message.value = '已恢复全部 8 列'; }
const demoConfig = demoReactive<{
    pageSize: number;
    selectable: boolean;
    loading: boolean;
    emptyText: string;
    density: "normal" | "compact" | "comfortable";
    multiSort: boolean;
    stickyHeader: boolean;
    groupable: boolean;
    showSummary: boolean;
}>({ "pageSize": 10, "selectable": true, "loading": false, "emptyText": "暂无数据", "density": "normal", "multiSort": false, "stickyHeader": false, "groupable": false, "showSummary": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">pageSize<DemoNumber v-model="demoConfig.pageSize" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.selectable" label="selectable"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/><label class="demo-field">emptyText<DemoInput v-model="demoConfig.emptyText"/></label><label class="demo-field">density<DemoSelect :model-value="demoConfig.density" @update:model-value="demoConfig.density=$event as typeof demoConfig.density" :options='[{"label":"normal","value":"normal"},{"label":"compact","value":"compact"},{"label":"comfortable","value":"comfortable"}]'/></label><DemoCheckbox v-model="demoConfig.multiSort" label="multiSort"/><DemoCheckbox v-model="demoConfig.stickyHeader" label="stickyHeader"/><DemoCheckbox v-model="demoConfig.groupable" label="groupable"/><DemoCheckbox v-model="demoConfig.showSummary" label="showSummary"/></div><div class="demo-content">
 <div class="page">

  <div class="grid-demo-controls">
   <span>表格密度</span><HysSelect v-model="density" aria-label="表格密度" :options="densityOptions"/>
   <HysButton variant="secondary" size="sm" @click="restoreColumns">恢复默认列</HysButton>
   <span class="grid-demo-message" role="status">{{message}}</span>
  </div>
  <HysDataGrid v-bind="demoConfig" ref="grid" :columns="columns" :rows="rows" storage-key="hys-docs-data-grid-configure"       @row-click="row=>message='已点击 '+row.id" @selection-change="keys=>message='已选 '+keys.length+' 条'">
   <template #status="{value}"><HysBadge :tone="statusTones[value as keyof typeof statusTones]||'gray'">{{value}}</HysBadge></template>
   <template #priority="{value}"><HysBadge :tone="value==='高'?'red':value==='中'?'orange':'gray'">{{value}}</HysBadge></template>
   <template #progress="{value}"><HysProgress :value="Number(value)" :color="Number(value)===100?'var(--green)':undefined"/></template>
  </HysDataGrid>
  <p class="grid-demo-hint">拖动表头调整列顺序，拖动右侧边缘调整列宽。列设置会自动保存，点击“恢复默认列”可重新显示全部字段。</p>
 </div>
</div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
<style scoped>
.grid-demo-controls{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:20px 0}
.grid-demo-controls :deep(.hys-ui-select-wrap){width:118px;min-width:118px}
.grid-demo-message,.grid-demo-hint{color:var(--hys-ui-muted,#7b879e);font-size:12px}
.grid-demo-hint{margin-top:16px}
</style>
