> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# HysTree V17 高级能力说明

## 新增属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `virtual` | `boolean` | `false` | 固定行高虚拟渲染；大量节点建议开启 |
| `rowHeight` | `number` | `38` | 虚拟行高（px）；自定义插槽须保持固定高度 |
| `viewportHeight` | `number` | `340` | 滚动视口高度 |
| `draggable` | `boolean` | `false` | HTML5 拖放节点；不会自行修改数据 |
| `contextMenu` | `boolean` | `false` | 右键菜单 |
| `loadChildren` | `(node:TreeNode)=>Promise<TreeNode[]>` | 无 | 懒加载子节点；节点需标记 `hasChildren:true` |

## 新增事件

- `node-drop({dragId,targetId,position})`：业务方负责移动节点并刷新 `nodes`；禁止拖入自己或后代。
- `node-contextmenu({node,x,y})`：右键事件。
- `children-loaded({node,children})`：异步加载成功。
- `load-error({node,error})`：异步加载失败；点击展开可重试。

## 自定义节点

```vue
<HysTree :nodes="nodes" virtual draggable context-menu :load-children="loadChildren" @node-drop="handleDrop">
  <template #node="{ node, depth, selected }">
    <span>{{ node.label }} · 层级 {{ depth }} · {{ selected ? '已选中' : '' }}</span>
  </template>
</HysTree>
```

## 边界与限制

1. 虚拟滚动使用固定行高，不支持动态行高；节点插槽须保证高度。
2. HTML5 原生拖拽适用于桌面浏览器；触屏设备需额外的 Pointer Events 拖拽实现。
3. 节点拖拽只发出事件，不直接修改树；服务端权限和同级排序由业务层处理。
4. 懒加载数据暂存于组件实例；`nodes` 引用变化会清空缓存。
5. 虚拟模式键盘导航需要对离屏节点补充滚动定位；请在生产环境做无障碍测试。
6. 内置右键菜单是基础操作菜单；复杂操作请监听事件自行渲染菜单。
