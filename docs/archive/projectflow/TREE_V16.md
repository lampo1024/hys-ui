> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow V16 树形组件使用指南

## HysTree

位置：`src/components/HysTree/HysTree.vue`。支持任意层级、节点搜索（包含匹配节点的祖先路径）、受控/非受控展开、单选、级联勾选、禁用节点、空状态和键盘导航。

```vue
<script setup lang="ts">
import {ref} from 'vue'
import HysTree from '@/components/HysTree/HysTree.vue'
const selected=ref('api')
const checked=ref<string[]>([])
const expanded=ref<string[]>(['root'])
const nodes=[{id:'root',label:'研发中心',children:[{id:'api',label:'API 服务'},{id:'qa',label:'测试团队',disabled:true}]}]
</script>
<template>
  <HysTree v-model="selected" v-model:checked-keys="checked" v-model:expanded-keys="expanded" :nodes="nodes" checkable searchable />
</template>
```

### Props

| 属性 | 类型 | 说明 |
|---|---|---|
| nodes | TreeNode[] | 树数据；节点有 id、label、children、disabled、selectable、checkable、icon |
| modelValue | string | 当前单选节点 ID |
| checkedKeys | string[] | 已勾选节点 ID；由调用方负责同步 |
| expandedKeys | string[] | 可选受控展开 ID；不传则组件内部管理 |
| checkable | boolean | 显示复选框，勾选父节点级联后代 |
| searchable | boolean | 默认开启搜索 |
| disabled | boolean | 整体禁用 |
| defaultExpandAll | boolean | 非受控模式下默认展开 |
| showLine | boolean | 显示辅助层级线 |

### Events

`update:modelValue`、`update:checkedKeys`、`update:expandedKeys`、`select(node)`、`check(keys)`。

### 键盘

上下方向键切换焦点；左右方向键展开/折叠或转向父子节点；Home/End 跳到首尾；Enter 选择；空格切换勾选（checkable 模式）。

## HysOrgTree

`src/components/HysOrgTree/HysOrgTree.vue` 已改为基于 HysTree 构建，输入仍为扁平数组 `{id,name,parentId,disabled?}[]`，支持任意深度，避免原先仅支持三级的问题；提供 `v-model`、`v-model:checked-keys`、`checkable`、`searchable`。

## 边界与限制

- ID 必须全树唯一；重复 ID 将忽略后续重复节点。
- 输入是树形对象时应避免对象循环引用；扁平组织结构可检测父链循环并避免挂载循环。
- 搜索只展示匹配项和祖先路径；搜索时视觉上展开路径，不修改原有展开状态。
- 级联勾选为受控模式：调用方需要同步 `checkedKeys`；禁用节点不会被级联选中。
- 大规模树（数万可见节点）尚未集成虚拟滚动；建议远程加载或分段呈现。
- 目前不支持异步子节点加载、拖拽重排、树节点上下文菜单及半选状态的独立提交。
- 需要在浏览器中进行 ARIA 读屏、触屏及主题回归验证。
