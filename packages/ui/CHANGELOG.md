# Changelog

## 0.8.0

- DatePicker 与 DateRangePicker 增加统一范围类型、多格式录入、自定义清空值、跨年代浏览、独立双面板、快捷预设和浮层定位配置，并补充五个交互示例与 API 说明。
- 日期时间选择支持面板内输入、12 小时制、时分秒步进和禁用规则；日期范围可设置起止默认时刻。窄屏可通过月份按钮切换双面板。
- Modal 与 Drawer 的全屏、还原和关闭按钮悬停时位置稳定。

## 0.7.0

- 新增 Spin、Icon、Popconfirm、Space、Descriptions、Result 和 TabPane，并配套交互示例和 API 文档。
- Icon 提供 1520 个内置图标，支持分类搜索、别名、样式变体、按需加载和 SVG 预览。
- Tabs 增加动态工作台、标签固定与排序、路由同步、会话恢复、异步内容、响应式溢出和键盘操作。
- SplitPane 增加容器宽度断点、尺寸吸附、跨面板联动和拖动取消恢复。
- DataGrid 增加分组表头、列布局预设、动态固定列、当前行高亮、行与单元格样式、分组小计、键盘导航和自定义右键菜单。表头全选框与数据行复选框对齐，行内编辑沿用原行高。
- Table 增加跨列关键词搜索、服务端搜索和键盘行导航。Table 与 DataGrid 的空态提示跟随可见区域居中。

## 0.6.0

- SortableList 增加垂直、水平和网格排序，支持跨列表和跨层级移动、克隆、批量排序、虚拟列表、撤销重做和异步保存回滚。拖拽结束后过渡到目标位置，临界区排序更稳定，列表文本仍可选中复制。
- Toast 增加全局调用、优先级队列、分组去重、Promise 状态与进度、异步操作、关闭拦截、拖动关闭和主题定制。新增可悬停或点击展开的层叠布局，并补充交互示例与 API。
- Tooltip 与 Popover 修复其他浮层打开时悬停退出或失焦后提示残留的问题，并调整尺寸控制示例布局。
- Search 调整带按钮的搜索框焦点边框。Modal 和 Drawer 的关闭按钮在鼠标悬停时保持位置稳定。

## 0.5.0

- AnimatedNumber 增加逐位滚动、翻牌、进度跳转、可视区域触发和高频更新策略；支持地区格式、中文单位、精确金额、极小数值和倒计时。
- AnimatedNumber 增加 220 种动效，支持效果组合、自定义预设、按数位配置、动效减弱，以及多个指标的编排。新增可搜索的动效演示，整理实时趋势、播放控制和图表联动等示例的窄屏布局。
- Input 和 Textarea 补充提交时更新模型、原生输入属性、字符计数和表单校验集成；完善 Textarea 自动高度与示例。

## 0.4.0

- 示例站点为新增能力补充交互示例，API 参考补全参数、事件、插槽和实例方法的具体说明。

- Button 增加石板灰、钴蓝、靛蓝、紫罗兰、湖青、青绿、翡翠绿、青柠、琥珀、柑橘、朱红、玫红十二种内置配色，支持深浅色和原有文字、链接及朴素样式。悬停只变更视觉样式，按钮位置保持稳定。

- Button 支持可取消的异步操作、延迟加载、按下状态、自定义根标签与键盘激活、两字中文间距、危险色与透明描边组合及文字底色。新增 ButtonGroup 统一按钮的方向、尺寸和状态。
- Search 增加独立搜索按钮、确认提交模式、非受控初值、清空策略及原生输入属性。
- Select 支持值与标签模型、远程标签回显、首选高亮值和动态清空值。多选批量事件使用同一模型格式。

