# HYS UI

面向 Vue 3.5+ 的组件库，提供 TypeScript 类型、主题配置和独立的中文交互文档。

[在线文档与交互示例](https://lampo1024.github.io/hys-ui/)

## 安装

```bash
npm install hys-ui
```

```vue
<script setup lang="ts">
import { HysButton } from 'hys-ui'
import 'hys-ui/style.css'
</script>

<template>
  <HysButton round @click="console.log('confirmed')">确认</HysButton>
</template>
```

通过命名导入按需使用组件。组件源码、文件名、导出名统一采用 `HysXxxxx`。ESM 包的 Vue peer dependency 为 `>=3.5.0 <4`，无需 Vue Router。图标使用 Lucide outline，宿主项目可以传入自有图标。

## 主题和动效

在根组件 setup 中调用，参数可以是响应式 ref 或 getter。配置会传递给子组件与 Teleport 浮层。

```ts
import { ref } from 'vue'
import { provideHysConfig, type HysTheme } from 'hys-ui'

const theme = ref<HysTheme>('blue')
provideHysConfig({ theme, motion: 'subtle' })
```

主题支持 `blue / dark / green / purple / orange / forest`，动效支持 `full / subtle / off`，系统减少动态效果设置优先。组件库不会写入浏览器存储或修改全局页面主题。

可以使用 `--hys-ui-primary`、`--hys-ui-surface`、`--hys-ui-text`、`--hys-ui-border`、`--hys-ui-font-family` 等公开变量覆盖组件外观。组件类名与变量采用独立前缀，没有 body/html 全局重置。


浮层组件统一通过 `popupTransition` 设置展开与收起动效：`scale`（默认柔和缩放）、`fade`（淡入淡出）、`slide`（轻移）、`slide-fade`（轻移缩放）、`none`（关闭）。`popupTransitionDuration` 设置时长，默认 160ms，设为 0 立即切换。该配置适用于选择、日期、自动补全、提及、颜色、提示、菜单，以及表格、树形、头像组、日历事件和甘特图关系等浮层。Modal、Drawer 和 Toast 保留各自的动画配置。

```vue
<HysSelect
  v-model="value"
  :options="options"
  popup-transition="slide-fade"
  :popup-transition-duration="200"
/>
```

系统减少动态效果和 `motion: 'off'` 优先于局部设置；内嵌日期面板不播放浮层动效。动画仅改变透明度和合成层变换，关闭时立即停止交互，退出完成后移除内容。

## 开发与文档

```bash
npm install
npm run dev:docs
```

访问 http://127.0.0.1:5174。每个组件有独立路由、运行场景、源码、API 与说明，页面状态通过 KeepAlive 保留。API 从源码生成。

- `packages/ui`：唯一的组件源码及 npm 包。
- `apps/docs`：独立组件文档与交互示例。
- `tests`：核心行为回归。
- `scripts`：元信息提取、完整性检查、打包与发布验证。

```bash
npm run build:ui
npm run build:docs
npm test
npm run check:contracts
npm run check:release
```

`build:docs` 输出到 `apps/docs/dist`，部署服务需要将未知路径回退到 `index.html`。

在线文档通过 GitHub Pages 发布，推送到 `main` 后自动更新，也可在 Actions 中手动运行 `Publish component documentation`。`npm run build:docs:pages` 会生成组件页面的静态入口，支持详情页直接访问和刷新；部署到子目录时通过 `DOCS_BASE_PATH` 设置路径。

## 轻提示

轻提示默认显示在顶部中间，支持七种位置、五种状态和自定义内容。

```ts
import { useHysToast } from 'hys-ui'

// 在组件 setup 中使用
const toast = useHysToast({ maxCount: 5 })
toast.success('保存成功')
const task = toast.loading('正在上传…')
task.update({ type: 'success', message: '上传完成', duration: 2000 })
```

## 发布

根工作区和文档应用为私有，npm 包名为 `hys-ui`，版本 `0.2.0`，MIT 公开发布。

```bash
npm run pack:ui
npm login --registry=https://registry.npmjs.org/
npm run release:ui
```

发布流程先执行全部检查、打包和仓库外安装验证，再检查登录账号、包名/版本及压缩包 SHA256，发布同一个已验证压缩包到 `latest`。凭证通过 npm 本地交互管理，不写入仓库。

后续版本按语义化版本发布，并更新 CHANGELOG。暂不承诺 SSR/Nuxt 支持。

## 许可证

[MIT](LICENSE)
