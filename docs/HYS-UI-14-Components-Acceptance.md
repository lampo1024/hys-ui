# HYS-UI 14 个组件验收记录

本记录对应 [开发计划](./HYS-UI-14-Components-Codex-Plan.md) 的 M1 至 M5 及后续增强。14 个组件各有独立文档页。首轮提供 51 个可操作示例，增强后共 82 个。各文档页列出 Props、Events、Slots 和公开方法，TypeScript 类型可从 `hys-ui` 导入。

| 阶段 | 组件实现 | 状态 | 示例 |
| --- | --- | --- | --- |
| M1 | [HysCopyButton](../packages/ui/src/components/HysCopyButton/HysCopyButton.vue) | 已完成 | [复制文本、连接信息和剪贴板拒绝](../apps/docs/src/examples/HysCopyButton) |
| M1 | [HysQRCode](../packages/ui/src/components/HysQRCode/HysQRCode.vue) | 已完成 | [网址与中文、打印标签、空值与容量边界](../apps/docs/src/examples/HysQRCode) |
| M1 | [HysInputOtp](../packages/ui/src/components/HysInputOtp/HysInputOtp.vue) | 已完成 | [登录验证码、表单与只读禁用状态](../apps/docs/src/examples/HysInputOtp) |
| M1 | [HysStatistic](../packages/ui/src/components/HysStatistic/HysStatistic.vue) | 已完成 | [经营指标、金额精度、趋势与加载](../apps/docs/src/examples/HysStatistic) |
| M1 | [HysPageHeader](../packages/ui/src/components/HysPageHeader/HysPageHeader.vue) | 已完成 | [任务详情、带操作的页面头部和紧凑布局](../apps/docs/src/examples/HysPageHeader) |
| M2 | [HysMenu](../packages/ui/src/components/HysMenu/HysMenu.vue) | 已完成 | [项目导航、三级菜单、权限操作和长列表](../apps/docs/src/examples/HysMenu) |
| M2 | [HysDropdown](../packages/ui/src/components/HysDropdown/HysDropdown.vue) | 已完成 | [订单操作、悬停子菜单、受控浮层和边缘定位](../apps/docs/src/examples/HysDropdown) |
| M2 | [HysTimePicker](../packages/ui/src/components/HysTimePicker/HysTimePicker.vue) | 已完成 | [提醒设置、班次交接、秒级限制和预约校验](../apps/docs/src/examples/HysTimePicker) |
| M2 | [HysImageViewer](../packages/ui/src/components/HysImageViewer/HysImageViewer.vue) | 已完成 | [单张审阅、多图、失败重试和 4800 像素大图](../apps/docs/src/examples/HysImageViewer) |
| M3 | [HysFilterBar](../packages/ui/src/components/HysFilterBar/HysFilterBar.vue) | 已完成 | [订单表格、日期区间、自定义工单筛选和查询状态](../apps/docs/src/examples/HysFilterBar) |
| M3 | [HysActionBar](../packages/ui/src/components/HysActionBar/HysActionBar.vue) | 已完成 | [批量分派、危险确认、更多操作和导出核对单](../apps/docs/src/examples/HysActionBar) |
| M3 | [HysDataView](../packages/ui/src/components/HysDataView/HysDataView.vue) | 已完成 | [项目卡片、分页文档、附件刷新和长文件名](../apps/docs/src/examples/HysDataView) |
| M4 | [HysRecordPicker](../packages/ui/src/components/HysRecordPicker/HysRecordPicker.vue) | 已完成 | [发货仓库、本地跨页、外部分页和权限空状态](../apps/docs/src/examples/HysRecordPicker) |
| M5 | [HysTreeTable](../packages/ui/src/components/HysTreeTable/HysTreeTable.vue) | 已完成 | [三级库存、受控定位、同级排序和 126 个节点](../apps/docs/src/examples/HysTreeTable) |

