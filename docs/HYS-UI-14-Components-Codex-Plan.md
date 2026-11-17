# HYS-UI 新增 14 个组件开发计划（Codex 执行版）

> 文档版本：V1.0\
> 编制日期：2026-11-16\
> 适用范围：HYS-UI（Vue 3 + TypeScript，按公开文档 v0.14.0 的组件目录制定）\
> 目标：补齐常用基础组件，并在不重复造轮子的前提下形成可复用的企业级组合组件。

## 0. 直接交给 Codex 的执行指令

你现在负责在 **现有 HYS-UI 仓库**中实现本文列出的全部 14 个组件。请先阅读仓库根目录的 `AGENTS.md`（如有）、README、现有组件代码、公共类型、样式令牌、文档示例、测试约定和构建配置；本文不假定具体文件路径、包名、脚本名称或 API 已经存在。

执行要求：

1. **保留现有 API 和行为**：优先复用既有组件、组合式函数、样式令牌、国际化机制与构建工具。不要为新组件引入第二套浮层、表格、表单或主题系统。
2. **按里程碑逐批交付**：每批实现组件、测试、文档、导出与构建验证后再推进下一批；不要只交付空壳和示例。
3. **先实现最小可用范围（MVP）**：严格遵循本文每个组件的“本期功能”和“不做”项。不为增加功能数量而扩张 API。
4. **实现类型安全与可访问性**：公开 Props/Events/Slots 和必要类型；支持键盘交互、焦点可见、禁用状态、明暗主题、必要的 ARIA 语义。
5. **不猜测仓库命令**：从 `package.json` 与工作区配置读取实际 `build`、`test`、`typecheck`、`lint`、文档构建命令；逐批执行存在的脚本。
6. **三方依赖从严**：先复用仓库已有库。二维码等确有必要的轻量库可评估后引入，并记录用途与包体影响；不增加无关重型依赖。
7. **存在冲突时先取证**：如果本文建议与现有组件能力重复，优先共享内核或扩展已有能力；需要破坏性修改公共 API、替换核心技术栈或显著增加主包体积时，先汇报取舍，不擅自实施。
8. **完成反馈**：输出每批完成的组件、修改文件、对外 API、测试命令及结果、未实现的非目标项、剩余风险。不要把未运行的测试描述为通过。

## 1. 项目现状与边界

公开文档已经有：`HysButton`、`HysButtonGroup`、`HysIcon`、`HysPopover`、`HysContextMenu`、`HysModal`、`HysDrawer`、`HysTooltip`、`HysToast`、`HysSpin`、`HysSkeleton`、`HysEmpty`、`HysForm`、`HysInput`、`HysSelect`、`HysDatePicker`、`HysDateRangePicker`、`HysPagination`、`HysTable`、`HysDataGrid`、`HysTree`、`HysCard`、`HysSegmented`、`HysAnimatedNumber`、`HysBreadcrumb`、`HysSpace` 等。

以上名称来源于公开文档导航，**不代表已检查到它们的源码和内部能力**；Codex 应以本地仓库为准。

本次只开发下列 14 项，不新增 Carousel、Toolbar、复杂表单设计器、流程编辑器等非选中组件。不新建独立项目，不随意拆分包。已有组件需要的小幅兼容性增强，可以作为本次实现的一部分，但要有测试。

### 1.1 优先级定义

| 级别 | 含义 | 交付策略 |
| --- | --- | --- |
| **P0** | 高频、缺口明确、可复用价值高 | 本轮优先完成；不可省略基本交互、文档和测试 |
| **P1** | 重要的通用/组合能力 | P0 稳定后开发；保持 API 精简 |
| **P2** | 价值高但状态模型与测试成本较大 | 依赖基础组件成熟后单独验收 |

复杂度仅用于排期比较：**S**=较小、**M**=中等、**L**=较大；不是承诺工期。

### 1.2 开发依赖总表

