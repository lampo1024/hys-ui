export const datePickerProps = {
  value: "受控绑定别名，支持 v-model:value；同时设置时 modelValue 优先。",
  type: "date / week / month / quarter / year / datetime；复选 dates / weeks / months / quarters / years；统一范围 daterange / weekrange / monthrange / quarterrange / yearrange / datetimerange。",
  picker:
    "date / week / month / quarter / year；覆盖 type 的选取粒度，范围或多选仍由组件与 type 决定。",
  format:
    "字符串、(date: Date) => string 或混合数组。首项控制展示，数组中所有字符串均用于解析；格式函数只参与展示。",
  inputFormats:
    "额外可解析的字符串格式，依次尝试 format 中的字符串、inputFormats、valueFormat 或默认绑定格式。",
  id: "触发器 ID；可编辑范围可传 [开始 ID, 结束 ID]。单个 ID 时结束端附加 -end。",
  placeholder:
    "单选或非编辑范围的整体占位；范围也可传 [开始提示, 结束提示]，startPlaceholder 和 endPlaceholder 优先。",
  allowClear: "覆盖 clearable 是否展示清空按钮，未设置时使用 clearable。",
  emptyValues: "视为空的附加值集合，也适用于各端点；配置的哨兵值保留给空态。",
  valueOnClear:
    "清空时输出的值，或点击清空时调用的函数；优先于 clearValue。使用自定义哨兵时可用 emptyValues 声明初始空态。",
  automaticDropdown:
    "覆盖 showOnFocus；true 在触发器聚焦时打开，恢复焦点时保持关闭。",
  defaultPickerValue:
    "无选中值时的初始浏览日期；范围可传两个日期分别定位面板。每次打开按当前选择或该默认值定位。",
  panelValues:
    "双面板的受控浏览位置 [开始面板, 结束面板]，支持 v-model:panelValues，优先于 panelValue。",
  mode: "受控面板 date / month / quarter / year / decade / time；time 需要启用日期时间选择。",
  defaultMode:
    "每次打开的初始视图，默认跟随选择粒度。decade 先选年代，time 打开时显示时间区。",
  showWeekNumber:
    "是否在普通日历显示周号，优先于 showWeekNumbers；周选择模式始终显示周号。",
  presets:
    "快捷日期或范围，形状为 {label, value, disabled?}；value 可传静态值或点击时执行的函数。",
  ranges:
    "按名称映射到范围数组或返回范围的函数；在 shortcuts、presets 之后显示。",
  shortcutPlacement: "top 在日历上方，start 在逻辑起始侧，窄屏回到上方。",
  showTime:
    "布尔值或时间选项对象；支持 defaultValue、format、use12Hours、hourStep、minuteStep、secondStep、hideDisabledOptions。",
  defaultTime:
    "新选日期的默认时刻，接受 HH:mm[:ss] 或本地 Date；范围可传两个值。日期范围可通过 Date、时间戳或含时间的 valueFormat 保留时刻。优先于 showTime.defaultValue。",
  dateFormat:
    "日期时间面板的日期字段格式，如 YYYY/MM/DD ddd；启用后可在面板内直接编辑日期。",
  timeFormat:
    "日期时间面板的时间字段格式，如 hh:mm A；优先于 showTime.format。格式含 s 或 ss 时显示秒列表。",
  use12Hours:
    "使用 12 小时显示和 AM / PM；优先于 showTime.use12Hours。未设置时可从面板时间格式的 h / hh 推断。",
  disabledTime:
    "接收本地时刻 Date 和 {iso, range, from}；返回 hours、minutes(hour)、seconds(hour, minute)，也支持相应的 disabled* 函数。",
  disabledHours:
    "(range, from) => number[]，禁用 0–23 的小时，与 disabledTime 合并。",
  disabledMinutes:
    "(hour, range, from) => number[]，禁用 0–59 的分钟，与 disabledTime 合并。",
  disabledSeconds:
    "(hour, minute, range, from) => number[]，禁用 0–59 的秒，与 disabledTime 合并。",
  hourStep:
    "小时选项步长，整数 1–24，默认 1；showTime.hourStep 优先，保留当前值。",
  minuteStep:
    "分钟选项步长，整数 1–60，默认 1；showTime.minuteStep 优先，保留当前值。",
  secondStep:
    "秒选项步长，整数 1–60，默认 1；showTime.secondStep 优先，保留当前值。",
  hideDisabledOptions:
    "隐藏已禁用的时间选项；优先于 showTime.hideDisabledOptions，默认保留并禁用。",
  arrowControl: "为时、分、秒增加步进按钮，循环浏览同列的可选值。",
  separator:
    "范围文字分隔符，优先于 rangeSeparator；range-separator 插槽可渲染自定义内容。",
  placement:
    "默认 bottom-start；支持十二个方向，也可使用 bottomLeft / bottomRight / topLeft / topRight。",
  teleported:
    "false 将浮层保留在控件旁；默认为挂载到 appendTo 或 getPopupContainer 的目标。",
  getPopupContainer:
    "(trigger: HTMLElement) => HTMLElement，浮层打开时解析挂载目标，优先于 appendTo。",
  fallbackPlacements:
    "有序候选定位数组；首选位置溢出时按顺序尝试，均溢出时选择溢出最少的位置。",
  popperOptions:
    "HYS 浮层定位设置。strategy 为 fixed / absolute，offset 默认 8px，padding 默认 10px，flip=false 禁止翻转。",
  popupClassName: "附加浮层类名，与 popupClass、popperClass 叠加。",
  popperClass: "附加浮层类名，与 popupClass、popupClassName 叠加。",
  popperStyle:
    "附加浮层 CSS 对象或样式字符串；同名样式由 popupStyle 和计算定位覆盖。",
  prefixIcon:
    "输入区前缀，可传 Vue 图标组件或已注册的组件名；prefix 插槽优先。",
  clearIcon:
    "清空按钮图标，可传 Vue 图标组件或已注册的组件名；clear-icon 插槽优先。",
};

export const datePickerDefaults = {
  shortcutPlacement: "top",
  arrowControl: "false",
  teleported: "true（等效默认）",
  allowClear: "跟随 clearable",
  automaticDropdown: "跟随 showOnFocus",
  showWeekNumber: "跟随 showWeekNumbers",
  hideDisabledOptions: "false",
  placement: "bottom-start",
};

export const datePickerEvents = {
  "update:value":
    "值更新请求，载荷为下一次绑定值 V；与 update:modelValue 同步发出。",
  "update:panelValues":
    "范围面板翻页、跳转等请求，载荷为 [左面板 Date, 右面板 Date]，均为对应月份 1 日的本地零时。",
  openChange:
    "浮层实际打开或关闭时触发，载荷为 boolean；与 visible-change 同时触发。",
  calendarChange:
    "选择日期、调整时间、选择预设或清除草稿端点后触发，载荷 (value, {range, dates, formatted})。",
};

export const datePickerSlots = {
  "extra-footer":
    "在默认操作区上方追加内容，参数 {dates, view}；不替换确认等操作。",
  "date-render":
    "日期网格模板，参数同 cell；含 range、rangeStart、rangeEnd、row、column。",
  "month-cell-render": "月份网格模板，参数同 cell；row、column 从 0 起算。",
  "range-separator":
    "范围触发器中间的分隔内容，适用于按钮触发器和可编辑的双输入框。",
};