- Tour 支持定位到元素、选择器和目标函数，增加跟随滚动的高亮遮罩、目标点击策略、非模态引导、逐步外观、自定义内容与导航、挂载与层级配置。
- SplitPane 增加两侧独立的像素或百分比约束、折叠和恢复、延迟拖动提交、拖动预览事件及非受控比例。
- SplitPane 支持按标识管理任意数量的面板、按分隔条调整相邻尺寸、受控尺寸集合和面板插槽。未设置尺寸的面板自动分配可用空间。
- SplitPane 更新细线、抓手和方向箭头，增加可配置分隔条尺寸、键盘折叠、双击操作、非受控布局记忆和按标识调整面板尺寸。

- Mention 支持独立触发规则、模糊和拼音搜索、多源分页与缓存、推荐和最近记录、分组虚拟候选、富文本实体、程序化编辑、序列化、撤销重做、权限校验、表单及浮层定制。
- AnimatedNumber 支持精确十进制字符串、统计标题与前后缀、自定义数值格式和截止时间倒计时。
- Table 增加外部容器粘性表头和同步滚动条、列级受控排序和筛选、自定义表格结构与表头合并。支持下一次排序提示、自定义批量选择和统一单元格文本转换。
- Table 支持分页布局、默认分页值、自定义分页器与服务端总页数，以及固定汇总、当前页汇总和自定义汇总行。新增横向最小宽度、列标题渲染和溢出提示样式配置。
- Pagination 支持非受控初始值、总页数、单页隐藏、控件布局和尺寸，以及总数、按钮内容和跳转插槽。受控模式按已生效的页大小调整页码。

## 0.3.0

- DataGrid 支持受控查询、远程加载取消与重试、单选和多选、选择保留、自定义列字段与汇总，以及按行键滚动定位。树形行事件返回原始记录，列宽拖动按帧预览并在释放时保存，支持键盘调整和取消。TypeScript 模板引用可使用 `HysDataGridInstance`。

- VirtualTable 增加双向虚拟化、左右固定列与顶部固定行、容器测量、稳定排序、受控选择、键盘与实例定位、滚动追加、缓存恢复及自定义加载状态。滚动按帧合并，追加保留当前位置；保留原有表体高度和插槽约定。

- TagInput 补充非受控初值、分隔符与批量粘贴、可取消异步检查、受控拒绝处理、清空、标签外观与折叠虚拟列表、拖拽/键盘排序、表单与实例方法；ColorPicker 补充透明度、颜色格式与预设、预览确认、内嵌与受控浮层、自定义内容及表单集成，连续拖动缓存几何并按帧更新，释放时集中校验。保留原有默认行为并增加独立示例。

- Alert 补充外观、横幅、操作区、受控关闭、异步检查与退出完成事件；Empty 补充内置图形、图片回退及独立内容区；Timeline 补充双侧和交替布局、标签、节点、加载、字段映射与稳定排序。保留原有接口，完善缓存、动效及辅助技术处理，新增独立场景。
- Transfer 双击移动时阻止第二次按下产生文字选区，保留复选框、交互内容与快捷多选。

- Progress 增加仪表盘与缺口配置、函数/阈值/渐变颜色、已确认进度叠加、分段与精确部分段、尺寸和端点、文字与状态图标、条纹/进行中/不定进度、动效与辅助技术配置；保留原有 value 和默认显示，完善边界及缓存处理并新增独立示例。

- Upload 补充受控/初始文件列表、真实 multipart 与自定义请求、自动/手动提交、并发队列、按帧进度、取消和重试、异步验证及内容转换、移除检查、文本/图片/卡片列表、预览/下载、目录与粘贴、插槽和表单集成；保留原有本地选择模式与事件，完善缓存任务和本地 URL 清理，新增独立场景。

- Tooltip 与 Popover 补充受控/非受控显示、多种及组合触发、延迟与自动关闭、可移入内容、十二种定位、箭头与外观、独立参考元素、自定义挂载、内容保留及生命周期、键盘导航和实例操作；统一浮层清理并补充独立场景。
- 修复 Drawer 关闭拦截函数的运行时属性识别，保留回调类型兼容性。

