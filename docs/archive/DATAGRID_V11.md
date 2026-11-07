> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V11 DataGrid 增强说明

## 新增功能
- 左右固定列：列定义 `pinned: 'left' | 'right'`，支持随列宽变化动态计算偏移；注意固定列背景与层级。
- 粘性表头：`stickyHeader`；表格位于横向滚动容器内，适合限制高度的场景。
- 多列排序：`multiSort`，依次点击不同表头叠加排序；第三次点击同一列取消。
- 服务端数据模式：`serverMode`、`totalRows`、`page`；服务端传入当前页数据，监听 `queryChange` 获取分页、排序、搜索和过滤条件并请求接口。服务端模式不再对当前页执行本地筛选排序。
- 每页条数：10、12、20、50、100，触发 `pageSizeChange`。
- 数据变化时清理已不存在的行选择（本地模式）。

## 服务端使用示例
```vue
<HysDataGrid :columns="columns" :rows="pageRows" :server-mode="true"
  :total-rows="total" :page="currentPage" :page-size="20"
  :multi-sort="true" @query-change="loadRows" />
```

`loadRows` 接收 `{page,pageSize,sort,search,filters}`。异步请求应在父组件使用 AbortController 或请求序号防止旧响应覆盖新响应。

## 已知限制
- 固定列与列拖拽的交互规则仍需浏览器回归；列配置中的固定位置由列定义控制，尚无运行时固定/取消固定菜单。
- 尚无动态行高虚拟滚动、分组聚合、树形表格、Excel 原生文件导出。
- 本版未运行完整浏览器端到端测试，生产使用前需验证大量列、触屏、缩放和各主题。
