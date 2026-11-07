> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# V5 交互质量清单

## 本次实装
- TreeSelect 和 Cascader：Teleport 至 body，使用 useFloating 自动翻转和视口边界约束；滚动与 resize 重定位；点击外部和 Escape 关闭；禁用节点；TreeSelect 键盘上下选择和 Enter 确认。
- Cascader：外部 modelValue 更新同步内部路径；左右方向键切换列。
- 新增 useRovingFocus 复用键盘索引逻辑。

## 人工回归测试（尚未执行）
- 浏览器缩放 80%/125%/200%，右下角触发器，嵌套 overflow:hidden 容器。
- 页面滚动、弹窗内滚动、窗口缩放、移动端虚拟键盘。
- 仅键盘 Tab/Shift+Tab/Escape/Enter/方向键，屏幕阅读器读出选中态。
- 主题切换、空数据、超长标签、禁用节点、异步更新选中值。

## 已知待解决
- 浮层仍未采用全局堆栈管理，多个重叠浮层 Escape 的关闭顺序需要测试。
- TreeSelect 目前是扁平搜索列表，不是完整的可展开 ARIA tree。
- Cascader 未实现完整的 Home/End 与方向键逐项导航。
- VirtualTable 动态行高、固定列和读屏虚拟行策略尚未实现。
- 触屏拖放、弹窗嵌套与端到端测试仍待完善。