- Drawer 补充受控及非受控显示、异步操作与关闭拦截、生命周期和内容挂载策略、独立滚动与分区布局、容器内展示、嵌套推移、全屏及透明度配置、方向动效、焦点管理与实例方法；新增按帧合并的四向边缘缩放、键盘调整、受控尺寸与取消回退，保留旧 close 事件用法。

- ContextMenu 补充多种触发方式、多级子菜单、分组与分隔线、复选/单选与普通项选中、受控状态、业务字段映射、模板、滚动边界和键盘/实例操作；Breadcrumb 增加图标、同级菜单、深层折叠、尺寸与文字截断及宿主路由适配，保留既有事件和默认行为。

- Transfer 支持 Ctrl/Cmd 逐项切换、Shift 鼠标/键盘范围选择，并补充默认关闭的 moveOnDoubleClick 双击移动参数与独立示例。

- Transfer 新增从源列表飞入目标列表的移动动效、落地高亮与效果/时长配置；覆盖按钮、拖拽和实例方法，限制可见代表项目数量，并清理连续移动、滚动和页面离开时的动画。

- Select 多选新增紧凑的全选/全不选工具栏、批量范围与文字配置、实例操作和批量事件；保留禁用值，遵守选择上限，支持筛选、远程结果、虚拟列表及键盘操作；多选默认折叠超过 3 个的标签，可显式设置 maxTagCount。

- 穿梭框拖拽目标去掉叠加的内阴影描边，保留单层高亮边框与背景反馈，避免滚动区域出现双重边线。

- 为选择、日期、补全、提及、颜色、提示、菜单及数据组件内的浮层统一增加可配置展开/收起动效与时长；补充交互示例，处理退出禁用、快速重开、减少动态效果、边缘定位和页面缓存清理。

- 修复 Chrome 中鼠标位于自适应高度表格时，纵向滚轮无法传给 Modal 等外层滚动容器的问题；保留表格横向滚动约束。

- Modal 拖拽采用按帧更新合成层位置，缓存手势边界并在结束后同步状态；默认柔和缩放，支持全屏/还原过渡及弹窗背景、遮罩的独立透明度，增加宽度预设与标题/底部分区尺寸，并优化缩放手柄及轻量拖动反馈。

- Modal 补充内置操作区、异步确认与取消、关闭拦截、失败重试、调用式服务、拖拽与尺寸调整、全屏切换、长内容滚动、快捷确认、挂载策略与焦点配置；统一嵌套层级、滚动锁定及子浮层清理，保留原有插槽和显示接口。

## 0.2.0

- Table 补充布局与表头行样式、多字段排序、选择单元格定制、筛选浮层控制与连续应用、展开图标及操作列配置、手动更新子行和独立视口行定位；保留现有参数、事件与默认行为。
- 日期选择补充多周、周范围示例、跨年周与首周规则、整周校验与禁用、周编号模板及周起止元数据；面板与输入共用周规则。

- DatePicker 与 DateRangePicker 补充日期单位、多值与绑定类型、格式化输入、快捷项、禁用规则与时刻、双面板、开放和固定端点、草稿确认及实例方法；统一表单、键盘与主题交互，保留原有字符串和整体范围输入接口。

- Cascader 补充完整路径与末级值、业务字段及分支重复值、多选与严格选择、搜索校验、懒加载与取消重试、虚拟列、内嵌面板、模板和实例方法；统一标签、弹层、表单与键盘交互，并保留原有路径数组接口。

- 修复关闭动效或启用“减少动态效果”后，浮层的可见性出现逐层过渡、首次聚焦失败的问题。

- Table 补充可搜索菜单与树形筛选、默认筛选恢复、排序优先级、Shift 区间选择与当前页反选、分页位置与纵向滚动恢复、行与单元格属性回调及语义化行标题；批量选择仅作用于当前筛选结果。

