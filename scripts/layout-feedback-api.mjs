const descriptions = {
  props: {
    items: [
      "业务字段数组。每项包含唯一 key、label、value，并可配置跨行跨列、对齐和格式化。",
      "[]",
    ],
    title: [
      "详情区标题，title 插槽优先。同时用作区域可访问名称，ariaLabel 优先。",
    ],
    extra: ["标题旁的说明文字，extra 插槽优先。适合放刷新、编辑等操作。"],
    columns: [
      "每行列数为 1–24。可传固定数值或按组件容器宽度生效的 xs、sm、md、lg、xl、xxl。",
      "{ xs: 1, sm: 2, lg: 3 }",
    ],
    layout: ["horizontal 将标签放在值左侧，vertical 将标签放在值上方。"],
    size: ["字段密度，sm、md、lg 分别使用 8、12、16 px 的基础留白。"],
    bordered: ["显示外框、字段分隔线和标签背景。", "false"],
    colon: ["在字段标签后添加全角冒号。辅助技术仍读取原始标签。", "false"],
    labelWidth: [
      "横向布局的标签宽度，支持非负像素数值或 CSS 长度，最多占字段宽度的 45%。单项 labelWidth 优先。",
      "88px",
    ],
    labelAlign: [
      "标签的逻辑水平对齐，start、center 或 end。单项 labelAlign 优先。",
    ],
    align: ["字段值的逻辑水平对齐，start、center 或 end。单项 align 优先。"],
    labelStyle: ["传给所有标签节点的 CSSProperties。单项 labelStyle 可覆盖。"],
    contentStyle: [
      "传给所有值节点的 CSSProperties。单项 contentStyle 可覆盖。",
    ],
    placeholder: [
      "值或格式化结果为 null、undefined 或空字符串时显示。保留 0 和 false。",
    ],
    emptyText: ["没有可见字段时的文案，empty 插槽优先。"],
    ariaLabel: ["详情区域的可访问名称，显式值覆盖可见标题。"],
  },
  slots: {
    title: ["自定义区域标题。"],
    extra: ["自定义标题旁的操作区。"],
    label: [
      "统一渲染字段标签，接收 { item, index, value, text }。单字段插槽优先。",
    ],
    value: [
      "统一渲染字段值，接收 { item, index, value, text }。单字段插槽优先。",
    ],
    empty: ["在所有字段缺失、隐藏或列表为空时渲染空状态。"],
  },
};

const space = {
  props: {
    direction: ["horizontal 横排，vertical 竖排。沿用文档的文字方向。"],
    size: [
      "sm / md / lg 对应 8 / 12 / 20 px。也可传非负像素、CSS 长度或 [横向, 纵向]。",
    ],
    align: [
      "交叉轴对齐，start、center、end、baseline 或 stretch。横排默认居中，竖排默认从起始边对齐，竖排 fill 时默认伸展。",
      "随方向和 fill 决定",
    ],
    justify: [
      "主轴分布，start、center、end、between、around、evenly。搭配 block 可分配剩余空间。",
    ],
    wrap: ["横排项目超过可用宽度时换行，保留 DOM 和键盘操作顺序。", "false"],
    block: ["占满父容器宽度。", "false"],
    fill: [
      "隐式启用块级宽度，让横排项目伸缩，竖排项目默认填满交叉轴。组件自己的宽度可通过子组件的 block 等属性控制。",
      "false",
    ],
    fillRatio: [
      "横排且 fill 时每项的 flex-basis，占容器宽度的百分比。范围 0–100，换行时还需计入间距。省略时可换行布局以内容宽度为基准，单行布局均分可用宽度。",
      "随 wrap 决定",
    ],
    separator: [
      "项目之间的装饰文字。separator 插槽优先，分隔内容随后一项换行。",
    ],
  },
  slots: {
    default: [
      "参与布局的项目。条件注释与空白文本会跳过，模板分组中的项目可单独参与排版。",
    ],
    separator: [
      "自定义装饰性分隔内容，接收 { index, count }。index 为后一个项目从 0 开始的索引。",
    ],
  },
};

const result = {
  props: {
    status: [
      "控制语义样式、默认标题和图标。支持 primary、info、success、warning、error 以及数字或字符串 403、404、500。",
    ],
    title: ["结果标题。省略时使用状态预设，空字符串可隐藏。title 插槽优先。"],
    subtitle: ["标题下的补充信息，subtitle 插槽优先。"],
    icon: [
      "自定义 Vue 图标组件或 false 隐藏预设图标。icon 插槽优先。",
      "按状态选择",
    ],
    showCode: [
      "显示异常状态的视觉状态码。自定义播报可通过 announcement 配置。",
    ],
    size: ["sm、md、lg 控制内边距、标题字号和图标大小。"],
    align: ["center 居中，start 与容器文字方向的起始边对齐。"],
    headingLevel: ["结果标题使用的原生标题层级，支持 2–6。"],
    announce: [
      "off 关闭结果播报，polite 等待当前内容读完，assertive 优先播报。适用于结果内容在页面内动态更新。",
    ],
    announcement: [
      "覆盖辅助技术播报文案。省略时由状态码、标题和副标题组成。自定义标题插槽时可显式传入。",
    ],
  },
  slots: {
    default: [
      "结果正文，例如失败原因、单据编号或可展开的诊断信息。接收 { status, code, title, subtitle }。",
    ],
    icon: ["自定义装饰图标。接收结果上下文，图标区域对辅助技术隐藏。"],
    title: [
      "自定义标题内容。接收结果上下文，保留 headingLevel 的原生标题语义。",
    ],
    subtitle: ["自定义补充说明，接收结果上下文。"],
    extra: ["结果后的操作区，接收结果上下文，例如返回、查看或重试。"],
  },
  exposed: {
    element: ["结果区域的 HTMLElement，挂载前为 undefined。"],
    focus: ["聚焦结果标题。标题隐藏时聚焦区域，支持原生 FocusOptions。"],
  },
};

const all = {
  HysDescriptions: descriptions,
  HysSpace: space,
  HysResult: result,
};

export function applyLayoutFeedbackApi(name, api) {
  const config = all[name];
  if (!config) return;
  for (const [section, definitions] of Object.entries(config))
    for (const row of api[section]) {
      const values = definitions[row.name];
      if (values) {
        row.description = values[0];
        if (values[1] !== undefined) row.default = values[1];
      }
    }
  if (name === "HysDescriptions")
    for (const [slot, description] of [
      ["label-[key]", "按 item.key 渲染指定字段的标签，优先于 label 插槽。"],
      ["value-[key]", "按 item.key 渲染指定字段的值，优先于 value 插槽。"],
    ]) {
      api.slots.push({
        name: slot,
        type: "(context: HysDescriptionContext) => VNodeChild",
        required: false,
        default: "",
        description,
      });
    }
}