| 组件 | 优先级 | 复杂度 | 优先复用的现有能力 | 前置新增组件 |
| --- | --- | --- | --- | --- |
| `HysCopyButton` | P0 | S | Button、Tooltip、Toast、Icon | 无 |
| `HysQRCode` | P0 | S | Card、Icon、Button、主题令牌 | 无 |
| `HysMenu` | P0 | M | Icon、Scrollbar、已有 ContextMenu 的数据结构（若可复用） | 无 |
| `HysDropdown` | P0 | M | Popover、Button、焦点/浮层机制 | **HysMenu** |
| `HysTimePicker` | P0 | M | Input、Popover、Scrollbar、Button、DatePicker 的日期工具 | 无 |
| `HysImageViewer` | P0 | M | Modal、Icon、Button、现有浮层管理 | 无 |
| `HysFilterBar` | P0 | M | Form、Input、Select、DatePicker、DateRangePicker、Button | 无 |
| `HysActionBar` | P0 | S/M | Button、ButtonGroup、Popconfirm、Dropdown | **HysDropdown**（更多操作场景） |
| `HysInputOtp` | P1 | S/M | Input 的样式令牌、FormItem 校验机制 | 无 |
| `HysStatistic` | P1 | S | AnimatedNumber、Skeleton、Icon、Badge | 无 |
| `HysPageHeader` | P1 | S | Breadcrumb、Button、Space、Divider | 无 |
| `HysDataView` | P1 | M | Segmented、Card、Pagination、Skeleton、Empty | 无 |
| `HysRecordPicker` | P1 | M/L | Modal、Search、Table/DataGrid、Pagination、Checkbox/Radio | 可选复用 **HysFilterBar**；不设为硬依赖 |
| `HysTreeTable` | P2 | L | Table/DataGrid 的列与行渲染、Tree 的展开状态 | 无新增硬依赖；必须复用现有表格基础 |

**重要的复用规则：**`HysMenu` 与 `HysContextMenu` 可以共享菜单项类型和键盘逻辑，但无需为了复用而重写旧的 `HysContextMenu`；`HysTreeTable` 不能从头复制一整套 `HysTable`。如果现有 Table 内核无法复用，先小范围抽取公共能力，再实现 TreeTable。

## 2. 分批实施路线

| 批次 | 组件 | 批次目标 | 完成门槛 |
| --- | --- | --- | --- |
| **M0：基线检查** | 无 | 盘点现有导出、风格、主题、浮层、测试/文档规则 | 输出简短的复用清单与冲突项 |
| **M1：轻量组件** | CopyButton、QRCode、InputOtp、Statistic、PageHeader | 尽快形成可验证的独立组件 | 5 个组件均有测试、示例和导出 |
| **M2：核心交互** | Menu → Dropdown、TimePicker、ImageViewer | 完成菜单、时间、图片交互基础 | 键盘操作、焦点、浮层行为通过验证 |
| **M3：业务组合** | FilterBar、ActionBar、DataView | 利用已有基础组件构成业务模块 | 无新表格/表单内核，受控状态正确 |
| **M4：业务选择** | RecordPicker | 实现跨页选择及确认/取消流程 | 本地及受控远程分页用例通过 |
| **M5：复杂树表** | TreeTable | 实现层级表格 MVP | 稳定行键、层级展开、键盘与数据边界通过 |

按依赖顺序执行即可，不需要为了等低优先级组件而阻塞已独立完成的组件。每个批次可独立提交；如仓库采用单一变更流程，应使用小而明确的提交记录。

---

## 3. 逐组件需求、API 建议与验收

下面的 API 是**建议契约**，以现有 HYS-UI 的命名及 `v-model` 规范为准。如果仓库已有等价通用 Props/Events，不另造一套。

### 3.1 `HysCopyButton` — 一键复制

**优先级 P0｜复杂度 S｜依赖：Button、Tooltip、Toast、Icon**

**本期功能**