- TreeSelect 补充真实层级展开、复选联动与回填策略、多选标签、数值编号和业务字段、扁平树、标签对象、远程搜索与懒加载、虚拟列表和实例方法；完善受控弹层焦点恢复、表单、主题与尺寸继承，并保留原有单选、多选接口。

- Tree 补充业务字段与数值编号、默认状态、勾选与半选 API、手风琴与点击展开、筛选模式、不可变节点编辑、拖放规则和悬停展开；完善异步取消、虚拟滚动、键盘与表单关联，保留原有选择和拖放接口。

- Transfer 补充双侧搜索与全选、受控勾选、目标排序、单向移除、字段映射、自定义面板、分页和虚拟滚动；保留拖拽动画与既有事件，完善表单关联、键盘操作和缓存清理。
- 修复表单失焦校验反馈使提交按钮在鼠标按下后移位、第一次点击无法提交的问题，保留键盘失焦校验和提交完整校验。

- Card 补充封面、操作分区、页签与骨架加载；Badge 补充角标位置、自定义内容、状态点和可选标签；Divider 与 Skeleton 扩展样式、模板及加载防闪烁控制。

- 扩展 Table 的分组与固定布局、排序筛选、选择与分页、展开与树形加载、汇总合并、列宽调整及溢出提示，补充事件、实例方法和独立示例，保留原有使用方式。

- DataGrid 列筛选支持再次点击当前搜索图标或按 Esc 收起，保留条件并恢复键盘焦点；修复普通表头覆盖左右固定表头的问题。

- 修复 Pagination 跳转数字输入框的内部高度，与页码、每页条数选择器和确认按钮统一为 32px，保留聚焦全选与键盘跳转。

- 修复 DataGrid 左右固定列的表头、汇总与悬停背景，使其与同一行的普通列一致并同步主题。

- Calendar 新增可配置月份切换动画、年视图、卡片模式、年月定位、范围限制、日期与月份插槽、跨日日程与溢出列表、本地化、键盘导航及实例方法，保留现有日期与事件接口。
- Select 选项浮层限制垂直占用，选项独立滚动，搜索区与底部内容保持可见；新增多选项示例。

- Add bounded Gantt undo/redo for accepted scheduling and dependency edits, with atomic replay, scoped shortcuts and external-update safety.
- Add dependency-order and invalid-data diagnostics, cycle detection, paged conflict inspection and incident-only drag previews.

- Use one shared Gantt scroll viewport for task names and timelines, with pinned date headers and task labels; prevent clipped rows and blank space after vertical scrolling.
- Add Gantt viewport height controls and multi-task scrolling examples; preserve horizontal fitting and center bars within configurable row heights.
- Add optional Gantt virtual rows and task-location methods, with bounded rendering, cached-page scroll restoration and independent large-data examples.
- Add pointer and keyboard dependency editing, edge selection/removal, cycle and permission checks, edge auto-scrolling and accepted-change events.
- Add resizable Gantt task columns with controlled widths, bounds, responsive timeline space, keyboard adjustments, cancellation and reset.
- Route backward Gantt dependencies through the row gap and keep a visible approach segment outside the target bar.
- Allow dragging or keyboard retargeting existing dependency endpoints, with atomic moves, validation, cancellation and accepted-move events.
- Clear Gantt edge selection when interacting with the surrounding chart, retaining endpoint editing and removal actions.
- Disambiguate shared dependency endpoints with named relation choices, one active drag handle and focused edge highlighting.
- Support clearing task selection through empty-chart clicks, Escape or a null model, with layered editing cancellation and accessible pressed states.
- Add compact, translucent dependency choices with search, direct removal, predecessor/successor location and endpoint-edit actions.

- Expand Rating with precise fractional display, custom level colors/icons, score/text templates, controlled hover previews, keyboard/RTL and form/reset integration.
- Expand Segmented with typed/mapped options, custom content, vertical/block/rounded layouts, animated selection, keyboard navigation and cached-page observer cleanup.
- Remove obsolete Gantt scale-button styles and keep segmented labels readable on their selected surfaces across themes.
- Add independent rating and segmented scenarios, public instance types and interaction guidance.

