> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V13 DataGrid 集中增强说明

## 本次新增
- 树形表格：`tree-mode`、`parent-key`、`row-key`；父子节点展开折叠，按父 ID 构造层级；对循环引用做访问去重。
- 单元格编辑：启用 `editable` 且列设置 `editable: true`，双击单元格进入编辑，Enter/失焦提交，Escape 取消，发出 `cellEdit` 事件。组件不直接修改传入行，父组件持久化后更新 `rows`。
- 批量编辑：选择行后选择可编辑字段并输入新值，发出 `batchEdit`，父组件负责权限、校验和保存。

## 事件
```ts
cellEdit: {row: Record<string,unknown>; rowKey: string|number; column:string; value:string}
batchEdit: {keys:(string|number)[]; column:string; value:string}
```

## 重要限制
- 树形数据当前为客户端平铺显示；分页按平铺结果处理，父节点可能位于其他页；建议树形模式使用较大 pageSize。
- 服务端树形数据需由后端提供完整当前层级；不支持懒加载。
- 编辑仅发出事件，不提供乐观更新、后端回滚或复杂校验。
- 真正的 XLSX 导出、动态行高虚拟滚动、触屏列拖拽及多级分组尚未实现。不要将 CSV 改称 XLSX。
- 构建和浏览器测试结果以实际运行结果为准。