1. 根据 `text` 复制文本到系统剪贴板；支持通过插槽自定义按钮内容。
2. 具备默认、悬停、复制中、成功、失败、禁用五类状态；按钮尺寸与变体复用 HysButton。
3. 允许配置成功提示及是否启用 Tooltip，触发 `copy`、`error` 事件。
4. 连续点击应避免成功提示闪烁与重复状态更新；卸载后清理异步状态。

**建议最小 API**：`text`、`disabled`、`showFeedback`；`copy(text)`、`error(reason)`。

**不做**：复制富文本、图片、文件、自定义剪贴板格式、复杂历史记录。

**验收标准**

- 点击后剪贴板内容与 `text` 完全一致，包含中文、换行和特殊字符。
- 剪贴板 API 拒绝或不可用时能明确反馈失败，不能虚报成功。
- 禁用态不能触发复制；键盘 Enter/Space 与鼠标点击行为一致。
- 示例包含成功、失败模拟、禁用三种场景；相关单测通过。

### 3.2 `HysQRCode` — 二维码

**优先级 P0｜复杂度 S｜依赖：主题令牌；必要时小型二维码编码库**

**本期功能**

1. 接收字符串 `value`，输出标准可扫描的二维码，推荐 SVG 渲染以保证清晰度。
2. 支持尺寸、前景/背景颜色、留白和纠错等级的最小配置。
3. `value` 更新后自动更新二维码；空值显示明确的占位或空状态。
4. 确保浅色、深色主题均有可扫描的默认对比度。

**建议最小 API**：`value`、`size`、`foreground`、`background`、`errorCorrectionLevel`。

**不做**：内嵌 Logo、艺术二维码、批量生成、二维码扫描器；导出 PNG 可作为后续增强。

**验收标准**

- 普通 URL、中文内容、短文本均能正确编码，并用已知内容的解码/校验用例验证结果。
- 修改 `value` 后展示立即同步；尺寸和颜色配置生效。
- 空值、超出二维码容量等边界不会导致组件崩溃。
- 不引入体积明显过大的二维码库；构建能按需导入。

### 3.3 `HysMenu` — 导航/操作菜单

**优先级 P0｜复杂度 M｜依赖：Icon、Scrollbar；可共享 ContextMenu 内核**

**本期功能**

1. 支持菜单项 `key/label/icon/disabled/children`，通过插槽自定义标签。
2. 支持垂直导航菜单；支持一级及多级子菜单展开/收起。
3. 支持受控选中键和展开键、默认值与点击事件；具有当前项高亮。
4. 支持组标题和分隔线；不必额外开发与现有 ContextMenu 重复的菜单项系统。
5. 菜单可用于页面导航，也可通过合适的菜单项模式供 Dropdown 组合使用。

**建议最小 API**：`items`、`v-model:selectedKeys`、`v-model:openKeys`、`mode`（默认 vertical）、`select`。

**不做**：Mega Menu、复杂多列导航、权限系统、内置路由状态管理、拖拽排序。路由导航由调用方传链接或响应事件。

**验收标准**

- 选中及子菜单展开的受控/非受控行为一致；禁用项不触发导航。
- 多级菜单可正常展开，当前项样式清晰；长菜单可滚动。
- 按正确的模式实现键盘操作和 ARIA 语义：导航链接不能误用纯操作菜单角色。
- 组件无全局 CSS 污染；与 ContextMenu 共用的工具不改变原组件既有行为。

### 3.4 `HysDropdown` — 下拉菜单

**优先级 P0｜复杂度 M｜依赖：HysMenu、Popover/浮层定位、Button**

**本期功能**

1. 支持默认点击触发及可选悬停触发，提供触发器插槽。
2. 菜单内容复用 `HysMenu` 或其菜单项渲染器，支持图标、禁用项、分隔线、子菜单。
3. 支持受控 `v-model:open`、常用弹出方向、点击外部/Escape 关闭。
4. 弹出时焦点进入菜单，关闭后在合适场景恢复到触发器；支持键盘上下选择和 Enter 激活。
5. 贴边时使用现有定位机制做合理翻转/约束，不因容器 `overflow` 而被意外裁切。

