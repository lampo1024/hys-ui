# HYS UI

HYS UI 是面向管理后台和业务应用的 Vue 3 组件库。用它搭建筛选表单、数据列表和项目排期界面。组件支持按需导入、TypeScript 类型提示和主题定制。

[在线文档与交互示例](https://lampo1024.github.io/hys-ui/) · [npm](https://www.npmjs.com/package/hys-ui) · [更新记录](https://github.com/lampo1024/hys-ui/blob/main/packages/ui/CHANGELOG.md)

## 按场景找组件

每个组件的文档都可以直接试用。展开示例即可复制 Vue 源码，属性、事件和插槽见该页的 API 参考。

| 场景 | 可以做什么 | 在线示例 |
| --- | --- | --- |
| 表单与输入 | 配置字段联动、异步校验、远程搜索和多选。 | [表单](https://lampo1024.github.io/hys-ui/components/hys-form/) · [下拉选择](https://lampo1024.github.io/hys-ui/components/hys-select/) · [自动补全](https://lampo1024.github.io/hys-ui/components/hys-autocomplete/) |
| 层级与批量选择 | 按层级挑选分类，在两侧列表之间批量移动成员。 | [树形选择](https://lampo1024.github.io/hys-ui/components/hys-tree-select/) · [穿梭框](https://lampo1024.github.io/hys-ui/components/hys-transfer/) |
| 日期与排期 | 按日期或周筛选，拖动甘特任务、连接前置依赖、查看排期冲突。 | [日期选择](https://lampo1024.github.io/hys-ui/components/hys-date-picker/) · [日期范围](https://lampo1024.github.io/hys-ui/components/hys-date-range-picker/) · [甘特图](https://lampo1024.github.io/hys-ui/components/hys-gantt/) |
| 弹层与反馈 | 在对话框中编辑长表单，用抽屉查看详情，用轻提示反馈操作结果。 | [对话框](https://lampo1024.github.io/hys-ui/components/hys-modal/) · [抽屉](https://lampo1024.github.io/hys-ui/components/hys-drawer/) · [轻提示](https://lampo1024.github.io/hys-ui/components/hys-toast/) |
| 文件与进度 | 选择文件、控制上传队列，显示进度、失败和重试状态。 | [文件上传](https://lampo1024.github.io/hys-ui/components/hys-upload/) · [进度条](https://lampo1024.github.io/hys-ui/components/hys-progress/) |

### 三种表格怎么选

- **`HysTable`** 适合常规列表和树形数据。支持固定列、展开行、合并单元格、表尾汇总和分页。[表格示例](https://lampo1024.github.io/hys-ui/components/hys-table/)
- **`HysDataGrid`** 适合让用户自行筛选和整理数据。支持按列搜索、拖拽调整列顺序、列显隐、分组、CSV 导出和服务端查询。[高级表格示例](https://lampo1024.github.io/hys-ui/components/hys-data-grid/)
- **`HysVirtualTable`** 适合需要连续滚动的大数据列表。按视口渲染行，也可开启列虚拟化。支持固定行列和滚动加载。[虚拟表格示例](https://lampo1024.github.io/hys-ui/components/hys-virtual-table/)

例如，任务管理页可以用日期范围和多选下拉框筛选任务，用高级表格展示结果，用对话框编辑记录。需要调整计划时，可以在甘特图里拖动任务、查看前置依赖和撤销排期修改。

## 快速开始

适用于 Vue 3.5+ 浏览器应用。通过 ESM 命名导入使用组件，无需全局注册或安装 Vue Router。

```bash
npm install hys-ui
```

把下面的任务状态选择示例放到任意 Vue 页面即可运行。项目中可以把 `hys-ui/style.css` 移到应用入口统一导入。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect } from 'hys-ui'
import 'hys-ui/style.css'

const status = ref('all')
const options = [
  { label: '全部状态', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'in-progress' },
  { label: '已完成', value: 'done' },
]
</script>

<template>
  <HysSelect v-model="status" :options="options" aria-label="任务状态" />
  <p>当前状态值：{{ status }}</p>
</template>
```

## 用轻提示反馈操作结果

在组件的 `<script setup>` 里调用 `useHysToast()`，即可在保存、上传等操作后显示提示。下面用定时器模拟上传，完成后更新同一条消息。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { HysButton, useHysToast } from 'hys-ui'
import 'hys-ui/style.css'

const toast = useHysToast()
const uploading = ref(false)

async function simulateUpload() {
  uploading.value = true
  const message = toast.loading('正在上传…')

  await new Promise(resolve => setTimeout(resolve, 700))

  message.update({ type: 'success', message: '上传完成', duration: 2000 })
  uploading.value = false
}
</script>

<template>
  <HysButton :loading="uploading" @click="simulateUpload">模拟上传</HysButton>
</template>
```

轻提示默认在顶部居中。可设置显示位置、停留时长和队列上限，也可以合并重复消息。[轻提示 API 与示例](https://lampo1024.github.io/hys-ui/components/hys-toast/)

## 主题与动效

在根组件的 `<script setup>` 中调用 `provideHysConfig`，下级组件及其浮层会继承配置。主题支持响应式切换。

```ts
import { ref } from 'vue'
import { provideHysConfig, type HysTheme } from 'hys-ui'

const theme = ref<HysTheme>('blue')
provideHysConfig({ theme, motion: 'subtle' })
```

内置主题有 `blue`、`dark`、`green`、`purple`、`orange` 和 `forest`。可用 `--hys-ui-primary`、`--hys-ui-surface` 等 CSS 变量调整外观。动效可设为 `full`、`subtle` 或 `off`，并遵循系统的减少动态效果设置。支持浮层动效的组件还可以单独设置 `popup-transition` 和 `popup-transition-duration`。

## 本地开发

仓库使用 npm workspaces。`packages/ui` 存放组件源码，`apps/docs` 存放文档和示例。使用 Node.js 22 启动文档。

```bash
npm ci
npm run dev:docs
```

开发站点默认监听 [127.0.0.1:5174](http://127.0.0.1:5174/)。

| 命令 | 用途 |
| --- | --- |
| `npm run build:ui` | 构建组件包和类型声明 |
| `npm run build:docs` | 构建文档到 `apps/docs/dist` |
| `npm test` | 运行组件回归测试 |
| `npm run check:contracts` | 检查组件导出和文档完整性 |
| `npm run check:release` | 检查构建、测试、打包与独立安装 |

推送到 `main` 会触发 [GitHub Pages 部署](.github/workflows/docs-pages.yml)。npm 发布通过 [`npm run release:ui`](scripts/release.mjs) 执行，脚本会发布通过检查的压缩包并核对 registry 上的完整性。

## 问题反馈

提交问题时，可以附上 Vue 和 hys-ui 版本、复现步骤，以及能复现问题的代码或示例链接。[GitHub Issues](https://github.com/lampo1024/hys-ui/issues)

## 许可证

[MIT](LICENSE)