## 增强能力与场景

| 组件 | 新增能力与示例场景 |
| --- | --- |
| HysCopyButton | 点击后生成内容，剪贴板拒绝时选择原文手动复制，支持图标入口与反馈时长。示例覆盖分享链接及受限环境。 |
| HysQRCode | SVG／Canvas、中心图标、扫描状态、过期刷新、颜色、边框与 PNG／SVG 导出。新增品牌签到、扫码登录、物料下载、访客 Wi-Fi 和弹层分享。 |
| HysInputOtp | 分组、掩码、字符大小写规范、移动键盘类型和实例清空。示例覆盖设备配对与交易核验。 |
| HysStatistic | 百分比、货币及紧凑单位，支持基准差值或相对变化，可将数值降低设为正向。示例覆盖服务监控与地区报表。 |
| HysPageHeader | 吸顶、标题级别、状态区、头像和窄屏操作折叠。示例覆盖交付验收与滚动检查清单。 |
| HysMenu | 搜索标签及别名、保留祖先路径、同级只展开一支和键盘字符定位。示例覆盖模块查找与服务侧栏。 |
| HysDropdown | 带搜索的菜单、单选和多选，允许下拉保持展开。示例覆盖交付命令和表格列配置。 |
| HysTimePicker | 12 小时制显示、不可用时段、常用时间和实例打开。示例覆盖交接预约和访客接待。 |
| HysImageViewer | 缩略图、受控索引、循环浏览、原始尺寸、鼠标平移及修饰键滚轮缩放。示例覆盖图集验收与截图核对。 |
| HysFilterBar | 数值、数值区间、布尔筛选、条件预设和可移除的摘要。示例覆盖运单筛选和折叠条件管理。 |
| HysActionBar | 跨页全选、总数反馈和每项操作的选择数限制。示例覆盖批次归档和报价对比。 |
| HysDataView | 本地搜索、排序、分页及错误重试，远程查询保留受控接口。示例覆盖工具目录和知识库恢复。 |
| HysRecordPicker | 跨页已选标签、最少和最多项数、防抖查询。示例覆盖值班团队和服务队列。 |
| HysTreeTable | 搜索时显示祖先、异步加载与重试、可选父子联动。示例覆盖仓库和服务组织。 |