**建议最小 API**：`items`、`trigger`、`placement`、`disabled`、`v-model:open`、`select`；`#trigger`、`#default`。

**不做**：右键触发（已有 ContextMenu）、跨窗口浮层、多列 Mega Menu、复杂动画库。

**验收标准**

- 点击/悬停（若启用）行为正确；外部点击和 Escape 均可关闭。
- 键盘能够打开、导航和选择；禁用项不可激活；关闭后焦点恢复合理。
- 浮层在滚动容器和视口边缘不明显遮挡或裁切。
- 同页面多个实例互不串扰；销毁后不残留全局事件监听。

### 3.5 `HysTimePicker` — 时间选择

**优先级 P0｜复杂度 M｜依赖：Input、Popover、Scrollbar、Button、DatePicker 的可复用工具**

**本期功能**

1. 支持 24 小时制 `HH:mm`；开启秒数后支持 `HH:mm:ss`。
2. 支持输入框与面板选择、清空、禁用、只读和格式校验。
3. 支持分钟/秒钟步长和最小/最大时间约束，非法时间不能提交。
4. 支持受控值、点击外部/Escape 关闭、键盘操作与面板滚动定位。

**建议最小 API**：`modelValue`（时间字符串或 null）、`showSeconds`、`minuteStep`、`secondStep`、`minTime`、`maxTime`、`disabled`、`clearable`；`update:modelValue`、`change`。

**不做**：跨日时间范围、时区转换、复杂日期时间联合选择（后续可组合 DatePicker）、预约规则引擎。

**验收标准**

- `09:05`、`23:59`、`00:00`、非法输入和空值均处理正确。
- 分钟/秒钟步长与禁用时间生效；输入与面板选中结果一致。
- `v-model` 外部回写能同步到视图；表单校验可获取标准化时间值。
- 面板可键盘操作，Escape 正确关闭，深浅主题下层级清晰。

### 3.6 `HysImageViewer` — 图片预览

**优先级 P0｜复杂度 M｜依赖：Modal、Icon、Button、公共浮层管理**

**本期功能**

1. 支持单图或图片数组预览，通过受控 `v-model:open` 打开/关闭。
2. 支持上一张/下一张、缩放、旋转、重置、适应视口。
3. 支持键盘 Escape 关闭、左右方向键切换；按钮 Tooltip 与可访问名称。
4. 支持加载中和加载失败状态；图片尺寸不能突破视口导致操作按钮无法使用。

**建议最小 API**：`images`、`initialIndex`、`v-model:open`；`change(index)`、`close`。

**不做**：图片裁剪、标注、上传、编辑、视频播放、幻灯片自动播放。

**验收标准**

- 单张、至少三张、加载失败和超大分辨率图片均能正常展示。
- 缩放、旋转、重置后状态准确；切图时按约定重置变换。
- 键盘关闭/切换正常，组件关闭后没有滚动锁定或事件残留。
- 可直接作为已有 Upload/FileManager 的预览入口复用，不复制上传能力。

### 3.7 `HysInputOtp` — 验证码输入

**优先级 P1｜复杂度 S/M｜依赖：Input 视觉令牌、FormItem 表单集成**

**本期功能**

1. 支持 4/6 位等可配置长度，默认只接受数字。
2. 支持连续键入、粘贴完整验证码、退格删除、自动聚焦/完成事件。
3. 支持禁用、错误、只读、表单值同步。
4. 优先采用单一可访问真实输入框与分格视觉呈现，避免多个输入框导致复杂焦点及输入法问题。

**建议最小 API**：`modelValue:string`、`length`、`pattern`、`disabled`、`readonly`、`autoFocus`；`update:modelValue`、`complete`。

