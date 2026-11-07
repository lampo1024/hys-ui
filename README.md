# HYS UI

69 个独立的 Vue 3.5+ 组件，提供 TypeScript 类型、六套主题和独立的中文交互文档。

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

## 开发与文档

```bash
npm install
npm run dev:docs
```

访问 http://127.0.0.1:5174。每个组件有独立路由、运行场景、源码、API 与说明，页面状态通过 KeepAlive 保留。API 从源码生成。

- `packages/ui`：唯一的组件源码及 npm 包。
- `apps/docs`：独立文档应用，包含 69 个组件页面。
- `tests`：核心行为回归。
- `scripts`：元信息提取、完整性检查、打包与发布验证。

```bash
npm run build:ui
npm run build:docs
npm test
npm run check:contracts
npm run check:release
```

`build:docs` 输出到 `apps/docs/dist`，部署服务需要将未知路径回退到 `index.html`。本仓库独立于项目治理平台，平台仅作为组件库的使用方。

## 功能对标

参考 Element Plus、Ant Design Vue、Naive UI 的成熟使用模式，覆盖所有能找到同类组件的核心场景。具体对应项、能力边界和高级能力迭代见 [组件能力对标](docs/COMPONENT_PARITY.md)。HYS UI 保持自己的 API，不提供这三家组件库的直接替换兼容层。

## 发布

根工作区和文档应用为私有，npm 包名为 `hys-ui`，首版 `0.1.0`，MIT 公开发布。

```bash
npm run pack:ui
npm login --registry=https://registry.npmjs.org/
npm run release:ui
```

发布流程先执行全部检查、打包和仓库外安装验证，再检查登录账号、包名/版本及压缩包 SHA256，发布同一个已验证压缩包到 `latest`。凭证通过 npm 本地交互管理，不写入仓库。

后续版本按语义化版本发布，并更新 CHANGELOG。暂不承诺 SSR/Nuxt 支持。

## 许可证

[MIT](LICENSE)
