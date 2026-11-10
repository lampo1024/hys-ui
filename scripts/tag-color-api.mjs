import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
export function applyTagColorApi(name, api, root) {
  if (!["HysTagInput", "HysColorPicker"].includes(name)) return;
  const fileName = name === "HysTagInput" ? "tagInput.ts" : "color.ts",
    file = ts.createSourceFile(
      fileName,
      fs.readFileSync(
        path.join(root, "packages/ui/src/composables", fileName),
        "utf8",
      ),
      ts.ScriptTarget.Latest,
      true,
    ),
    instance = file.statements.find(
      (s) => ts.isInterfaceDeclaration(s) && s.name.text === name + "Instance",
    );
  api.exposed = instance.members.map((m) => ({
    name: m.name.getText(file),
    type: m.type?.getText(file) || "",
    required: !m.questionToken,
    default: "",
    description: "",
  }));
  const text =
    name === "HysTagInput"
      ? {
          modelValue: "受控标签字符串数组；宿主可以拒绝更新",
          defaultValue: "非受控初始标签；组件不修改传入数组",
          max: "标签数量上限；默认 10，Infinity 不限制，0 禁止新增",
          placeholder: "草稿为空时的占位文字",
          disabled: "禁止全部操作，继承表单/字段状态",
          readonly: "只读展示，允许聚焦和查看折叠标签",
          size: "sm / md / lg，继承表单/字段尺寸",
          addOnBlur: "焦点离开整个组件时保存草稿，默认 true",
          separator: "保存时拆分的单个字符串分隔符；保留原有行为",
          delimiters:
            "输入/粘贴时拆分的字符串、字符串数组或正则，优先于 separator",
          trigger:
            "添加按键 Enter / Space / Tab 或按键数组；Tab 仍允许正常移出焦点",
          beforeAdd:
            "同步或异步检查；接收 value 与 {signal,values,reason}，false 或异常拒绝",
          allowDuplicates: "允许相同标签重复出现",
          caseSensitive: "重复判定区分大小写，默认 true",
          trim: "添加前去除两端空白，默认 true",
          clearable: "显示清空标签与草稿的按钮",
          clearIcon: "替代清空图标的组件；clear-icon 插槽优先",
          tagTone: "primary / success / warning / danger / neutral 标签颜色",
          tagEffect: "light / dark / outline 标签外观",
          tagRound: "圆角胶囊标签",
          draggable: "允许标签拖拽及 Alt+方向键排序",
          collapseTags: "折叠超过 maxCollapseTags 的标签",
          maxCollapseTags: "直接展示的标签数，默认 1，允许 0",
          collapseTagsTooltip: "显示可展开的折叠标签列表；列表按可见范围渲染",
          overflowHeight: "折叠列表高度上限，默认 240px，约束 72–480px",
          maxTagTextLength: "单个标签显示长度上限；完整值保留在标题与数据中",
          maxlength: "单个标签及原生草稿的最大文字长度",
          minlength: "单个标签最小文字长度",
          ariaLabel: "文本输入的辅助技术名称，默认使用字段标签或 输入标签",
          label: "辅助技术名称的备用值",
          name: "以多个同名隐藏字段提交已接受标签，不提交草稿",
          form: "关联原生 form ID",
          autocomplete: "原生文本自动完成策略，默认 off",
          autofocus: "挂载时聚焦文本输入",
          tabindex: "文本输入的 Tab 顺序",
          status: "外部 error / warning / success 状态",
          error: "外部错误文案，同时关联输入语义",
          validateEvent: "触发主动表单校验；表单模型本身的自动检查仍由表单控制",
          inputProps: "附加原生文本属性；固定的状态和输入行为优先",
        }
      : {
          modelValue: "受控字符串颜色，原有即时十六进制接口保持兼容",
          defaultValue: "非受控初始颜色，默认空值",
          disabled: "禁止全部操作并关闭浮层，继承表单/字段状态",
          readonly: "保留查看和聚焦，禁止颜色编辑",
          size: "sm / md / lg，继承表单/字段尺寸",
          label: "颜色触发器的辅助技术名称",
          ariaLabel: "显式辅助技术名称",
          presets: "常用颜色数组；支持解析格式与透明色，无效值跳过",
          clearable: "允许清空为字符串空值，默认 false",
          showAlpha: "显示透明度轨道并在输出中保留透明度",
          format:
            "输出 hex / rgb / hsl / hsv；未指定时无透明度用 hex，有透明度用 rgb",
          immediate: "默认 true 即时更新；false 暂存预览，确认后更新",
          showInput: "显示触发器旁和面板内的颜色文本框",
          showText: "触发器同时显示颜色文字，可配合 showInput=false 紧凑展示",
          showPresets: "显示常用颜色网格",
          inline: "内嵌展示面板，不创建浮层",
          open: "受控浮层显示；inline 时不生效",
          defaultOpen: "非受控初始浮层显示",
          placement: "浮层位置，默认 bottom-start，支持边缘避让",
          appendTo: "浮层挂载目标，默认 body，false 保留原地",
          popupClass: "附加面板类名",
          popupStyle: "面板附加样式；定位由组件维护",
          popupWidth: "面板宽度，默认 288px，不超过视口空间",
          showFooter: "显示默认或自定义操作区",
          confirmText: "确认/完成操作文字",
          cancelText: "取消预览操作文字",
          clearText: "清空操作文字",
          status: "外部反馈状态",
          error: "外部错误文案",
          name: "隐藏字段提交实际已接受颜色，不提交预览",
          form: "关联原生 form ID",
          tabindex: "触发器的 Tab 顺序",
          autofocus: "挂载时聚焦颜色输入或面板",
          validateEvent:
            "主动表单校验；连续指针编辑在释放时检查一次，表单模型其他自动检查仍由表单控制",
          inputProps: "附加外部颜色文本框原生属性",
        };
  for (const prop of api.props)
    prop.description = text[prop.name] || prop.description;
  const defaults =
    name === "HysTagInput"
      ? { modelValue: "未设置", size: "继承字段/表单或 md", max: "10" }
      : {
          modelValue: "未设置",
          open: "未设置",
          size: "继承字段/表单或 md",
          format: "hex（默认）/ rgb（showAlpha=true）",
        };
  for (const prop of api.props)
    if (prop.name in defaults) prop.default = defaults[prop.name];
  const events = {
    change:
      name === "HysTagInput"
        ? "兼容的变更请求：新数组；受控宿主仍可拒绝"
        : "已接受颜色变化：(value)",
    acceptedChange: "已接受标签变化的新数组；副作用和成功提示建议使用此事件",
    add: "通过检查的新增请求标签；保持原字符串参数",
    remove: "删除请求的标签文字；保持原字符串参数",
    reject: "未通过重复、上限、长度或守卫检查的标签文字",
    invalid:
      name === "HysTagInput"
        ? "详细拒绝信息 {value,reason,error?}"
        : "无法解析的原始颜色文本",
    clear: "完成清空后触发",
    input: "草稿文字变化，不是标签数组变更",
    focus: "整个控件获得焦点的 FocusEvent",
    blur: "焦点离开控件和浮层后的 FocusEvent",
    compositionend: "原生组合输入结束事件",
    reorder: "请求排序：(from,to,values)，数组编号从 0 开始",
    activeChange: "颜色预览变化：(value)，确认模式不写模型",
    visibleChange: "实际浮层可见状态变化",
    confirm: "确认已被接受：(value)",
    cancel: "显式取消预览",
    "update:open": "请求显示或收起浮层",
    "update:modelValue": "请求更新模型值",
  };
  for (const event of api.events)
    event.description = events[event.name] || event.description;
  const slots = {
    tag: "标签内容，兼容 value/index，并提供 disabled/readonly/remove",
    prefix: "输入前缀；接收 values/draft/pending/disabled/readonly/add/clear",
    suffix: "输入后缀，接收同样的上下文",
    "clear-icon": "自定义清空图标，接收输入上下文",
    "remove-icon": "自定义单个移除图标，接收标签上下文",
    "collapse-tag": "折叠触发内容，接收隐藏 count/values",
    trigger: "自定义触发器；使用上下文 show/hide 方法负责显示",
    header: "面板顶部内容，接收当前颜色与预览上下文",
    footer: "面板操作区；接收 confirm/cancel/clear 和 valid/dirty 状态",
    preset: "预设颜色内容，接收原始 value、CSS color、selected、disabled",
  };
  for (const slot of api.slots)
    slot.description = slots[slot.name] || slot.description;
  const methods = {
    element: "控件根元素",
    input: "外部文本输入节点",
    panel: "当前颜色面板节点",
    values: "当前实际标签列表",
    value: "当前实际颜色值",
    draft: "当前草稿文字",
    color: "当前预览的 HSV 与透明度快照",
    pending: "标签异步检查状态",
    open: "颜色面板是否展示，内嵌面板在活动页面中为 true",
    focus: "聚焦文本框或可用触发器/内嵌色板",
    blur: "移除控件内当前焦点",
    add: "检查并请求添加一个或多个标签，返回是否已接受",
    remove: "按当前数组下标移除标签，返回是否已接受",
    clear: "请求清空；遵守禁用、只读和颜色 clearable",
    move: "按当前数组下标排序；需要 draggable=true",
    setDraft: "只更新标签草稿，不提交",
    show: "请求打开颜色浮层，返回是否已展示",
    hide: "请求关闭颜色浮层；内嵌面板不关闭",
    confirm: "应用预览并在接受后关闭浮层",
    cancel: "放弃预览并请求关闭浮层",
    setColor: "解析颜色并预览；即时模式同时请求更新，返回结果",
  };
  for (const member of api.exposed)
    member.description = methods[member.name] || "";
}
