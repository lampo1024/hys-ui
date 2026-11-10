import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const properties = {
  rows: "只读业务行数组；追加保留滚动位置，缩短列表时限制到新的滚动范围",
  columns: "列定义，支持字段路径、值读取函数、格式化、尺寸、对齐、固定与排序",
  rowKey:
    "唯一行键字段或函数，默认 id；数字与字符串键独立，缺失或重复键的行不可选择",
  height: "表体视口高度，数值为像素，默认 280；表头和固定行高度单独计入",
  width: "表格宽度，默认随容器；数值为像素，也接受 CSS 长度",
  rowHeight: "统一行高，默认 42px；行样式不可改变虚拟布局所需的高度",
  headerHeight: "表头高度，默认 42px",
  showHeader: "显示固定在视口顶部的表头，默认 true",
  fit: "将剩余宽度分配给非固定列，遵循最大列宽",
  overscan: "上下缓冲行数，默认 5",
  virtualColumns: "仅渲染可见范围的中间列，固定列始终渲染，默认 false",
  columnOverscan: "列虚拟化时两侧缓冲列数，默认 1",
  fixedRows: "固定在表头下方的展示行；不参与排序、选择和滚动索引",
  striped: "显示交替行背景",
  bordered: "显示列分隔线",
  loading: "显示加载状态，停用行选择、排序和键盘操作",
  loadingMode: "replace（默认）隐藏数据行；overlay 保留数据并显示遮罩",
  loadingText: "默认加载提示，loading 插槽优先，兼容旧 empty 插槽",
  emptyText: "空表体提示文字，默认 暂无数据",
  disabled: "停用表格交互",
  sortState: "受控排序规则，null 清空；未绑定时使用内部状态",
  defaultSort: "非受控初始排序；列 sortable=custom 时由宿主排序",
  selectable: "启用选择列；函数按原始记录和当前行下标判断可选性",
  selectedRowKeys: "受控选中键数组；更新事件后由宿主接受或拒绝",
  defaultSelectedRowKeys: "非受控初始选中键",
  selectionType: "checkbox（默认）或 radio 单选",
  selectionWidth: "选择列宽度，默认 44px；始终固定在左侧",
  reserveSelection: "保留暂时不在数据中的选中键",
  selectOnClick: "点击行切换选中，Shift 点击扩选连续范围，单选模式除外",
  currentRowKey: "受控当前行键；null 表示没有当前行",
  defaultCurrentRowKey: "非受控初始当前行键",
  highlightCurrentRow: "显示当前行高亮，点击该行再次取消",
  keyboard: "启用网格导航和焦点定位，默认 false，保留原 table 语义",
  endReachedThreshold: "距底部多少像素时触发 endReached，默认 42px",
  ariaLabel: "辅助技术名称，默认 虚拟表格",
  rowClassName: "为当前渲染行设置类名或回调",
  rowStyle: "为当前渲染行设置样式或回调",
  cellClassName: "为当前渲染单元格设置类名或回调",
  cellStyle: "为当前渲染单元格设置样式或回调",
  customRow: "附加行属性和事件；固定几何与语义属性由组件管理",
  customCell: "通过原始行、列和值附加单元格属性和事件",
  customHeaderCell: "为表头单元格附加属性和事件，接收列定义和列索引",
};
const events = {
  "update:sortState": "请求更新排序规则",
  "update:selectedRowKeys": "请求更新选中键",
  "update:currentRowKey": "请求更新当前行键",
  sortChange: "排序更新被接受后触发；远程列可据此请求数据",
  selectionChange: "选择被接受后触发，包含键及仍在当前数据中的原始行",
  currentChange: "当前行更新被接受后触发",
  rowClick: "点击数据行返回原始记录、当前排序后的索引和鼠标事件",
  rowDblclick: "双击数据行返回原始记录、索引和鼠标事件",
  cellClick: "点击单元格返回值、原始记录、列及索引",
  scroll: "滚动位置及方向，原生滚动通知按帧合并",
  rangeChange: "已渲染和可见行范围、渲染列键；下标从 0 开始，结束含末项",
  endReached: "接近底部时通知，提供剩余距离与总行数；用于追加数据",
};
const slots = {
  header: "自定义表头，接收 column 与 columnIndex",
  cell: "通用单元格，接收 row、column、value、rowIndex 与 columnIndex",
  empty: "空数据内容；为兼容旧用法也作为未定义 loading 插槽时的备用内容",
  loading: "自定义加载状态内容",
  footer: "表格下方操作区，接收原始 rows、range 和 selectedRowKeys",
};
const methods = {
  element: "根元素",
  viewport: "可滚动视口",
  scrollTop: "当前纵向像素位置",
  scrollLeft: "当前横向像素位置",
  range: "当前可见和渲染范围",
  selectedRowKeys: "实际选中键",
  sortState: "实际排序规则",
  scrollTo: "按像素滚动任一方向，可指定原生 smooth",
  scrollToRow: "定位排序后的行索引，支持对齐方式",
  scrollToKey: "按唯一行键定位，返回是否找到",
  scrollToColumn: "按列键横向定位；固定列无需滚动",
  focusCell: "在键盘模式下定位并聚焦单元格，返回是否成功",
  setSort: "请求更新排序；返回宿主是否接受",
  clearSelection: "清空选择",
  toggleRowSelection: "按行键设置或切换选择",
  selectAll: "选择或取消全部可选记录，单选模式不可用",
  setCurrentRow: "按键设置当前行，传 null 清除",
  getRow: "获取当前排序后的原始记录",
  remeasure: "主动重测视口尺寸；通常由 ResizeObserver 自动处理",
};
export function applyVirtualTableApi(name, api, root) {
  if (name !== "HysVirtualTable") return;
  for (const prop of api.props)
    prop.description = properties[prop.name] || prop.description;
  for (const event of api.events)
    event.description = events[event.name] || event.description;
  for (const slot of api.slots)
    slot.description = slots[slot.name] || slot.description;
  api.slots.push({
    name: "[column.key]",
    type: "HysVirtualTableCell<T>",
    required: false,
    default: "",
    description:
      "按列键提供内容，优先于 cell 插槽和列 formatter，保留 row 与 value。",
  });
  const filename = path.join(
    root,
    "packages/ui/src/composables/virtualTable.ts",
  );
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const instance = source.statements.find(
    (s) =>
      ts.isInterfaceDeclaration(s) && s.name.text === "HysVirtualTableInstance",
  );
  api.exposed = instance.members.map((member) => {
    const name = member.name.getText(source);
    return {
      name,
      type: ts.isMethodSignature(member)
        ? "(" +
          member.parameters.map((p) => p.getText(source)).join(", ") +
          ") => " +
          member.type.getText(source)
        : member.type.getText(source),
      default: "",
      required: false,
      description: methods[name],
    };
  });
}
