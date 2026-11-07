> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V15 企业级组件库

新增 21 个组件，**不包含 HysWorkflowDesigner**。本版均为不依赖第三方 UI 库的 Vue 3 单文件组件。

| 组件 | 路径 | 核心接口 | 说明 |
|---|---|---|---|
| HysForm | `src/components/HysForm/HysForm.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysFormItem | `src/components/HysFormItem/HysFormItem.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysSplitPane | `src/components/HysSplitPane/HysSplitPane.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysResizablePanel | `src/components/HysResizablePanel/HysResizablePanel.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysContextMenu | `src/components/HysContextMenu/HysContextMenu.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysNotificationCenter | `src/components/HysNotificationCenter/HysNotificationCenter.vue` | 详见组件 defineProps / defineEmits / defineModel | 本地演示，不含后端服务 |
| HysMention | `src/components/HysMention/HysMention.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysKanban | `src/components/HysKanban/HysKanban.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysRichTextEditor | `src/components/HysRichTextEditor/HysRichTextEditor.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysFileManager | `src/components/HysFileManager/HysFileManager.vue` | 详见组件 defineProps / defineEmits / defineModel | 本地演示，不含后端服务 |
| HysCalendar | `src/components/HysCalendar/HysCalendar.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysCommentEditor | `src/components/HysCommentEditor/HysCommentEditor.vue` | 详见组件 defineProps / defineEmits / defineModel | 本地演示，不含后端服务 |
| HysChart | `src/components/HysChart/HysChart.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysDiffViewer | `src/components/HysDiffViewer/HysDiffViewer.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysJsonEditor | `src/components/HysJsonEditor/HysJsonEditor.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysCronEditor | `src/components/HysCronEditor/HysCronEditor.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysOrgTree | `src/components/HysOrgTree/HysOrgTree.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysPermissionMatrix | `src/components/HysPermissionMatrix/HysPermissionMatrix.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysTour | `src/components/HysTour/HysTour.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysShortcutHelp | `src/components/HysShortcutHelp/HysShortcutHelp.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |
| HysColorTokenEditor | `src/components/HysColorTokenEditor/HysColorTokenEditor.vue` | 详见组件 defineProps / defineEmits / defineModel | 基础交互实现 |

## 接入示例
```vue
<script setup lang="ts">
import {ref} from 'vue'
import HysMention from './components/HysMention/HysMention.vue'
const content=ref('')
const users=[{id:'u1',name:'张工'}]
</script>
<template><HysMention v-model="content" :users="users"/></template>
```

## 限制与生产化工作
- 富文本编辑器使用浏览器原生 contenteditable/execCommand，仅为基础演示；不具备 HTML 清理、协同编辑、图片上传或 Markdown 双向转换。**展示用户生成 HTML 前必须使用可信 HTML Sanitizer**。
- 文件管理器只发出 upload/remove/download 事件，不负责服务端存储、权限、断点续传或病毒扫描。
- 日历目前为月视图；无日周视图、时区处理、拖动排期和冲突检测。
- 组织树仅渲染最多三级；大型组织架构需递归树及虚拟化。
- DiffViewer 为行号位置对比，不是 LCS/语义差异算法。
- CronEditor 仅检查五段语法外形，不验证 cron 语义和时区。
- 图表为基础 SVG/CSS 示例，不具备完整坐标轴、无障碍数据表和导出。
- Tour 为简易全屏步骤引导，尚未实现锚点高亮、焦点陷阱和滚动锁。
- Kanban 支持桌面拖放及 select 替代操作，触屏拖拽需进一步实现。
- 复杂组件仍需无障碍审计、跨浏览器自动化测试和生产级错误处理。
