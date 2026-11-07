# 组件能力对标与边界

本轮覆盖全部 69 个组件。按用户确认的范围，对能对应的组件完善核心场景，复杂高级能力分版本迭代。参考实现的 API 命名与 HYS UI 保持独立。

官方参考：[Element Plus](https://element-plus.org/en-US/component/overview.html)、[Ant Design Vue](https://antdv.com/components/overview)、[Naive UI](https://github.com/tusen-ai/naive-ui/tree/main/src)。表中的链接直接指向对应组件文档，— 表示无直接对应组件。组合场景会参考相关基础控件。

“核心能力”记录当前实现，可在每个组件的文档页面运行；“后续高级能力”明确列出本轮没有承诺的能力。日期值当前使用 ISO 日期字符串，上传/文件管理的服务端请求由宿主实现。

| HYS UI | Element Plus | Ant Design Vue | Naive UI | 本轮核心能力 | 后续高级能力 |
|---|---|---|---|---|---|
| HysAccordion | [collapse](https://element-plus.org/en-US/component/collapse.html) | [collapse](https://antdv.com/components/collapse) | [collapse](https://github.com/tusen-ai/naive-ui/blob/main/src/collapse/demos/enUS/index.demo-entry.md) | 受控展开、手风琴/多面板、禁用、标题/内容插槽、ARIA 关联 | 过渡高度动画 |
| HysAlert | [alert](https://element-plus.org/en-US/component/alert.html) | [alert](https://antdv.com/components/alert) | [alert](https://github.com/tusen-ai/naive-ui/blob/main/src/alert/demos/enUS/index.demo-entry.md) | 四种语义、图标、关闭事件、受控显示、描述与插槽 | 横幅/跑马灯 |
| HysAnimatedNumber | [statistic](https://element-plus.org/en-US/component/statistic.html) | [statistic](https://antdv.com/components/statistic) | [number-animation](https://github.com/tusen-ai/naive-ui/blob/main/src/number-animation/demos/enUS/index.demo-entry.md) | 受控数值、精度、时长、减少动态效果、卸载清理 | 本地化分组与复杂格式 |
| HysAvatar | [avatar](https://element-plus.org/en-US/component/avatar.html) | [avatar](https://antdv.com/components/avatar) | [avatar](https://github.com/tusen-ai/naive-ui/blob/main/src/avatar/demos/enUS/index.demo-entry.md) | 图片与文字、失败回退、尺寸、形状、fit、图片变更恢复 | 头像组 |
| HysBadge | [tag](https://element-plus.org/en-US/component/tag.html) | [tag](https://antdv.com/components/tag) | [tag](https://github.com/tusen-ai/naive-ui/blob/main/src/tag/demos/enUS/index.demo-entry.md) | 语义标签、大小、圆角、可关闭、数字上限、圆点 | 标签组与批量选择 |
| HysBreadcrumb | [breadcrumb](https://element-plus.org/en-US/component/breadcrumb.html) | [breadcrumb](https://antdv.com/components/breadcrumb) | [breadcrumb](https://github.com/tusen-ai/naive-ui/blob/main/src/breadcrumb/demos/enUS/index.demo-entry.md) | 层级、末项语义、自定义分隔、链接插槽、路由解耦 | 溢出折叠 |
| HysButton | [button](https://element-plus.org/en-US/component/button.html) | [button](https://antdv.com/components/button) | [button](https://github.com/tusen-ai/naive-ui/blob/main/src/button/demos/enUS/index.demo-entry.md) | 多种外观、尺寸、禁用/加载、图标插槽、形状、block、虚线、链接、安全 rel、原生类型、focus/blur | 按钮组独立组件、加载延迟与波纹 |
| HysCalendar | [calendar](https://element-plus.org/en-US/component/calendar.html) | [calendar](https://antdv.com/components/calendar) | [calendar](https://github.com/tusen-ai/naive-ui/blob/main/src/calendar/demos/enUS/index.demo-entry.md) | 月导航、周一起始、日期选择、事件、禁用日期、日期插槽 | 周/年视图与本地化 |
| HysCalendarNavigation | [date-picker](https://element-plus.org/en-US/component/date-picker.html) | [date-picker](https://antdv.com/components/date-picker) | [date-picker](https://github.com/tusen-ai/naive-ui/blob/main/src/date-picker/demos/enUS/index.demo-entry.md) | 年份/月快速定位、范围禁用、标题返回、UTC 月值 | 多语言与财务日历 |
| HysCard | [card](https://element-plus.org/en-US/component/card.html) | [card](https://antdv.com/components/card) | [card](https://github.com/tusen-ai/naive-ui/blob/main/src/card/demos/enUS/index.demo-entry.md) | 标题/描述、头部操作、页脚、加载、边框、阴影、内容样式 | 封面及悬浮动效 |
| HysCascader | [cascader](https://element-plus.org/en-US/component/cascader.html) | [cascader](https://antdv.com/components/cascader) | [cascader](https://github.com/tusen-ai/naive-ui/blob/main/src/cascader/demos/enUS/index.demo-entry.md) | 路径选择、搜索、清空、父级可选、路径显示、禁用、键盘分级导航 | 多选、异步加载、自定义字段映射 |
| HysChart | — | — | — | 柱状/折线图、数据、高度 | 专业图表库联动 |
| HysCheckbox | [checkbox](https://element-plus.org/en-US/component/checkbox.html) | [checkbox](https://antdv.com/components/checkbox) | [checkbox](https://github.com/tusen-ai/naive-ui/blob/main/src/checkbox/demos/enUS/index.demo-entry.md) | 受控勾选、中间态、禁用/只读、原生 name/value/required、change、标签 | 独立 CheckboxGroup 与数量约束 |
| HysColorPicker | [color-picker](https://element-plus.org/en-US/component/color-picker.html) | [color-picker](https://antdv.com/components/color-picker) | — | 自定义 HSV 色板、色相、HEX 输入、自定义预设、禁用、清空、键盘微调 | 透明度、RGBA/HSL 多格式 |
| HysColorTokenEditor | — | — | — | 颜色令牌编辑与受控数据 | 令牌继承与设计工具同步 |
| HysCommandPalette | — | — | — | 命令搜索、键盘导航、快捷键、选择、缓存停用清理 | 命令分组与远程建议 |
| HysCommentEditor | — | [comment](https://antdv.com/components/comment) | — | 评论列表、发送/删除事件、时间与作者 | 嵌套回复与附件 |
| HysContextMenu | [dropdown](https://element-plus.org/en-US/component/dropdown.html) | [dropdown](https://antdv.com/components/dropdown) | [dropdown](https://github.com/tusen-ai/naive-ui/blob/main/src/dropdown/demos/enUS/index.demo-entry.md) | 视口避让、禁用项、选择、关闭与 Escape、缓存清理 | 多层子菜单 |
| HysCronEditor | — | — | — | 五段表达式、预设、基础格式反馈 | 完整语义解析与时区预览 |
| HysDataGrid | [table](https://element-plus.org/en-US/component/table.html) | [table](https://antdv.com/components/table) | [data-table](https://github.com/tusen-ai/naive-ui/blob/main/src/data-table/demos/enUS/index.demo-entry.md) | 固定列、多排序、筛选行、分组/树形、列显隐/拖拽/宽度、分页、汇总、编辑、CSV、远程查询、持久化恢复 | 合并单元格、横向虚拟化、复杂菜单 |
| HysDatePicker | [date-picker](https://element-plus.org/en-US/component/date-picker.html) | [date-picker](https://antdv.com/components/date-picker) | [date-picker](https://github.com/tusen-ai/naive-ui/blob/main/src/date-picker/demos/enUS/index.demo-entry.md) | 自定义日历、周一起始、单日期、年月定位、范围/函数禁用、键盘、清空 | 时间选择、周/月/季度值模式与国际化 |
| HysDateRangePicker | [date-picker](https://element-plus.org/en-US/component/date-picker.html) | [date-picker](https://antdv.com/components/date-picker) | [date-picker](https://github.com/tusen-ai/naive-ui/blob/main/src/date-picker/demos/enUS/index.demo-entry.md) | 单触发框、起止选择、反选/跨月、范围预览、禁用日期、年月定位、清空 | 双月面板、预设范围、时间精度 |
| HysDiffViewer | — | — | — | 双栏差异、增删内容呈现、相同内容边界 | 大文件增量算法与行内词级差异 |
| HysDivider | [divider](https://element-plus.org/en-US/component/divider.html) | [divider](https://antdv.com/components/divider) | [divider](https://github.com/tusen-ai/naive-ui/blob/main/src/divider/demos/enUS/index.demo-entry.md) | 水平/垂直、文字插槽、分隔线方向、虚线、ARIA 方向 | 自定义分隔间距 |
| HysDrawer | [drawer](https://element-plus.org/en-US/component/drawer.html) | [drawer](https://antdv.com/components/drawer) | [drawer](https://github.com/tusen-ai/naive-ui/blob/main/src/drawer/demos/enUS/index.demo-entry.md) | 受控显示、四方向、宽度/高度、遮罩/Escape/关闭按钮、异步关闭守卫、焦点/滚动管理、销毁策略 | 拖拽调整尺寸与嵌套推移 |
| HysEmpty | [empty](https://element-plus.org/en-US/component/empty.html) | [empty](https://antdv.com/components/empty) | [empty](https://github.com/tusen-ai/naive-ui/blob/main/src/empty/demos/enUS/index.demo-entry.md) | 标题/描述、图片与图标插槽、尺寸、操作插槽 | 预置插画资源 |
| HysFileManager | [upload](https://element-plus.org/en-US/component/upload.html) | [upload](https://antdv.com/components/upload) | [upload](https://github.com/tusen-ai/naive-ui/blob/main/src/upload/demos/enUS/index.demo-entry.md) | 本地文件列表、选择/拖入、上传/移除/下载事件 | 目录、服务端进度与断点续传 |
| HysForm | [form](https://element-plus.org/en-US/component/form.html) | [form](https://antdv.com/components/form) | [form](https://github.com/tusen-ai/naive-ui/blob/main/src/form/demos/enUS/index.demo-entry.md) | 规则、必填/范围/正则、自定义异步校验、字段错误、reset/clear/validate、禁用、布局、错误焦点 | 完整 Schema 表单与复杂依赖 |
| HysFormItem | [form](https://element-plus.org/en-US/component/form.html) | [form](https://antdv.com/components/form) | [form](https://github.com/tusen-ai/naive-ui/blob/main/src/form/demos/enUS/index.demo-entry.md) | prop 绑定、错误/提示、必填语义、标签/控件关联、校验触发、插槽 | 跨字段联动和表单自动生成 |
| HysGantt | — | — | — | 时间尺度、选择、进度、依赖、可编辑日期 | 关键路径与资源排程 |
| HysInput | [input](https://element-plus.org/en-US/component/input.html) | [input](https://antdv.com/components/input) | [input](https://github.com/tusen-ai/naive-ui/blob/main/src/input/demos/enUS/index.demo-entry.md) | 受控值、原生属性转发、清空、只读/禁用、密码显隐、字数、前后缀、附加内容、IME、焦点方法 | 输入掩码与多种格式器 |
| HysJsonEditor | — | — | — | JSON 编辑、语法错误、格式化 | Schema 补全和大型文档 |
| HysKanban | — | — | — | 列/卡片、拖拽移动、选择器移动 | 跨列排序及虚拟泳道 |
| HysMention | [mention](https://element-plus.org/en-US/component/mention.html) | [mentions](https://antdv.com/components/mentions) | [mention](https://github.com/tusen-ai/naive-ui/blob/main/src/mention/demos/enUS/index.demo-entry.md) | 受控内容、用户建议、键盘选择 | 异步源与自定义标记 |
| HysModal | [dialog](https://element-plus.org/en-US/component/dialog.html) | [modal](https://antdv.com/components/modal) | [modal](https://github.com/tusen-ai/naive-ui/blob/main/src/modal/demos/enUS/index.demo-entry.md) | 受控显示、尺寸、全屏、遮罩/Escape/按钮策略、异步关闭守卫、焦点/滚动管理、销毁策略 | 可拖拽、服务式 API 与嵌套管理扩展 |
| HysNotificationCenter | [notification](https://element-plus.org/en-US/component/notification.html) | [notification](https://antdv.com/components/notification) | [notification](https://github.com/tusen-ai/naive-ui/blob/main/src/notification/demos/enUS/index.demo-entry.md) | 消息列表、未读筛选、单项/全部已读、打开事件、空状态、禁用 | 服务式推送与堆叠通知 |
| HysNumberInput | [input-number](https://element-plus.org/en-US/component/input-number.html) | [input-number](https://antdv.com/components/input-number) | [input-number](https://github.com/tusen-ai/naive-ui/blob/main/src/input-number/demos/enUS/index.demo-entry.md) | 步长/精度、严格步进、上下界、只读/禁用、键盘、控制按钮开关、聚焦全选、focus/blur | 自定义格式器/解析器与空值模型 |
| HysOrgTree | [tree](https://element-plus.org/en-US/component/tree.html) | [tree](https://antdv.com/components/tree) | [tree](https://github.com/tusen-ai/naive-ui/blob/main/src/tree/demos/enUS/index.demo-entry.md) | 组织层级、搜索、选择、勾选 | 组织图连线布局与大树虚拟化 |
| HysPagination | [pagination](https://element-plus.org/en-US/component/pagination.html) | [pagination](https://antdv.com/components/pagination) | [pagination](https://github.com/tusen-ai/naive-ui/blob/main/src/pagination/demos/enUS/index.demo-entry.md) | 首尾/前后页、页码、总数、每页条数、跳转、禁用/加载、紧凑布局、可配置标签 | 动态布局组合与国际化包 |
| HysPermissionMatrix | [checkbox](https://element-plus.org/en-US/component/checkbox.html) | [checkbox](https://antdv.com/components/checkbox) | [checkbox](https://github.com/tusen-ai/naive-ui/blob/main/src/checkbox/demos/enUS/index.demo-entry.md) | 资源/角色勾选、受控映射、可访问名称 | 行列全选和权限继承 |
| HysPopover | [popover](https://element-plus.org/en-US/component/popover.html) | [popover](https://antdv.com/components/popover) | [popover](https://github.com/tusen-ai/naive-ui/blob/main/src/popover/demos/enUS/index.demo-entry.md) | 点击/悬停/焦点、受控显示、定位、标题、宽度、禁用、内容插槽、外部/Escape 关闭 | 箭头/碰撞策略配置 |
| HysProgress | [progress](https://element-plus.org/en-US/component/progress.html) | [progress](https://antdv.com/components/progress) | [progress](https://github.com/tusen-ai/naive-ui/blob/main/src/progress/demos/enUS/index.demo-entry.md) | 线形/环形、范围归一、状态颜色、粗细、格式器、进度语义、不定进度 | 仪表盘与分段进度 |
| HysRadioGroup | [radio](https://element-plus.org/en-US/component/radio.html) | [radio](https://antdv.com/components/radio) | [radio](https://github.com/tusen-ai/naive-ui/blob/main/src/radio/demos/enUS/index.demo-entry.md) | 受控单选、选项/整体禁用、独立原生组、方向、change、可访问标签 | 按钮组外观与异步选项 |
| HysRating | [rate](https://element-plus.org/en-US/component/rate.html) | [rate](https://antdv.com/components/rate) | [rate](https://github.com/tusen-ai/naive-ui/blob/main/src/rate/demos/enUS/index.demo-entry.md) | 评分、半星、清空、只读/禁用、键盘、分值与图标插槽 | 自定义阈值色彩及提示文本 |
| HysResizablePanel | [splitter](https://element-plus.org/en-US/component/splitter.html) | — | — | 拖动/键盘调整、上下界、禁用、分隔条语义 | 吸附与折叠布局 |
| HysRichTextEditor | — | — | — | 受控 HTML、基础格式工具 | 文档模型、粘贴净化与扩展插件 |
| HysSearch | [input](https://element-plus.org/en-US/component/input.html) | [input](https://antdv.com/components/input) | [input](https://github.com/tusen-ai/naive-ui/blob/main/src/input/demos/enUS/index.demo-entry.md) | 防抖、Enter 立即查询、清空、只读/禁用、加载、焦点、缓存停用清理 | 远程建议面板 |
| HysSegmented | [segmented](https://element-plus.org/en-US/component/segmented.html) | [segmented](https://antdv.com/components/segmented) | [radio](https://github.com/tusen-ai/naive-ui/blob/main/src/radio/demos/enUS/index.demo-entry.md) | 受控选择、选项/整体禁用、方向键/Home/End、block、大小、标签插槽 | 图标布局与选择动画 |
| HysSelect | [select](https://element-plus.org/en-US/component/select.html) | [select](https://antdv.com/components/select) | [select](https://github.com/tusen-ai/naive-ui/blob/main/src/select/demos/enUS/index.demo-entry.md) | 单/多选、搜索/远程搜索事件、清空、禁用、加载、空状态、插槽、大小、键盘、焦点方法 | 虚拟选项、分组与自定义值字段 |
| HysShortcutHelp | — | — | — | 快捷键列表与说明 | 冲突检测与动态注册 |
| HysSkeleton | [skeleton](https://element-plus.org/en-US/component/skeleton.html) | [skeleton](https://antdv.com/components/skeleton) | [skeleton](https://github.com/tusen-ai/naive-ui/blob/main/src/skeleton/demos/enUS/index.demo-entry.md) | 加载/内容切换、动画开关、标题、头像、行数与加载语义 | 任意形状骨架组合 |
| HysSlider | [slider](https://element-plus.org/en-US/component/slider.html) | [slider](https://antdv.com/components/slider) | [slider](https://github.com/tusen-ai/naive-ui/blob/main/src/slider/demos/enUS/index.demo-entry.md) | 单值/范围、上下界/步长、禁用、原生键盘、刻度、显示格式 | 垂直模式、吸附与浮动提示 |
| HysSortableList | — | — | — | 手柄拖拽、目标指示、释放动画、按钮/Alt 键排序、禁用、插槽 | 跨列表拖放和嵌套排序 |
| HysSplitPane | [splitter](https://element-plus.org/en-US/component/splitter.html) | — | — | 方向、受控比例、上下界、禁用、拖动/键盘、分隔条语义 | 多分栏、吸附、折叠 |
| HysSteps | [steps](https://element-plus.org/en-US/component/steps.html) | [steps](https://antdv.com/components/steps) | [steps](https://github.com/tusen-ai/naive-ui/blob/main/src/steps/demos/enUS/index.demo-entry.md) | 步骤与描述、当前/完成/错误、方向、可选跳转、禁用项、事件 | 连线自适应和自定义图标 |
| HysSwitch | [switch](https://element-plus.org/en-US/component/switch.html) | [switch](https://antdv.com/components/switch) | [switch](https://github.com/tusen-ai/naive-ui/blob/main/src/switch/demos/enUS/index.demo-entry.md) | 受控开关、禁用/加载、文字、异步前置守卫、失败事件、原生按钮语义 | 自定义值和图标动画 |
| HysTable | [table](https://element-plus.org/en-US/component/table.html) | [table](https://antdv.com/components/table) | [table](https://github.com/tusen-ai/naive-ui/blob/main/src/table/demos/enUS/index.demo-entry.md) | 稳定行键、列宽/对齐、单列排序、斑马纹/边框/密度、加载/空态、行事件、单元格插槽 | 复杂能力由 DataGrid 承接，后续合并单元格 |
| HysTabs | [tabs](https://element-plus.org/en-US/component/tabs.html) | [tabs](https://antdv.com/components/tabs) | [tabs](https://github.com/tusen-ai/naive-ui/blob/main/src/tabs/demos/enUS/index.demo-entry.md) | 受控页签、禁用、方向键/Home/End、卡片/垂直、关闭事件、标签/内容插槽 | 新增、拖动与溢出菜单 |
| HysTagInput | [input-tag](https://element-plus.org/en-US/component/input-tag.html) | [select](https://antdv.com/components/select) | [dynamic-tags](https://github.com/tusen-ai/naive-ui/blob/main/src/dynamic-tags/demos/enUS/index.demo-entry.md) | 添加/删除/清空草稿、上限/去重、禁用/只读、分隔符、添加守卫、IME、事件 | 拖动标签与异步验证 |
| HysTextarea | [input](https://element-plus.org/en-US/component/input.html) | [input](https://antdv.com/components/input) | [input](https://github.com/tusen-ai/naive-ui/blob/main/src/input/demos/enUS/index.demo-entry.md) | 受控输入、原生属性、只读/禁用、字数、IME、自适应高度、缩放策略、焦点方法 | 格式器及富文本 |
| HysTimeline | [timeline](https://element-plus.org/en-US/component/timeline.html) | [timeline](https://antdv.com/components/timeline) | [timeline](https://github.com/tusen-ai/naive-ui/blob/main/src/timeline/demos/enUS/index.demo-entry.md) | 内容/时间/状态、颜色、反向、待处理项、插槽 | 左右交替模式 |
| HysToast | [message](https://element-plus.org/en-US/component/message.html) | [message](https://antdv.com/components/message) | [message](https://github.com/tusen-ai/naive-ui/blob/main/src/message/demos/enUS/index.demo-entry.md) | 类型、自动关闭、持久显示、悬停暂停、位置、关闭按钮、可访问播报、缓存清理 | 全局服务与多消息堆叠 |
| HysTooltip | [tooltip](https://element-plus.org/en-US/component/tooltip.html) | [tooltip](https://antdv.com/components/tooltip) | [tooltip](https://github.com/tusen-ai/naive-ui/blob/main/src/tooltip/demos/enUS/index.demo-entry.md) | 自定义位置、延时、禁用、hover/focus、内容插槽、唯一关联 ID、缓存清理 | 受控显示与交互式内容 |
| HysTour | [tour](https://element-plus.org/en-US/component/tour.html) | [tour](https://antdv.com/components/tour) | — | 受控显示/步骤、前后导航、跳过/完成事件、键盘关闭、焦点与滚动管理 | 目标元素聚光和跨页面引导 |
| HysTransfer | [transfer](https://element-plus.org/en-US/component/transfer.html) | [transfer](https://antdv.com/components/transfer) | [transfer](https://github.com/tusen-ai/naive-ui/blob/main/src/transfer/demos/enUS/index.demo-entry.md) | 搜索、勾选移动、双向拖拽、目标/释放动画、标题、禁用、选项插槽、空态 | 远程分页与可搜索分组 |
| HysTree | [tree](https://element-plus.org/en-US/component/tree.html) | [tree](https://antdv.com/components/tree) | [tree](https://github.com/tusen-ai/naive-ui/blob/main/src/tree/demos/enUS/index.demo-entry.md) | 搜索、受控选择/展开/勾选、严格勾选、键盘、禁用、虚拟行、异步重试、拖放、上下文菜单、实例方法 | 动态节点增删与字段映射 |
| HysTreeSelect | [tree-select](https://element-plus.org/en-US/component/tree-select.html) | [tree-select](https://antdv.com/components/tree-select) | [tree-select](https://github.com/tusen-ai/naive-ui/blob/main/src/tree-select/demos/enUS/index.demo-entry.md) | 层级、搜索、单/多选、叶子限制、清空、禁用继承、键盘、选项插槽 | 异步/虚拟大树与完整父子勾选策略 |
| HysUpload | [upload](https://element-plus.org/en-US/component/upload.html) | [upload](https://antdv.com/components/upload) | [upload](https://github.com/tusen-ai/naive-ui/blob/main/src/upload/demos/enUS/index.demo-entry.md) | 选择/拖入、键盘、accept、数量/大小限制、异步检查、列表、移除/清空、宿主上传事件 | 网络请求适配、进度/重试与目录上传 |
| HysVirtualTable | [table-v2](https://element-plus.org/en-US/component/table-v2.html) | [table](https://antdv.com/components/table) | [data-table](https://github.com/tusen-ai/naive-ui/blob/main/src/data-table/demos/enUS/index.demo-entry.md) | 行虚拟化、横向滚动、稳定行键、加载/空态、表头/单元格插槽 | 横向虚拟化与动态行高 |

## 验证方式

- 源码类型与 API 元信息、69 个独立页面及其真实示例完整性检查。
- Node 行为回归验证受控值、禁用、异步校验、键盘、浮层与缓存清理。
- 浏览器逐页冒烟和重点交互验证，检查控制台、复制源码、主题与窄屏。
- 独立 Vue 消费项目从打包产物安装，验证类型、样式隔离、单 Vue 实例和按需构建。
- 平台作为第二个消费方验证业务页面、缓存与切换动画。