**不做**：短信发送、倒计时、验证码校验接口、图形验证码。

**验收标准**

- 逐字输入和整段粘贴均正确处理，超长内容截断至配置长度。
- 退格、修改中间字符、输入不合法字符不会破坏光标与状态。
- 填满时只触发合理次数的 `complete`，外部修改可同步。
- 移动设备有适当输入提示（如 `inputmode`、`autocomplete`），并可用键盘完成全过程。

### 3.8 `HysStatistic` — 统计展示

**优先级 P1｜复杂度 S｜依赖：AnimatedNumber、Skeleton、Icon、主题令牌**

**本期功能**

1. 显示标题、值、前缀、后缀、精度、千分位与格式化结果。
2. 可选择数字过渡动画，并遵守减少动态效果的系统配置。
3. 支持可选趋势值/方向的轻量展示，以及加载/空数据状态。
4. 提供标题、值、尾部描述插槽，便于嵌入 Card 和工作台。

**建议最小 API**：`title`、`value`、`precision`、`prefix`、`suffix`、`animated`、`trend`、`loading`、`formatter`。

**不做**：内置迷你图、复杂同比环比计算、网络数据请求。

**验收标准**

- `0`、负数、小数、大数、空值均不出现 NaN 或异常排版。
- 格式化优先级明确；动画开关与减少动态效果设置生效。
- 正负趋势的图标/文字语义一致，不能只靠颜色表达。
- 与已有 AnimatedNumber 共用动画能力，不实现第二套计数器。

### 3.9 `HysPageHeader` — 页面头部

**优先级 P1｜复杂度 S｜依赖：Breadcrumb、Button、Space、Divider**

**本期功能**

1. 支持标题、副标题、返回按钮、面包屑及右侧操作区。
2. 提供 `#title`、`#subtitle`、`#extra`、`#breadcrumb` 插槽。
3. 支持紧凑样式；窄屏时操作区可自然换行或折叠为应用自行提供的内容。
4. 返回按钮只发出事件，不强耦合 Vue Router。

**建议最小 API**：`title`、`subtitle`、`showBack`、`breadcrumbs`、`compact`；`back`。

**不做**：应用导航路由器、固定顶部布局引擎、复杂页面状态管理。

**验收标准**

- 仅标题、标题+描述、面包屑+返回、右侧多个操作均能展示。
- 360px 左右窄屏不出现内容横向溢出；返回按钮可通过键盘触发。
- 插槽和 Props 同时使用时优先级明确；不新增全局样式。

### 3.10 `HysFilterBar` — 高级筛选栏

**优先级 P0｜复杂度 M｜依赖：Form、Input、Select、DatePicker、DateRangePicker、Button**

**本期功能**

1. 通过小型字段配置描述常用筛选项：文本、选择、日期、日期范围；允许插槽渲染自定义字段。
2. 支持 `v-model:values` 受控筛选值、搜索/查询、重置。
3. 支持默认展示部分字段与“展开更多 / 收起”交互。
4. 支持响应式布局和不同密度，与 Table/DataGrid 的工具栏视觉协调。
5. 搜索和重置只通过事件交给调用方，**不在组件内部发送请求**。

**建议最小 API**：`fields`、`modelValue`/`v-model:values`、`initialValues`、`collapsedCount`、`loading`；`search(values)`、`reset(values)`、`update:values`；自定义字段插槽。

**不做**：嵌套 AND/OR 条件构建器、保存筛选方案到服务器、权限筛选、SQL 生成器、自动请求数据。

**验收标准**

- 文本、选择、日期、日期范围组合筛选成功返回正确的数据结构。
- 展开/收起不会丢失值；重置准确恢复初始值；外部写入同步到控件。
- 组件不会修改调用方传入的 `fields` 或 `initialValues` 对象。
- Search/Reset 事件次数可预测，loading 下的重复提交按规则受控。
- 窄屏正常换行，至少提供常用的 Table/DataGrid 列表示例。

