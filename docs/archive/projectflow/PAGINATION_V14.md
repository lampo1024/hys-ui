> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# HysPagination V14 使用说明

源码：`src/components/HysPagination/HysPagination.vue`。`HysDataGrid` 底部分页已统一复用该组件。

## Props

| 参数 | 类型 | 默认 | 描述 |
|---|---|---|---|
| page | number | 必填 | 当前页（从 1 开始） |
| total | number | 必填 | 总记录数 |
| pageSize | number | 10 | 每页条数 |
| pageSizeOptions | number[] | [10,20,50,100] | 条数候选项 |
| siblingCount | number | 1 | 当前页两侧页码数量，限制为 0–5 |
| showSizeChanger | boolean | false | 每页条数选择 |
| showQuickJumper | boolean | false | 页码跳转 |
| showTotal | boolean | true | 总记录数与当前范围 |
| compact | boolean | false | 简洁模式 |
| disabled | boolean | false | 禁用所有交互 |
| loading | boolean | false | 加载状态，禁用操作并标注 aria-busy |
| labels | object | 中文默认值 | 可自定义文案 |

## Events

- `change(page)`、`update:page(page)`：用户切换页码。
- `pageSizeChange(size)`、`update:pageSize(size)`：用户调整每页条数。
- 组件是受控组件：父组件必须同步更新 `page` / `pageSize`，或使用 `v-model:page` / `v-model:page-size`。

## 示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import HysPagination from '@/components/HysPagination/HysPagination.vue'
const page = ref(1)
const pageSize = ref(20)
</script>
<template>
  <HysPagination v-model:page="page" v-model:page-size="pageSize"
    :total="1560" show-size-changer show-quick-jumper />
</template>
```

## 边界行为

- 总数为 0 时仍保留逻辑上的第 1 页，显示 0–0 条，前后按钮禁用。
- 非法 page/pageSize 仅在显示计算时进行保护，不会在未操作时自动修改父组件状态。
- 页码超过最大页数时，显示值会被裁剪；父组件应在总数减少时主动同步页码。
- 每页条数变化时先发出条数事件；若旧页码超过新总页数，发出页码修正事件。DataGrid 会将页码重置为 1。
- 分页仅管理 UI 和事件，不负责网络请求；服务端模式由 DataGrid 的 `queryChange` 交给业务层执行。
- 移动端可使用 `compact` 模式；目前不会自动切换 compact，需由调用方设置。