- Expand checkboxes with scalar/array values, mapped checked values, uncontrolled defaults, button/border variants and form reset behavior.
- Add CheckboxGroup and standalone Radio; support mapped/typed options, composed children, selection limits and bulk actions, keyboard navigation and native form values.
- Expand Switch with mapped values, sizes, inline text/icons, custom rails/thumbs and cancellation-aware async guards; retain change-only consumers and discard stale completions.
- Add independent choice-control scenarios and verify existing tree, permission and transfer integrations.

- Add Autocomplete with free text input, grouped/local/remote suggestions, mapped business fields, custom matching and cancellable debounced queries.
- Support custom input/option/loading/header/footer/clear content, retryable errors, keyboard preview and selection policies, controlled state and form integration.
- Add dedicated autocomplete scenarios, public TypeScript interfaces and input/async/accessibility guidance.
- Keep the documentation table of contents fixed during page transitions and asynchronous example loading, with independent scrolling for long navigation lists.

- Expand Avatar with icon/text/image types, image fit modes and source attributes, fallback sources/slots, loading hooks, responsive sizes and auto-fit text with configurable gaps.
- Add AvatarGroup for data/slot composition, shared sizes/shapes, overlap and vertical layouts, collapsed members, keyboard-accessible overflow panels and cached-page cleanup.
- Add independent avatar/group scenarios, public types and API guidance.

- Prevent slider tooltip clipping with independent, themed overlays, viewport edge shifting/flipping, long-text wrapping and scroll/resize positioning cleanup.
- Move slider handles and selected tracks through transforms; cache stable tooltip styles and dimensions and update tip positions in the handle's paint cycle.

- Replace native range inputs with custom pointer-driven slider tracks and accessible handles, including decimal-safe steps, ordered intervals, track dragging and keyboard controls.
- Add marks-only selection, stops, vertical/reverse layouts, size inheritance, tooltip/handle/mark slots, optional numeric editors and named form values.
- Clean active pointer listeners and animation frames on cancellation and cached-page leave; add dedicated slider scenarios and public instance types.

- Expand text inputs with custom clear/password icons, icon props, formatting/parsing, uncontrolled defaults, controlled password visibility and held-password cleanup.
- Share Input textarea mode and standalone Textarea behavior, with bounded autosize, width/size remeasurement, native form values, composition-safe updates and public instance methods.
- Add UTF-16, grapheme and custom length strategies, safe truncation, inside/outside counters, custom count output and independent examples for each input capability.
- Prevent stale text from reappearing when an input clear and form reset occur in the same event.
- Use descriptive documentation scenario titles, improve composed select/input styles and isolate transient password preview behavior from published controls.

- Expand number inputs with nullable/uncontrolled values, clear policies, decimal-safe steps, bounded strict grids and exact string-mode values.
- Add display formatting/parsing, decimal separators, input filtering, synchronous validation and configurable draft/live updates.
- Add stacked right controls, affix/icon slots, loading states, keyboard policies, opt-in wheel adjustment and held-button stepping with cached-page cleanup.
- Preserve form feedback, native field submission and reset behavior; add public number types, instance methods and independent numeric scenarios.

- Expand select values to numbers, booleans and stable-key objects, with configurable empty/clear values, groups and business-field mappings.
- Add removable/collapsed tags, selection limits, created options, separator input, controlled open/search state and richer slots/events.
- Add cancellable/debounced remote methods with retry, bounded virtual lists, page navigation, typeahead and native form submission fields.
- Preserve wrapping-label activation, form feedback, theme and size inheritance; clean remote requests and popup observers on cached-page leave.
- Add independent select scenes and public type/keyboard/remote-search notes.

