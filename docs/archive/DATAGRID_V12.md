> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V12 · DataGrid 分组与汇总增强

## 新增功能

- `groupable?: boolean`：启用工具栏「按列分组」，支持单列分组、展开/折叠分组。分组仅针对当前页的行，服务端模式不执行跨页分组。
- `showSummary?: boolean`：启用表尾汇总行；汇总范围为当前前端筛选后的全部记录（客户端模式），或服务端返回的当前页数据（服务端模式）。
- `GridColumn.summary?: 'sum' | 'avg' | 'min' | 'max' | 'count'`：定义汇总算法，忽略空值，数值汇总忽略非数字。
- 维持 V11 的固定列、列宽调整、列排序、列显隐、查询事件、CSV 导出等能力。

## 示例

```vue
<HysDataGrid :columns="columns" :rows="rows" groupable show-summary />
```

```ts
const columns = [
  { key: 'status', label: '状态' },
  { key: 'hours', label: '工时', summary: 'sum' },
  { key: 'progress', label: '进度', summary: 'avg' }
]
```

## 边界与限制

1. 分组是当前页内的视觉分组，不等于服务端全量数据分组；多级分组尚未支持。
2. 汇总为本地计算；需要服务端全量统计时应由 API 返回汇总值，不能将当前页汇总冒充全量汇总。
3. Excel 原生 XLSX 导出、树形表格、批量编辑、动态行高虚拟滚动仍未实现。
4. 请运行 `npm install && npm run build`，并在目标浏览器验证固定列与分组行的组合表现。
