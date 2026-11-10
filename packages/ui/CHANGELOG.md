# Changelog

## Unreleased

- 穿梭框拖拽目标去掉叠加的内阴影描边，保留单层高亮边框与背景反馈，避免滚动区域出现双重边线。

- 为选择、日期、补全、提及、颜色、提示、菜单及数据组件内的浮层统一增加可配置展开/收起动效与时长；补充交互示例，处理退出禁用、快速重开、减少动态效果、边缘定位和页面缓存清理。

- 修复 Chrome 中鼠标位于自适应高度表格时，纵向滚轮无法传给 Modal 等外层滚动容器的问题；保留表格横向滚动约束。

- Modal 拖拽采用按帧更新合成层位置，缓存手势边界并在结束后同步状态；默认柔和缩放，支持全屏/还原过渡及弹窗背景、遮罩的独立透明度，增加宽度预设与标题/底部分区尺寸，并优化缩放手柄及轻量拖动反馈。

- Modal 补充内置操作区、异步确认与取消、关闭拦截、失败重试、调用式服务、拖拽与尺寸调整、全屏切换、长内容滚动、快捷确认、挂载策略与焦点配置；统一嵌套层级、滚动锁定及子浮层清理，保留原有插槽和显示接口。

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