二维码功能对齐参考组件的公开 API。HYS-UI 保留默认 SVG 和白底，中心图标按二维码纠错预算自动缩小。带外部图标导出时，图源需允许跨域读取。 [Ant Design Vue 二维码文档](https://www.antdv.com/components/qrcode-cn)

## 首轮验收对照

### HysCopyButton

- [x] 逐字复制中文、换行和特殊字符。
- [x] 写入拒绝或不可用时走失败反馈。
- [x] 使用 HysButton 的键盘激活，禁用和复制中防止重复执行。
- [x] 示例可体验成功、失败和禁用，单测覆盖卸载及空 Tooltip。

### HysQRCode

- [x] 对渲染出的 SVG 矩阵解码，回读数字、网址、UTF-8 中文及多分块内容。
- [x] 值更新重绘，尺寸、前景、背景、留白和纠错等级可配置。
- [x] 空值和容量超限有可识别的状态提示。
- [x] 编码在组件内部完成，保留默认深浅反差，可从包入口单独导入。

### HysMenu

- [x] 支持默认值与受控展开、选中，禁用项不会触发选择。
- [x] 多级子菜单、分组、分隔线、当前项高亮及长菜单滚动均可操作。
- [x] 导航保留链接语义，操作模式具备菜单角色与方向键和 Home、End 导航。
- [x] CSS 作用域局部，复用的菜单数据工具和原有 ContextMenu 通过回归测试。

### HysDropdown

- [x] 支持点击、悬停、点击外部与 Escape 关闭。
- [x] 键盘可打开、移动焦点及激活，禁用项跳过，选择后焦点回到触发器。
- [x] 贴近边缘时调整弹层位置，窄屏菜单保持在视口内。
- [x] 多实例隔离，共用的浮层生命周期通过监听清理回归测试。

### HysTimePicker

- [x] 24 小时制支持 `09:05`、`23:59`、`00:00`、清空和非法输入反馈。
- [x] 分秒步长及同日范围同时约束手动输入和面板选项。
- [x] 受控回写和表单校验读取标准时间，非法草稿不会让表单提交上一次有效值。
- [x] 可用键盘进入和操作面板，Escape 关闭，样式跟随深浅主题。

### HysImageViewer

- [x] 验证单图、多图、大图适应视口及失败后重试。
- [x] 缩放、旋转、重置和适应视口有效，切换图片会恢复初始变换。
- [x] 方向键切图、Escape 退出、焦点恢复及 Modal 的滚动锁定清理通过验证。
- [x] 封装为独立预览组件，可接收 Upload 或 FileManager 提供的图片地址。

### HysInputOtp

- [x] 单个输入元素支持连续录入、过滤粘贴内容和截断。
- [x] 退格、选区替换和非法字符过滤保留可用的光标位置。
- [x] 仅对用户完成且接受的完整值发送 `complete`，支持外部回写与表单校验。
- [x] 数字键盘提示、一次性验证码自动填充及键盘焦点可用。

### HysStatistic

- [x] 覆盖零、负数、小数、字符串大数和空值。
- [x] 支持数值格式与自定义 formatter，动画服从全局与减少动态效果设置。
- [x] 通过趋势图标和文字区分上升、下降及持平。
- [x] 动画沿用 AnimatedNumber，加载使用 Skeleton。

### HysPageHeader

- [x] 检查标题、描述、面包屑、返回和多个操作的组合。
- [x] 360px 容器操作区可换行，键盘可激活返回。
- [x] 标题、副标题、面包屑和操作插槽优先，样式作用于组件内部。

### HysFilterBar

- [x] 文本、下拉、日期和范围能返回完整筛选值。
- [x] 折叠保留值，支持初始值重置、受控回填及自定义字段。
- [x] 查询和重置提供独立快照，保护外部字段定义和初始数据。
- [x] 加载中禁用重复查询及重置，输入框支持 Enter 查询。
- [x] 与 HysTable 组合的订单示例在桌面和窄屏均可筛选。

### HysActionBar

- [x] 支持零项、一项、多项选择以及清空，执行事件携带准确的键值。
- [x] 确认和取消路径独立，直接及溢出菜单中的危险操作均经过确认。
- [x] 禁用和加载限制执行，确认后只发出一次操作。
- [x] 宽度限制直显数量，可通过更多操作访问折叠项目。

### HysRecordPicker

- [x] 单选和多选均可搜索、翻页、确认和取消。
- [x] 分页往返后能看到之前勾选的行。
- [x] 受控外部分页和搜索隐藏记录时保留已选键。
- [x] 取消保留已确认值，确认一次性提交，重开以上次确认值初始化。
- [x] 验证加载、空数据、重复键、零值键和禁用记录。

### HysDataView

- [x] 同一份数据在列表和网格使用专用插槽或共用插槽。
- [x] 检查空状态、加载、分页、窄屏列数及长文件名换行。
- [x] 外部视图与页码同步，切换视图时保留当前页及外部筛选条件。
- [x] 沿用 Segmented、Card、Pagination、Skeleton 和 Empty。

### HysTreeTable

- [x] 支持三级分支、受控展开与可见行定位，叶节点无展开按钮。
- [x] 受控展开键变化后立即同步，折叠祖先保留后代展开记录。
- [x] 排序保持父子关系，按同一层的兄弟节点排列，复用表头和单元格插槽。
- [x] 重复键、无效子项和循环引用安全跳过。
- [x] 原生表格语义保留，展开和收起均可由键盘触发。
- [x] 验证了 126 个节点的示例、独立行选择和自定义空状态。

## 复用与兼容性

- CopyButton 使用 Button 和 Tooltip，Statistic 使用 AnimatedNumber 与 Skeleton，PageHeader 使用 Breadcrumb，InputOtp 使用表单上下文和现有输入样式。QRCode 使用本地矩阵编码及 SVG 渲染。
- Menu 复用 ContextMenu 的菜单数据工具及 Scrollbar。Dropdown 沿用浮层定位、挂载和生命周期，并让菜单承担菜单角色。共用的参考元素扩展了菜单语义，原有 Popover、Tooltip 和 Popconfirm 保留各自行为。
- TimePicker 沿用 Input、Popover、Scrollbar 和日期时间工具。FormItem 可在内部注册草稿校验器，现有 FormItem 公开 API 保持兼容。ImageViewer 复用 Modal、Tooltip 和 Scrollbar。
- FilterBar 组合 Form、FormItem、Input、Select、DatePicker 和 DateRangePicker。ActionBar 使用 Dropdown、Popconfirm 和容器宽度侦测。DataView 使用 Card、Pagination、Segmented、Skeleton 和 Empty。
- RecordPicker 使用 Modal、Search、Table 和 Pagination，宿主管理远程数据。TreeTable 直接使用现有 Table 的树数据、同级排序与选择机制。
- 无新增第三方依赖。14 个组件各自目录下的 40 个构建 JavaScript 文件合计约 105.6 KiB，分别 gzip 后合计约 39.9 KiB。统计口径为组件模块，样式和复用组件计入各自已有的构建产物。

## 首轮执行记录

| 检查 | 结果 |
| --- | --- |
| `npm test` | 1213 项通过。覆盖新组件定向测试及 ContextMenu、Popover、Table、Form、Modal、Upload 等回归。 |
| `npm run typecheck` | 组件库和文档 TypeScript 检查通过。 |
| `npm run build:docs` | 组件库和文档站均成功构建。Vite 对约 590 kB 的 `DemoPage` 文档入口报出体积提示。 |
| `npm run check:contracts` | 公开导出、文档路由、示例数量、API 描述、控件复用及样式隔离检查通过。 |
| `node scripts/pack.mjs` 和 `npm run test:consumer` | 完整包在独立项目中安装、类型检查及打包通过。 |
| `node scripts/pack-feature-packages.mjs` 和 `node scripts/test-feature-packages.mjs` | 基础包和四个功能包在独立项目中安装成功，验证了依赖隔离、共享主题及公开类型。完整包及基础包均包含 14 个组件的 JS 入口和类型声明。 |
| Chromium | 在 1280px 与 360px 验证键盘、浮层、筛选、确认、下载、跨页选择与树形排序。移动触屏模拟验证了子菜单和选时确认。在 360px 深色主题检查 14 页的全部 51 个示例，无示例区域溢出或运行时异常。 |

仓库的静态检查由 `typecheck` 和 `check:contracts` 承担。

## 增强验证

| 检查 | 结果 |
| --- | --- |
| `npm test` | 1218 项通过。新增回归覆盖异步复制后手动复制、二维码刷新与导出、中心图标纠错预算、图标公开导出，以及零选中时的跨页全选。 |
| `npm run build:docs` | 类型声明、组件库和文档站构建通过。Vite 提示 `DemoPage` 文档入口约 601 kB。 |
| `npm run check:contracts` | 组件导出、专用文档页、示例覆盖、API、样式隔离及包契约通过。 |
| Chromium 1280px 与 360px | 82 个示例均成功渲染，示例区域无横向溢出。两种宽度均验证二维码状态刷新和 PNG／SVG 导出、受限剪贴板降级、验证码录入、菜单搜索、多选、时间限制、图片预览、筛选预设、批量全选、记录选择与树表按需加载。 |
