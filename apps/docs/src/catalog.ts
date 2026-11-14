export const catalog=[
  {
    "name": "HysScrollbar",
    "shortName": "Scrollbar",
    "label": "滚动条",
    "slug": "hys-scrollbar",
    "category": "基础组件",
    "description": "为受限内容提供主题化滑块、横纵滚动和边缘遮罩，通过触边事件按需加载。",
    "notes": [
      "指定 height 或 maxHeight，或由布局限制可用高度。",
      "默认鼠标悬停时显示滑块，可用 always 常显。隐藏时仍可用滚轮、触屏或键盘滚动。设为 native 可使用系统滚动条，高对比度模式会自动切换。",
      "可用 --hys-ui-scrollbar-thumb、--hys-ui-scrollbar-thumb-hover 和 --hys-ui-scrollbar-track 设置滑块和轨道的颜色。",
      "遮罩默认宽或高 40px。可用 --hys-ui-scrollbar-top-mask-height、--hys-ui-scrollbar-bottom-mask-height、--hys-ui-scrollbar-left-mask-width 和 --hys-ui-scrollbar-right-mask-width 调整尺寸。将变量末尾的 height 或 width 改为 color 可分别设置各边颜色。"
    ]
  },
  {
    "name": "HysIcon",
    "shortName": "Icon",
    "label": "图标",
    "slug": "hys-icon",
    "category": "基础组件",
    "description": "用统一接口渲染 SVG、字体、图片和 Vue 图标，支持按需加载、交互和图标库选择。",
    "notes": ["纯装饰图标默认隐藏于辅助技术。图标按钮请提供 label。", "导入的 SVG 会转换为受限的结构化图形。外部 SVG 文件通过图片资源加载。"]
  },
  {
    "name": "HysSpin",
    "shortName": "Spin",
    "label": "加载",
    "slug": "hys-spin",
    "category": "反馈浮层",
    "description": "为请求、局部内容和全屏任务提供加载反馈、确定进度与可取消的任务管理。",
    "notes": ["delay 与 minDuration 配合减少快速请求造成的闪烁。", "将 AbortSignal 传给请求或后台任务，取消操作可以停止业务工作。"]
  },
  {
    "name": "HysAnimatedNumber",
    "shortName": "AnimatedNumber",
    "label": "数字动画",
    "slug": "hys-animated-number",
    "category": "基础组件",
    "description": "为统计指标、金额和实时数据提供平滑计数、数字翻牌与精确格式化。",
    "notes": [
      "为首屏动画指定 from。省略时首次直接显示目标值，后续目标更新仍可播放。",
      "超出 Number 安全整数范围或要求十进制精度时，起点与目标都使用字符串。"
    ]
  },
  {
    "name": "HysAvatar",
    "shortName": "Avatar",
    "label": "头像",
    "slug": "hys-avatar",
    "category": "基础组件",
    "description": "展示图片、图标或文字，支持自动缩放、图片回退和响应式尺寸。",
    "notes": [
      "使用 name、alt 或 aria-label 为头像提供完整名称。",
      "可组合 HysBadge 展示消息，使用 HysAvatarGroup 管理头像组。"
    ]
  },
  {
    "name": "HysAvatarGroup",
    "shortName": "AvatarGroup",
    "label": "头像组",
    "slug": "hys-avatar-group",
    "category": "基础组件",
    "description": "组合成员头像，支持重叠排列、折叠数量、响应式尺寸和成员浮层。",
    "notes": [
      "单个头像显式设置的尺寸和形状优先于头像组。",
      "计数按钮支持鼠标与键盘操作；页面离开时关闭浮层。"
    ]
  },
  {
    "name": "HysBadge",
    "shortName": "Badge",
    "label": "状态标签",
    "slug": "hys-badge",
    "category": "基础组件",
    "description": "状态标签的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysButton",
    "shortName": "Button",
    "label": "按钮",
    "slug": "hys-button",
    "category": "基础组件",
    "description": "用于导航、表单提交、异步操作与工具栏切换。",
    "notes": [
      "外观使用 variant 或语义 type，原生表单行为使用 native-type。",
      "按钮组的尺寸和外观可由组内按钮覆盖。"
    ]
  },
  {
    "name": "HysButtonGroup",
    "shortName": "ButtonGroup",
    "label": "按钮组",
    "slug": "hys-button-group",
    "category": "基础组件",
    "description": "组合相关操作，统一尺寸、外观和禁用状态。",
    "notes": [
      "按钮可覆盖组内默认尺寸或外观。",
      "连接布局支持水平和垂直方向，分隔布局可设置间距和换行。"
    ]
  },
  {
    "name": "HysCard",
    "shortName": "Card",
    "label": "卡片",
    "slug": "hys-card",
    "category": "基础组件",
    "description": "承载可折叠、可切换页签或可全屏浏览的内容。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "用 fullscreenable 在标题区添加全屏按钮。全屏正文独立滚动，按 Esc 返回原位置。"
    ]
  },
  {
    "name": "HysDescriptions",
    "shortName": "Descriptions",
    "label": "描述列表",
    "slug": "hys-descriptions",
    "category": "基础组件",
    "description": "将业务详情组织成标签和值，支持响应式列数、跨列跨行和自定义字段。",
    "notes": [
      "默认按组件容器宽度换列，在窄屏、抽屉和侧栏中自动收为单列。",
      "为 items 中的字段提供唯一 key。使用 value-字段键 插槽定制特定字段，或用 value 插槽统一渲染。"
    ]
  },
  {
    "name": "HysSpace",
    "shortName": "Space",
    "label": "间距",
    "slug": "hys-space",
    "category": "基础组件",
    "description": "统一工具栏、操作区和表单区域的组件间距，支持换行、对齐和分隔。",
    "notes": [
      "size 可分别设置横向和纵向间距。小容器中可启用 wrap 让操作按原有顺序换行。",
      "fill 让每项参与伸展。若按钮或输入框也需要占满对应项目，请同时开启子组件的块级布局。"
    ]
  },
  {
    "name": "HysDivider",
    "shortName": "Divider",
    "label": "分隔线",
    "slug": "hys-divider",
    "category": "基础组件",
    "description": "分隔线的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysPagination",
    "shortName": "Pagination",
    "label": "分页",
    "slug": "hys-pagination",
    "category": "基础组件",
    "description": "分页的独立交互示例、配置场景与类型参考。",
    "notes": [
      "跳转使用隐藏加减按钮的数字输入框，聚焦后全选。",
      "页码和每页条数通过事件交由父组件管理。"
    ]
  },
  {
    "name": "HysPermissionMatrix",
    "shortName": "PermissionMatrix",
    "label": "权限矩阵",
    "slug": "hys-permission-matrix",
    "category": "基础组件",
    "description": "权限矩阵的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysSortableList",
    "shortName": "SortableList",
    "label": "拖拽排序",
    "slug": "hys-sortable-list",
    "category": "基础组件",
    "description": "拖拽排序的独立交互示例、配置场景与类型参考。",
    "notes": [
      "仅左侧拖拽手柄可启动拖拽，条目正文可正常点击。",
      "目标指示器显示插入位置，支持 Alt + 上下方向键及上下移按钮。"
    ]
  },
  {
    "name": "HysAutocomplete",
    "shortName": "Autocomplete",
    "label": "自动补全",
    "slug": "hys-autocomplete",
    "category": "表单输入",
    "description": "在自由输入中提供本地、分组或远程建议，支持自定义输入与建议内容。",
    "notes": [
      "输入值始终是字符串；选择事件同时返回原始建议对象和最终文本。",
      "远程查询支持回调、数组和 Promise，通过 AbortSignal 取消过期请求。"
    ]
  },
  {
    "name": "HysCascader",
    "shortName": "Cascader",
    "label": "级联选择",
    "slug": "hys-cascader",
    "category": "表单输入",
    "description": "级联选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysCheckbox",
    "shortName": "Checkbox",
    "label": "复选框",
    "slug": "hys-checkbox",
    "category": "表单输入",
    "description": "复选框的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysColorPicker",
    "shortName": "ColorPicker",
    "label": "颜色选择",
    "slug": "hys-color-picker",
    "category": "表单输入",
    "description": "颜色选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "调色板为自定义实现，包含饱和度、明度、色相和十六进制输入。"
    ]
  },
  {
    "name": "HysDatePicker",
    "shortName": "DatePicker",
    "label": "日期选择",
    "slug": "hys-date-picker",
    "category": "表单输入",
    "description": "日期选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "每周从星期一开始。点击标题年份或月份可快速定位，再次点击标题返回日期视图。",
      "min/max 使用 YYYY-MM-DD 格式，禁用日期无法选择。"
    ]
  },
  {
    "name": "HysDateRangePicker",
    "shortName": "DateRangePicker",
    "label": "日期范围",
    "slug": "hys-date-range-picker",
    "category": "表单输入",
    "description": "日期范围的独立交互示例、配置场景与类型参考。",
    "notes": [
      "使用一个触发框，依次点击开始与结束日期；跨月和反向选择会自动整理范围。",
      "每周从星期一开始，支持年月快速定位、预览和取消。"
    ]
  },
  {
    "name": "HysForm",
    "shortName": "Form",
    "label": "表单",
    "slug": "hys-form",
    "category": "表单输入",
    "description": "表单的独立交互示例、配置场景与类型参考。",
    "notes": [
      "字段路径支持点号、括号字符串与数组；表单规则和字段规则合并，手动校验应用全部规则。",
      "异步 validator 接收数据快照与 AbortSignal；跨字段检查应声明 dependencies。resetFields 可局部重置，远程回填后可用 captureInitialValues 更新基线。"
    ]
  },
  {
    "name": "HysFormItem",
    "shortName": "FormItem",
    "label": "表单项",
    "slug": "hys-form-item",
    "category": "表单输入",
    "description": "表单项的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过 prop 关联 HysForm 的 model；独立使用可由调用方传入 error、warning 和状态。",
      "字段配置优先于表单默认设置，控件显式 size 优先于字段尺寸。隐藏反馈不影响校验和必填语义。"
    ]
  },
  {
    "name": "HysInput",
    "shortName": "Input",
    "label": "文本输入",
    "slug": "hys-input",
    "category": "表单输入",
    "description": "支持格式解析、图标与复合输入、密码切换、多行内容和可见字符计数的文本输入控件。",
    "notes": [
      "formatter 改变显示，parser 还原原始文本；模型、计数与原生表单提交使用原始值。",
      "type=textarea 启用多行输入，autosize 可配置最少与最多行数。",
      "countGraphemes=true 使用可见字符计数，也支持自定义计数函数。",
      "禁用、只读和表单尺寸配置会继承到内部输入；组件显式配置优先。"
    ]
  },
  {
    "name": "HysNumberInput",
    "shortName": "NumberInput",
    "label": "数字输入",
    "slug": "hys-number-input",
    "category": "表单输入",
    "description": "支持空值、小数与大数精度、格式解析及多种步进方式的数字输入控件。",
    "notes": [
      "空值使用 null；需要清空的模型建议声明为 number | null，0 仍是有效数值。",
      "默认确认或失焦时提交，updateOnInput 可启用合法输入即时更新；Escape 撤销未提交草稿。",
      "stringMode 使用十进制字符串保留大数与小数精度，步长和范围也建议使用字符串。",
      "showControls 控制加减按钮显示，controlsPosition 可切换两侧或右侧布局。",
      "selectOnFocus 控制聚焦全选，分页跳转场景开启此项。"
    ]
  },
  {
    "name": "HysCheckboxGroup",
    "shortName": "CheckboxGroup",
    "label": "复选框组",
    "slug": "hys-checkbox-group",
    "category": "表单输入",
    "description": "管理多项选择，支持数量约束、全选、字段映射和自定义选项。",
    "notes": [
      "值保留原始类型；不可编辑的选择与未加载的值由宿主维护。",
      "全选和清除遵守 min / max，不会自动改写外部传入的初值。"
    ]
  },
  {
    "name": "HysRadio",
    "shortName": "Radio",
    "label": "单选框",
    "slug": "hys-radio",
    "category": "表单输入",
    "description": "在互斥选项中选择一个值，支持按钮外观、自定义内容和表单语义。",
    "notes": [
      "多个独立单选框使用相同的模型和 name。",
      "使用 HysRadioGroup 获得分组配置和完整键盘导航。"
    ]
  },
  {
    "name": "HysRadioGroup",
    "shortName": "RadioGroup",
    "label": "单选组",
    "slug": "hys-radio-group",
    "category": "表单输入",
    "description": "单选组的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysRating",
    "shortName": "Rating",
    "label": "评分",
    "slug": "hys-rating",
    "category": "表单输入",
    "description": "评分的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysSearch",
    "shortName": "Search",
    "label": "搜索框",
    "slug": "hys-search",
    "category": "表单输入",
    "description": "搜索框的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysSegmented",
    "shortName": "Segmented",
    "label": "分段选择",
    "slug": "hys-segmented",
    "category": "表单输入",
    "description": "分段选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysSelect",
    "shortName": "Select",
    "slug": "hys-select",
    "category": "表单输入",
    "description": "下拉选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ],
    "label": "下拉选择"
  },
  {
    "name": "HysSlider",
    "shortName": "Slider",
    "label": "滑块",
    "slug": "hys-slider",
    "category": "表单输入",
    "description": "通过自定义轨道和滑块选择数值，支持精确步长、范围拖动、刻度与键盘操作。",
    "notes": [
      "轨道点击定位最近端点，拖动时实时更新数值，释放后触发 change。",
      "Tab 聚焦端点，方向键调整一步，Home/End 定位边界；Escape 撤销当前拖动。"
    ]
  },
  {
    "name": "HysSwitch",
    "shortName": "Switch",
    "label": "开关",
    "slug": "hys-switch",
    "category": "表单输入",
    "description": "开关的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTagInput",
    "shortName": "TagInput",
    "label": "标签输入",
    "slug": "hys-tag-input",
    "category": "表单输入",
    "description": "标签输入的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTextarea",
    "shortName": "Textarea",
    "label": "多行文本",
    "slug": "hys-textarea",
    "category": "表单输入",
    "description": "多行文本的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTransfer",
    "shortName": "Transfer",
    "label": "穿梭框",
    "slug": "hys-transfer",
    "category": "表单输入",
    "description": "穿梭框的独立交互示例、配置场景与类型参考。",
    "notes": [
      "拖动条目到另一侧释放，或使用勾选与方向按钮移动。",
      "禁用项不参与移动，拖拽预览、目标高亮与释放动画遵循减少动态效果设置。"
    ]
  },
  {
    "name": "HysTreeSelect",
    "shortName": "TreeSelect",
    "label": "树形选择",
    "slug": "hys-tree-select",
    "category": "表单输入",
    "description": "树形选择的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysUpload",
    "shortName": "Upload",
    "label": "文件上传",
    "slug": "hys-upload",
    "category": "表单输入",
    "description": "管理文件选择、异步上传、状态反馈与图片预览。",
    "notes": [
      "不配置 action 或 customRequest 时保留本地选择；示例请求使用浏览器内模拟。",
      "远程列表可使用 HysUploadItem；文件 uid 唯一稳定，取消和缓存页面离开会清理任务。"
    ]
  },
  {
    "name": "HysCalendar",
    "shortName": "Calendar",
    "label": "事件日历",
    "slug": "hys-calendar",
    "category": "数据展示",
    "description": "事件日历的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysCalendarNavigation",
    "shortName": "CalendarNavigation",
    "label": "日历导航",
    "slug": "hys-calendar-navigation",
    "category": "数据展示",
    "description": "日历导航的独立交互示例、配置场景与类型参考。",
    "notes": [
      "month 使用 UTC 月初 Date，通过 update:month 同步变化。",
      "点击年份进入年份面板，选年后定位月份，再选月返回日期面板。标题也可以返回。"
    ]
  },
  {
    "name": "HysChart",
    "shortName": "Chart",
    "label": "图表",
    "slug": "hys-chart",
    "category": "数据展示",
    "description": "图表的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysDataGrid",
    "shortName": "DataGrid",
    "label": "高级表格",
    "slug": "hys-data-grid",
    "category": "数据展示",
    "description": "高级表格的独立交互示例、配置场景与类型参考。",
    "notes": [
      "筛选图标切换表头下的统一筛选行，可通过“收起筛选”关闭。",
      "点击升降序图标分别排序，multiSort 支持多列。拖动表头及列设置手柄调整顺序。",
      "storageKey 只在明确传入时保存列设置，每个表格使用独立键。serverMode 的数据由调用方加载。"
    ]
  },
  {
    "name": "HysProGrid",
    "shortName": "ProGrid",
    "label": "可编辑数据表格",
    "slug": "hys-pro-grid",
    "category": "数据展示",
    "description": "在 DataGrid 的查询和列布局上增加类型化编辑、异步校验和保存重试。",
    "notes": [
      "提供稳定且唯一的 rowKey，保存后在 cellCommit 中更新 rows。",
      "在 DataGrid 基础样式之外按需引入 hys-ui/pro-grid.css。"
    ]
  },
  {
    "name": "HysSpreadsheet",
    "shortName": "Spreadsheet",
    "label": "电子表格",
    "slug": "hys-spreadsheet",
    "category": "数据展示",
    "description": "用工作表、公式栏和矩形选区编辑预算、清单与日常台账。",
    "notes": ["单击选中后直接键入新值，双击或按 F2 修改原内容。可从一格开始粘贴 Excel 的制表符文本。", "使用 v-model 保存工作簿，模型中的公式保留为以等号开头的字符串。"]
  },
  {
    "name": "HysDiffViewer",
    "shortName": "DiffViewer",
    "label": "差异对比",
    "slug": "hys-diff-viewer",
    "category": "数据展示",
    "description": "差异对比的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysGantt",
    "shortName": "Gantt",
    "label": "甘特图",
    "slug": "hys-gantt",
    "category": "数据展示",
    "description": "甘特图的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysKanban",
    "shortName": "Kanban",
    "label": "看板",
    "slug": "hys-kanban",
    "category": "数据展示",
    "description": "看板的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysOrgTree",
    "shortName": "OrgTree",
    "label": "组织树",
    "slug": "hys-org-tree",
    "category": "数据展示",
    "description": "组织树的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysProgress",
    "shortName": "Progress",
    "label": "进度条",
    "slug": "hys-progress",
    "category": "数据展示",
    "description": "展示操作进度、部分成功、分段步骤与未知总量。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTable",
    "shortName": "Table",
    "label": "基础表格",
    "slug": "hys-table",
    "category": "数据展示",
    "description": "基础表格的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTimeline",
    "shortName": "Timeline",
    "label": "时间轴",
    "slug": "hys-timeline",
    "category": "数据展示",
    "description": "时间轴的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTree",
    "shortName": "Tree",
    "label": "树形组件",
    "slug": "hys-tree",
    "category": "数据展示",
    "description": "树形组件的独立交互示例、配置场景与类型参考。",
    "notes": [
      "方向键导航，Enter 选择，空格勾选；禁用节点跳过交互。",
      "node-drop 提供 before/inside/after，使用方根据事件更新节点树。",
      "loadChildren 抛出异常后显示重试入口；虚拟模式需设置视口高度。"
    ]
  },
  {
    "name": "HysVirtualTable",
    "shortName": "VirtualTable",
    "label": "虚拟表格",
    "slug": "hys-virtual-table",
    "category": "数据展示",
    "description": "虚拟表格的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysAccordion",
    "shortName": "Accordion",
    "label": "折叠面板",
    "slug": "hys-accordion",
    "category": "导航布局",
    "description": "折叠面板的独立交互示例、配置场景与类型参考。",
    "notes": [
      "稳定 id 用于受控展开；未提供 id 时继续使用索引。多个条目应使用不同标识。",
      "标题支持上下方向键、Home 和 End 导航；Enter 或空格切换展开。保留模式下可通过 lazy 控制首次挂载。"
    ]
  },
  {
    "name": "HysBreadcrumb",
    "shortName": "Breadcrumb",
    "label": "面包屑",
    "slug": "hys-breadcrumb",
    "category": "导航布局",
    "description": "带同级导航、层级折叠与路由适配的面包屑。",
    "notes": [
      "link 插槽适配宿主路由，组件库不依赖 Vue Router。item 与 separator 插槽可自定义显示内容。",
      "末项表示当前页面；禁用项不产生链接。新窗口默认链接会补充安全 rel 属性。",
      "children 提供同级导航，maxItems 折叠中间层级；事件索引始终对应原始 items。"
    ]
  },
  {
    "name": "HysResizablePanel",
    "shortName": "ResizablePanel",
    "label": "可调整面板",
    "slug": "hys-resizable-panel",
    "category": "导航布局",
    "description": "可调整面板的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysSplitPane",
    "shortName": "SplitPane",
    "label": "分割面板",
    "slug": "hys-split-pane",
    "category": "导航布局",
    "description": "用可拖拽分隔条组织工作区，支持多面板联动、尺寸吸附、折叠和按容器宽度切换方向。",
    "notes": [
      "聚焦分隔条后可按方向键调整尺寸，Shift 加大步长，Home 和 End 到达可用边界。相邻面板支持折叠时，可按 Enter 切换。",
      "双面板的 v-model 表示首个面板的百分比。多面板使用 v-model:sizes，键为面板 id，数值为像素，也可使用 px 或 % 字符串。"
    ]
  },
  {
    "name": "HysSteps",
    "shortName": "Steps",
    "label": "步骤条",
    "slug": "hys-steps",
    "category": "导航布局",
    "description": "步骤条的独立交互示例、配置场景与类型参考。",
    "notes": [
      "current 从 0 开始；-1 表示尚未开始，items.length 表示全部完成。单项 status 优先。",
      "clickable 开启后可点击或用方向键选择可用步骤，业务前置条件由调用方控制。"
    ]
  },
  {
    "name": "HysTabPane",
    "shortName": "TabPane",
    "label": "标签面板",
    "slug": "hys-tab-pane",
    "category": "基础组件",
    "description": "通过声明式面板配置标题、图标、生命周期和内容模板。",
    "notes": ["在 HysTabs 的默认插槽或 panes 插槽中声明面板，为每项指定唯一 value。", "声明式列表由父组件维护，关闭和添加通过事件通知。"]
  },
  {
    "name": "HysTabs",
    "shortName": "Tabs",
    "label": "标签页",
    "slug": "hys-tabs",
    "category": "导航布局",
    "description": "标签页的独立交互示例、配置场景与类型参考。",
    "notes": [
      "页签值支持字符串或数字；使用 panel 插槽可为各项建立独立的内容实例。",
      "beforeLeave 和 beforeClose 可异步阻止操作；添加和关闭事件由调用方维护 items。"
    ]
  },
  {
    "name": "HysAlert",
    "shortName": "Alert",
    "label": "消息提示",
    "slug": "hys-alert",
    "category": "反馈浮层",
    "description": "消息提示的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysCommandPalette",
    "shortName": "CommandPalette",
    "label": "命令面板",
    "slug": "hys-command-palette",
    "category": "反馈浮层",
    "description": "命令面板的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysContextMenu",
    "shortName": "ContextMenu",
    "label": "右键菜单",
    "slug": "hys-context-menu",
    "category": "反馈浮层",
    "description": "多种触发方式、嵌套操作、选择与键盘导航。",
    "notes": [
      "默认保持右键触发；trigger 可配置点击、悬停、焦点或组合。条目 value 在整棵菜单中保持唯一。",
      "复选与单选项默认操作后不关闭，closeOnSelect 可逐项覆盖。受控状态允许宿主拒绝请求。",
      "子菜单使用左右方向键进入与返回；小屏幕提供逐级返回。页面离开、禁用或父弹窗关闭时清理浮层和延迟任务。"
    ]
  },
  {
    "name": "HysDrawer",
    "shortName": "Drawer",
    "label": "抽屉",
    "slug": "hys-drawer",
    "category": "反馈浮层",
    "description": "支持异步操作、容器布局、嵌套与边缘缩放的抽屉。",
    "notes": [
      "保留原有 :open / @close 用法，同时支持 v-model:open、v-model 和非受控 defaultOpen。close 表示通过守卫的关闭请求；closed 表示退出完成。",
      "beforeClose / beforeConfirm 接收 AbortSignal。宿主关闭、离开缓存页面或变更回调会撤销过期操作；异步函数应配合 signal 清理自己的资源。",
      "resizable 从靠近页面中心的边缘调整尺寸，按帧预览并在释放时提交 resizeValue；受控拒绝会恢复原尺寸。contained 需要有定位的父容器。"
    ]
  },
  {
    "name": "HysEmpty",
    "shortName": "Empty",
    "label": "空状态",
    "slug": "hys-empty",
    "category": "反馈浮层",
    "description": "展示友好的空状态、图片回退与下一步操作。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysModal",
    "shortName": "Modal",
    "label": "对话框",
    "slug": "hys-modal",
    "category": "反馈浮层",
    "description": "用于确认、表单与内容展示，支持异步操作、关闭拦截、拖拽调整和调用式弹窗。",
    "notes": [
      "打开时限制焦点范围并锁定背景滚动，关闭后恢复触发控件焦点。"
    ]
  },
  {
    "name": "HysNotificationCenter",
    "shortName": "NotificationCenter",
    "label": "通知中心",
    "slug": "hys-notification-center",
    "category": "反馈浮层",
    "description": "通知中心的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysPopconfirm",
    "shortName": "Popconfirm",
    "label": "气泡确认框",
    "slug": "hys-popconfirm",
    "category": "反馈浮层",
    "description": "在操作旁提示影响并请求确认，支持异步提交、失败重试和键盘操作。",
    "notes": [
      "把业务提交放到 action，组件会等待结果。@confirm 用来消费已完成的结果。",
      "默认聚焦取消按钮。Space 或 Enter 激活按钮，Escape 或点击外部可关闭，Tab 按操作顺序移动焦点。",
      "为危险操作写清对象和后果。支持主题变量、减少动效和浮层自动避让。"
    ]
  },
  {
    "name": "HysPopover",
    "shortName": "Popover",
    "label": "气泡浮层",
    "slug": "hys-popover",
    "category": "反馈浮层",
    "description": "支持轻量操作的气泡浮层，覆盖悬停、焦点、受控显示和键盘导航。",
    "notes": ["默认点击展开；Tab 可进入内容操作区，Escape 先关闭最上层浮层。","允许鼠标移入内容区；宽度、箭头、颜色、挂载位置和内容保留可独立配置。","触发区域可使用真实控件或外部 reference；自定义组件应转发原生属性与事件。"]
  },
  {
    "name": "HysShortcutHelp",
    "shortName": "ShortcutHelp",
    "label": "快捷键帮助",
    "slug": "hys-shortcut-help",
    "category": "反馈浮层",
    "description": "快捷键帮助的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysResult",
    "shortName": "Result",
    "label": "结果反馈",
    "slug": "hys-result",
    "category": "反馈浮层",
    "description": "为操作完成、权限不足和服务异常提供结果说明，以及明确的下一步操作。",
    "notes": [
      "异步更新结果时可使用 announce 开启播报，使用 announcement 提供定制文案。",
      "适合需要说明结果并提供返回、查看或重试等后续操作的场景。"
    ]
  },
  {
    "name": "HysSkeleton",
    "shortName": "Skeleton",
    "label": "骨架屏",
    "slug": "hys-skeleton",
    "category": "反馈浮层",
    "description": "骨架屏的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysToast",
    "shortName": "Toast",
    "label": "轻提示",
    "slug": "hys-toast",
    "category": "反馈浮层",
    "description": "轻提示的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysTooltip",
    "shortName": "Tooltip",
    "label": "文字提示",
    "slug": "hys-tooltip",
    "category": "反馈浮层",
    "description": "可配置触发、受控显示与位置的辅助说明，支持外观、挂载和内容保留。",
    "notes": ["默认支持悬停与聚焦；可以切换点击、右键、组合或手动模式。","text 与 content 插槽保留原有用法；说明内容默认不接受鼠标，可按需设置 enterable。","open 优先于 modelValue，显示请求由宿主接受；页面离开后清理浮层与监听。"]
  },
  {
    "name": "HysTour",
    "shortName": "Tour",
    "label": "引导",
    "slug": "hys-tour",
    "category": "反馈浮层",
    "description": "引导的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysColorTokenEditor",
    "shortName": "ColorTokenEditor",
    "label": "颜色令牌",
    "slug": "hys-color-token-editor",
    "category": "编辑工具",
    "description": "颜色令牌的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysCommentEditor",
    "shortName": "CommentEditor",
    "label": "评论编辑",
    "slug": "hys-comment-editor",
    "category": "编辑工具",
    "description": "评论编辑的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysCronEditor",
    "shortName": "CronEditor",
    "label": "定时表达式",
    "slug": "hys-cron-editor",
    "category": "编辑工具",
    "description": "定时表达式的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysFileManager",
    "shortName": "FileManager",
    "label": "文件管理",
    "slug": "hys-file-manager",
    "category": "编辑工具",
    "description": "文件管理的独立交互示例、配置场景与类型参考。",
    "notes": [
      "组件只维护文件展示与交互，上传、下载和删除接口由调用方实现。"
    ]
  },
  {
    "name": "HysJsonEditor",
    "shortName": "JsonEditor",
    "label": "JSON 编辑",
    "slug": "hys-json-editor",
    "category": "编辑工具",
    "description": "JSON 编辑的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysMention",
    "shortName": "Mention",
    "label": "提及",
    "slug": "hys-mention",
    "category": "编辑工具",
    "description": "提及的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  },
  {
    "name": "HysRichTextEditor",
    "shortName": "RichTextEditor",
    "label": "富文本编辑",
    "slug": "hys-rich-text-editor",
    "category": "编辑工具",
    "description": "富文本编辑的独立交互示例、配置场景与类型参考。",
    "notes": [
      "通过下面的交互示例体验组件，配置区可即时调整属性。",
      "v-model 与事件由调用方维护状态；点击重置可恢复当前场景。"
    ]
  }
] as const
