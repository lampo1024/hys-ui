> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V6 — 稳定性整改报告

## 本轮已修改
- 新增全局 Overlay Stack，Escape 只由栈顶浮层响应，避免多个浮层同时关闭。
- 重写 useFloating：视口边界翻转与夹取、视觉视口变化监听、滚动重定位、卸载和异步竞态清理、焦点恢复。
- 重写 useDialog：嵌套弹窗滚动锁引用计数、Tab 焦点循环、焦点越界恢复、卸载清理和打开关闭竞态保护。
- Command Palette 接入 useDialog，支持统一焦点与滚动锁。
- VirtualTable 增加无效行高保护、数据长度变化重置滚动索引。
- SortableList 新增 Alt+方向键调整顺序的键盘操作。
- 新增不依赖 npm 的静态契约检查 `npm run check:contracts`。

## 尚未达到的生产级标准
- 当前环境无法下载 npm 依赖，无法运行 vue-tsc / Vite 构建，亦未完成浏览器自动化与真机验证。
- 组件库其余业务组件未逐一完成 WAI-ARIA 交互一致性审计；复杂树选择器、动态行高虚拟表格、触屏拖拽等功能仍有已知限制。
- 现有项目依赖 lucide-vue-next 图标组件包（不是 UI 组件库）；如要求零第三方组件依赖，应另行替换图标实现。
- 当前演示使用模拟数据，不具备后端持久化能力。

## 本地验收
```bash
npm run check:contracts
npm install
npm run typecheck
npm run build
npm run dev
```
之后需要用 Playwright / axe-core 等完成真实浏览器测试，重点覆盖视口四角、嵌套弹窗、Tab/Escape、屏幕缩放、移动端和六套主题。

> 本版是经过针对性修复的候选稳定版，不应宣称已通过生产级验收。