- Add shared automatic label alignment, responsive field columns, 24-column label/control layouts and inline forms.
- Add label suffixes, wrapping, optional markers, tooltip/help/extra content, inherited icons and inline feedback.
- Add snapshot reads, partial writes, server feedback arrays, configurable reset baselines, callback validation and imperative submit.
- Add per-field first-error policy, callback validators, transformed nested/member rules and conditional data preservation.
- Add accessible grouped controls, a public custom-control context hook and layout observer cleanup for cached pages.
- Add independent scenarios for complete forms, query filters, alignment, grids, numeric validation, policies, record hydration and accessibility.

- Add typed and nested form rules, warning-only feedback, field dependencies, partial validation/reset and structured results.
- Add field lookup/focus/scroll methods, initial-value capture, rule-change checks, label/feedback slots and inherited layout settings.
- Cancel stale form checks and submissions on reset, clear, disable and cached-page leave; provide AbortSignal to custom validators.
- Propagate form and field disabled/size settings to inputs, selectors, buttons and related controls, including teleported panels.
- Keep select option rows, search fields and icons aligned with the effective control size, including live changes while the popup is open.
- Add practical form scenarios for dynamic rows, nested values, cross-field checks, asynchronous cancellation and field methods.

- Expand tabs with placements, presentation styles, numeric values, dynamic actions, asynchronous guards, panel lifecycle options and overflow navigation.
- Add stable accordion keys, keyboard navigation, configurable trigger areas, panel lifecycle options, guarded expansion and extra content slots.
- Add per-step status, subtitles, custom content, compact/dot layouts and responsive keyboard navigation.
- Add breadcrumb label slots, per-item separators, disabled links and safe external-link attributes.
- Expand navigation examples and regression coverage for state preservation, rapid input, guard failures and cached-page cleanup.

## 0.1.1

- Center toast messages at the top by default and add seven placement options.
- Remove the toast accent border; add warning/loading states, content/icon/action slots and timer pause/resume.
- Add useHysToast for keyed updates, grouping, bounded queues, close handles and completion callbacks.
- Improve toast transitions, narrow-screen layout and cached-page resource cleanup.
- Add createHysToast for shared services outside component setup.
- Match drawer entrance/exit directions to placement, including fullscreen; support explicit top/bottom height.
- Fit Gantt timelines to the available container width and preserve date calculations while resizing.
- Keep select options on one line, size popups to content, and add exact-width and custom filtering options.
- Preserve remote selection labels and improve keyboard navigation, disabled options and composition handling.
- Unify checkbox/radio visuals and compose them in trees, transfer lists and permission matrices.
- Add permission batch selection and transfer change events; preserve drag/drop animations.
- Prevent stale asynchronous switch, upload and dialog actions after cancellation or page changes.
- Improve form validation for custom controls, field descriptions, readonly behavior and reset feedback.
- Correct slider step alignment, calendar initial selection, numeric animation boundaries and resize cleanup.
- Synchronize pagination models after page-size changes and validate typed jump targets immediately.
- Preserve typed numeric precision and expose draft input events from number inputs.
- Respect disabled notification actions; defer incomplete search composition and cancel stale queries.
- Reset command highlights after filtering, normalize organization input and tour step bounds, and enable default tour Escape behavior.
- Guard pending rich-text link commands and improve composite form focus and keyboard file selection.
- Expand select examples and organize configuration panels into aligned parameter and behavior groups.
- Add formatted, highlighted, lazy-loaded source panels with toolbar copy actions and responsive layout.
- Simplify documentation to focus on component features, API and examples.

## 0.1.0

- Introduce reusable Vue components with Hys-prefixed public names.
- Add isolated styles, six themes, reactive configuration and public TypeScript declarations.
- Expand common interaction capabilities across form, selection, feedback, navigation, layout and data components.
- Add rule-based forms, asynchronous validation, reset and accessible field feedback.
- Preserve custom calendars, color selection, virtualized data, drag/drop, filtering and cached-page cleanup.
- Add separate component documentation, runnable source examples, API metadata and release verification.