### 3.11 `HysActionBar` — 批量操作栏

**优先级 P0｜复杂度 S/M｜依赖：Button、ButtonGroup、Dropdown、Popconfirm**

**本期功能**

1. 外部传入已选数量，展示“已选择 N 项”和操作按钮。
2. 支持普通、危险、禁用、loading 操作；支持附加操作折叠到 Dropdown。
3. 提供清空选择事件以及左/右区域插槽。
4. 仅负责 UI 和操作通知，**不维护 Table/DataGrid 的选中数据，也不执行后端操作**。
5. 危险操作可显式请求 Popconfirm 确认，未经确认不能直接触发操作事件。

**建议最小 API**：`selectedCount`、`actions`、`loading`、`visibleWhenEmpty`；`action(key)`、`clearSelection`。

**不做**：复杂权限引擎、自动处理 API 请求、Undo 事务引擎、内建表格选择状态。

**验收标准**

- 选择 0、1、多项时文案及显示条件正确；点击动作事件携带准确 key。
- 危险操作确认、取消路径正确；取消不触发执行事件。
- 禁用和 loading 操作无法重复执行。
- 按钮数量过多时折叠，不撑坏 Table/DataGrid 工具栏。

### 3.12 `HysRecordPicker` — 业务记录选择器

**优先级 P1｜复杂度 M/L｜依赖：Modal、Search、Table、Pagination、Checkbox/Radio、Empty、Spin**

**本期功能**

1. 弹窗选择业务记录；支持单选、多选，列定义及自定义单元格展示。
2. 支持关键词搜索、受控分页、loading/空状态、明确的“确定/取消”。
3. 使用稳定 `rowKey` 识别记录；允许跨分页保留已选 key。
4. 数据由调用方提供，远程分页通过受控 `rows/total/page/loading` 与事件驱动，组件内部不发 HTTP 请求。
5. 取消时保留外部已确认值；确定时一次性提交最新选择结果。

**建议最小 API**：`rows`、`columns`、`rowKey`、`total`、`page`、`pageSize`、`multiple`、`modelValue`、`v-model:open`、`loading`；`search`、`update:page`、`confirm(keys)`、`cancel`。

**不做**：组织/用户/药品专属业务逻辑、远端缓存策略、自动请求、跨页记录详情智能补全、内置表单引擎。

**验收标准**

- 单选、多选、搜索、分页、确认、取消流程正确。
- A 页选择记录，切换到 B 页，再返回 A 页时选中 key 保留。
- 远程分页切换不丢选中 key；未加载记录的 key 不会被错误清空。
- 取消不污染外部 `v-model`；确定只提交一次；同一弹窗重新打开的状态可预测。
- loading、空结果、重复行 key、禁用行等边界安全处理，并有组件测试。

### 3.13 `HysDataView` — 列表/网格数据视图

**优先级 P1｜复杂度 M｜依赖：Segmented、Card、Pagination、Skeleton、Empty**

**本期功能**

1. 提供 `list`、`grid` 两种视图，支持受控 `v-model:view`。
2. 通过插槽渲染每条数据，不强制业务字段或固定卡片样式。
3. 支持 `loading`、`empty`、受控分页和响应式列数。
4. 视图切换不应重置当前页或调用方维护的筛选状态。

**建议最小 API**：`items`、`view`、`gridColumns`、`loading`、`total`、`page`、`pageSize`；`update:view`、`update:page`；`#list-item`、`#grid-item`、`#empty`。

**不做**：表格排序/筛选引擎、数据请求、虚拟列表（已有本轮范围外独立方案）、拖拽卡片。

**验收标准**

- 相同数据能在列表与网格之间切换，插槽渲染正确。
- 0 条数据、加载中、分页、长内容、窄屏均不影响基本操作。
- 外部修改 view/page 值能准确同步，组件不修改原始数据。
- 复用现有 Card/Segmented/Pagination 样式，视觉与 HYS-UI 一致。

