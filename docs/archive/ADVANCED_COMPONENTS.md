> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V4 高级组件扩展

新增 8 个自定义组件：HysTreeSelect、HysCascader、HysTransfer、HysColorPicker、HysDateRangePicker、HysCommandPalette、HysVirtualTable、HysSortableList。每个组件均独立目录，使用 Vue 3 + TypeScript 原生实现，不使用第三方 UI 组件。

## 已考虑的场景
- 禁用节点、搜索空结果、级联叶子节点提交
- 穿梭框禁用项目、重复选择去重
- 颜色 HEX 校验、日期范围顺序校验
- 命令面板 Esc / Ctrl+K / Cmd+K、上下键与 Enter
- 万级数据仅渲染可视行，稳定 ID key
- 拖拽之外提供按钮排序，移动端和键盘也能操作
- 主题 CSS 变量和小屏响应式布局

## 尚需生产级强化
1. TreeSelect / Cascader 的浮层应迁移至统一 Overlay 系统（Teleport + auto placement），当前仍可能被 overflow 容器裁切。
2. Command Palette 需要完整焦点陷阱、嵌套弹窗优先级和背景滚动锁。
3. VirtualTable 当前仅支持固定行高；动态行高、列固定、复杂表头需要额外实现。
4. DateRangePicker 使用浏览器原生日期控件，跨浏览器样式与日历浮层不可完全统一。
5. 拖拽排序需要进一步提供键盘抓取/放下模式与触摸拖动支持。
6. 建议补充 Vitest + Playwright + axe-core 回归测试，特别是多主题和触屏。

## 运行
`npm install` → `npm run dev`，打开“高级组件实验室”。
