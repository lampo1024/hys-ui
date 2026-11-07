# ProjectFlow · 项目治理平台（Vue 3 + TypeScript）

完整的**前端交互演示项目**，依据科技蓝项目管理系统设计稿制作。包含 11 个业务/设计系统页面、19 个独立封装的自定义 UI 组件、6 套主题和模拟业务数据。

## 启动

要求 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

访问终端显示的本地地址（默认 http://localhost:5173）。

```bash
npm run build
npm run preview
```

> 当前交付环境未能完成依赖安装与实际构建验证，请在联网的本地环境运行上述命令验证。若安装依赖失败，可更换 npm 镜像。

## 页面

- 工作台：指标、项目进度、燃尽图、待办、项目健康度
- 项目管理：项目列表、搜索、筛选、创建项目、项目详情、生命周期
- 需求管理：需求列表、状态筛选、新增需求
- 迭代管理：Sprint 看板，支持拖拽更新任务状态
- 任务管理：任务列表、甘特图、创建任务、详情抽屉、状态编辑
- 代码审查：审查列表、审查详情、通过审查
- 缺陷管理：缺陷统计、筛选、新增缺陷
- 发布管理：发布步骤、发布检查清单、环境状态
- 项目治理：Gate 检查与流程阶段
- 组件设计系统：组件状态和交互演示

## 自定义组件（各自独立文件夹）

`src/components/`：HysButton、HysInput、HysSelect、HysModal、HysDrawer、HysBadge、HysCard、HysProgress、HysTabs、HysCheckbox、HysSwitch、HysToast、HysPopover、HysTable、HysPagination、HysTooltip、HysDatePicker、HysUpload、HysSkeleton。

所有交互组件均为自研 Vue SFC，没有引入 Naive UI、Element Plus、Ant Design Vue 等第三方 UI 组件。**lucide-vue-next 仅用于 SVG 图标**，不是 UI 组件库。组件封装使用 props、emits、slots、v-model；支持不同状态和键盘基本操作。

## 主题

`src/composables/useTheme.ts` 管理主题，`src/styles/main.css` 定义 CSS Variables。支持科技蓝、深色科技、清新绿、紫色极简、暖橙商务、森林暗色，选择持久化到 localStorage。

## 目录

```text
src/
  components/          # 19 个独立文件夹，自定义 UI 组件
  composables/          # 主题状态
  data/                 # 演示数据
  pages/                # 11 个业务页面
  styles/               # 主题与样式
  types/                # TypeScript 类型
  App.vue               # 导航、页面切换、全局弹窗、通知
  main.ts
```

## 功能边界

- 本项目为**可交互前端 Demo**，不含 .NET API、数据库、登录认证、真实 Git 服务或持久化业务数据。
- 新增项目、需求、任务、缺陷等操作只修改内存中的演示数据；刷新页面会重置。
- 文件上传组件仅展示本地文件名，不会向服务器上传。
- 甘特图为静态示例排期，未实现依赖线和时间轴编辑。
- 组件包含基础无障碍属性，但尚未达到完整生产级焦点圈定、屏幕阅读器支持和自动化测试要求。
- 生产使用前建议补充 Vitest / Playwright 测试、路由权限、后端 API、国际化和组件单元测试。


## 扩展组件实验室（本次新增）

导航菜单 **扩展组件实验室** 提供 16 个新增自定义组件的交互示例：HysTextarea、HysRadioGroup、HysSegmented、HysNumberInput、HysSlider、HysRating、HysAlert、HysEmpty、HysAvatar、HysBreadcrumb、HysSteps、HysAccordion、HysTimeline、HysSearch、HysTagInput、HysDivider。每个组件独立目录、使用 Vue 3 + TypeScript、无第三方 UI 组件依赖。

说明：这是可复用的演示组件集合，生产化仍需补充组件单元测试、跨浏览器测试及复杂无障碍用例。


## 完整组件库文档（V9）

请阅读 [`docs/COMPONENT_LIBRARY.md`](docs/COMPONENT_LIBRARY.md)，包含 46 个组件的接口、用法、甘特图完整示例、主题动效系统、开发约定及已知限制。


## V10 高级数据表格

新增 `HysDataGrid` 和「高级数据表格」演示页。详见 [DATAGRID_V10.md](DATAGRID_V10.md) 与 [组件库文档](docs/COMPONENT_LIBRARY.md)。


## V11 表格增强
详见 [DATAGRID_V11.md](DATAGRID_V11.md)：固定列、粘性表头、多列排序、服务端数据协议及分页大小切换。


## V12 表格增强
参见 [DATAGRID_V12.md](./DATAGRID_V12.md)：分组、折叠与数值汇总。

## V13 DataGrid 增强
参见 [DATAGRID_V13.md](DATAGRID_V13.md)：树形行、单元格编辑事件、批量编辑事件及限制。

## V14 分页组件

独立 HysPagination 已增强，并由 HysDataGrid 复用。详见 [docs/PAGINATION_V14.md](docs/PAGINATION_V14.md)。


## V15 企业级组件
新增 21 个组件（总计 67 个），导航中进入「企业级组件实验室」。工作流设计器按要求暂不实现。参见 `docs/ENTERPRISE_COMPONENTS_V15.md`。


## V16 树形组件增强

新增 `HysTree`，`HysOrgTree` 改用通用树组件支持任意层级。示例见企业级组件实验室，接口和限制见 `docs/TREE_V16.md`。


- V17 树形高级能力：见 `docs/TREE_V17.md`。