### 3.14 `HysTreeTable` — 树形表格

**优先级 P2｜复杂度 L｜依赖：Table/DataGrid 的列渲染、Tree 的展开状态机制**

**本期功能（严格控制 MVP）**

1. 支持树形行数据（`children` 嵌套结构）和稳定 `rowKey`，可配置子节点字段名。
2. 首列显示层级缩进及展开/收起按钮；支持受控 `expandedKeys`。
3. 复用现有 Table 的列定义、单元格插槽、空状态与行选择（如易于复用）。
4. 可选支持“展开全部/折叠全部”；数据为空、叶子节点和深层节点行为一致。
5. 若保留现有 Table 排序能力，应按**同级节点排序**，不应把整个树拍平打乱层级。

**建议最小 API**：`data`、`columns`、`rowKey`、`childrenKey`、`v-model:expandedKeys`、`defaultExpandAll`；`expand`、`collapse`、`rowClick`。

**不做**：异步懒加载、虚拟滚动、树形拖拽、复杂树筛选、单元格 Excel 编辑、勾选父子级联策略、服务端树分页。以上应单独立项。

**验收标准**

- 至少三级树可正确显示、展开/收起、定位节点；叶子节点不显示虚假的展开按钮。
- 外部改动 `expandedKeys` 后 UI 同步，重新渲染不丢状态。
- 同级排序（若启用）不破坏父子关系；复用既有列插槽。
- 重复 key、异常 children、循环引用输入不会导致无限递归或页面崩溃，应在开发模式提示或安全跳过。
- 可使用键盘到达展开按钮并操作；使用原生 table 语义时不错误宣称完整 treegrid 交互。若采用 `role=treegrid`，需按其键盘与层级语义要求实现。
- 具有中等规模树数据示例和关键单测，不为本期自行编写虚拟化引擎。

---

## 4. 全部 14 个组件统一验收标准（DoD）

### 4.1 API / 构建

- [ ] 组件符合现有 HYS-UI 命名、目录、类型、导出、按需引入与样式引入约定。
- [ ] Props、Events、Slots、必要类型完整且可被 TypeScript 用户直接引用。
- [ ] `v-model` 与受控状态遵循仓库一致的 `modelValue`/`update:*` 约定；不直接修改 Props。
- [ ] 无新增不必要的全局变量、全局 CSS、事件监听泄漏或重复浮层根节点。
- [ ] 沿用 `provideHysConfig`、主题变量、尺寸、圆角、颜色、动效约定（以实际源码为准）。
- [ ] 不在根包引入不必要的重型依赖；组件支持项目现有的按需打包方式。

### 4.2 交互与无障碍

- [ ] 所有可操作元素可通过键盘访问，聚焦态可见，禁用状态一致。
- [ ] Dropdown/Menu、ImageViewer、TimePicker、RecordPicker 等浮层具备适当的 Escape、焦点恢复、点击外部行为。
- [ ] 加载、空值、错误、只读/禁用状态有明确反馈；不只通过颜色传达重要信息。
- [ ] 与现有浅色/深色主题保持一致；至少验证常用桌面宽度和一个窄屏宽度。
- [ ] 基础文案可以通过现有国际化机制、Props 或 Slots 覆盖，不将中文提示硬编码为不可修改的唯一值。

### 4.3 测试与文档

- [ ] 每个组件至少包含基础渲染、受控更新、用户交互、禁用/空值等适用测试，复杂组件增加键盘与边界测试。
- [ ] 每个组件有独立文档入口、基础示例和至少一个真实交互/异常示例。
- [ ] API 文档同步 Props、Events、Slots；新增导出与类型能在文档示例中真实编译。
- [ ] 使用仓库实际脚本完成 lint、typecheck、单测、组件构建和文档构建（不存在的脚本说明情况，不编造结果）。
- [ ] 回归检查至少涉及 ContextMenu、Popover、Table、Form、Modal、Upload 等被复用的原有组件。

### 4.4 反过度设计约束

- [ ] 不额外开发本计划之外的新业务组件、设计器或远程数据层。
- [ ] 不新增项目级状态管理、请求库、图表库或第二套主题系统。
- [ ] 不把 `HysRecordPicker` 和 `HysFilterBar` 与具体后端实体/接口耦合。
- [ ] `HysTreeTable` 本期不做异步加载、虚拟滚动、父子级联选择和拖拽。
- [ ] 允许复用已有组件的私有逻辑，但抽取公共内核时不得改变原有公开行为。

## 5. 推荐的最小使用示例（用于 API 校对，不强制逐字照抄）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  HysDropdown,
  HysMenu,
  HysTimePicker,
  HysCopyButton,
  HysQRCode,
  HysFilterBar,
  HysActionBar,
  HysButton,
  type HysActionBarItem,
  type HysFilterField,
  type HysFilterValues,
} from 'hys-ui'

const time = ref<string | null>('09:30')
const filters = ref<HysFilterValues>({ keyword: '', status: 'active' })
const selectedCount = ref(2)
const menus = [
  { key: 'open', label: '打开' },
  { key: 'copy', label: '复制链接' },
]
const fields: HysFilterField[] = [
  { key: 'keyword', label: '关键词', type: 'text' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' }, { label: '启用', value: 'active' },
  ] },
]
const actions: HysActionBarItem[] = [
  { key: 'export', label: '导出' },
  { key: 'delete', label: '删除', variant: 'danger', confirm: { title: '确定删除选中项？' } },
]
</script>

<template>
  <HysMenu :items="menus" />
  <HysDropdown :items="menus" @select="key => console.log(key)">
    <template #trigger><HysButton variant="secondary">更多操作</HysButton></template>
  </HysDropdown>
  <HysTimePicker v-model="time" />
  <HysCopyButton text="https://example.com" />
  <HysQRCode value="https://example.com" />
  <HysFilterBar v-model:values="filters" :fields="fields" @search="v => console.log(v)" />
  <HysActionBar
    :selected-count="selectedCount"
    :actions="actions"
    @action="key => console.log(key)"
    @clear-selection="selectedCount = 0"
  />
</template>
```

此示例使用组件的公开入口和 TypeScript 类型。各文档页提供独立的业务示例和完整接口。

## 6. Codex 完成后必须提交的结果清单

[实现位置、示例与逐项验收结果](./HYS-UI-14-Components-Acceptance.md)

1. **组件清单**：14 个组件逐一标记 `已完成 / 部分完成 / 阻塞`，附实现位置。
2. **复用清单**：列出复用/抽取的现有组件与公共逻辑，说明是否影响旧 API。
3. **API 文档**：每个组件导出的 Props、Events、Slots、Types 及基本示例。
4. **测试结果**：真实执行的命令、成功/失败情况、覆盖的关键交互；不能仅写“测试通过”。
5. **变更说明**：新增依赖、包体影响、对现有组件的兼容性变化。
6. **验收对照**：逐项勾选本文每个组件的验收标准，未达标项写明原因与后续动作。
7. **最终构建**：组件包与文档站点可以正常构建，所有新增组件能通过公开入口导入。

**最终完成定义：**不是只创建 14 个 Vue 文件，而是每个组件均实现本期功能、可从 HYS-UI 正常导入、具备明确的 TypeScript API、交互示例、必要测试，并通过仓库现有的质量检查。

---

## 参考资料

- [HYS-UI 官方公开文档](https://lampo1024.github.io/hys-ui/components/hys-chart/)
- [Vue 组件 v-model 官方文档](https://vuejs.org/guide/components/v-model.html)
- [WAI-ARIA Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [WAI-ARIA Treegrid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/)
- [Vitest Component Testing](https://main.vitest.dev/guide/browser/component-testing)
