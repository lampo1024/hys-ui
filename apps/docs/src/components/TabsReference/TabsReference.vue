<template>
  <section class="notes" aria-labelledby="tabs-model-reference">
    <h2 id="tabs-model-reference">数据模式与工作台</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">场景</th>
            <th scope="col">行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>只读或受控列表</td>
            <td>
              传 <code>items</code> 展示业务列表。增删通过
              <code>add</code>、<code>close</code> 事件交给调用方。通过
              <code>v-model:items</code> 接收内置管理操作生成的新数组。
            </td>
          </tr>
          <tr>
            <td>内置工作台</td>
            <td>
              使用 <code>workbench</code> 与
              <code>defaultItems</code> 管理本地页签，或通过
              <code>v-model:items</code>
              管理应用状态。右键菜单提供刷新、重命名、固定、收藏、批量关闭和恢复。
            </td>
          </tr>
          <tr>
            <td>声明式面板</td>
            <td>
              在默认插槽或 <code>panes</code> 插槽使用
              <code>HysTabPane</code>，可混合 <code>v-for</code> 和
              <code>v-if</code>。条目顺序由声明顺序决定，固定标签排在前面。
            </td>
          </tr>
          <tr>
            <td>异步与缓存</td>
            <td>
              <code>load({ item, signal })</code> 返回内容。<code>preload</code>
              提前准备内容，<code>reload</code> 中止旧请求并重建面板。<code
                >destroyOnHide</code
              >
              控制 DOM，单项 <code>cache=false</code> 还会释放已加载数据。
            </td>
          </tr>
          <tr>
            <td>持久化与恢复</td>
            <td>
              <code>storageKey</code>
              保存活动标签、顺序、名称、固定、收藏和历史。可选保存滚动位置。快照只记录元数据，用
              <code>restoreItem</code> 还原异步加载器与业务组件。
            </td>
          </tr>
          <tr>
            <td>路由联动</td>
            <td>
              <code
                >useHysRouteTabs({ route, resolve, navigate, allow, fallback
                })</code
              >
              将路由映射到标签。<code>value</code>
              使用完整路径时，同一路由的不同参数各占一个标签。将
              <code>select</code> 和
              <code>beforeClose</code>
              接到守卫，在路由接受导航后再更新显示或关闭。
            </td>
          </tr>
          <tr>
            <td>主题与键盘</td>
            <td>
              <code>provideHysTabs({ defaults })</code>
              设置子树默认值，实例显式值优先。方向键与 Home/End
              在标签间移动。Delete 关闭当前焦点标签，Shift + F10
              打开其菜单，启用拖拽后 Alt + Shift + 方向键可移动标签。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      标签项字段见
      <router-link to="/components/hys-tab-pane#api">TabPane API</router-link
      >。主题可覆盖 <code>--hys-tab-selection-bg</code>、<code
        >--hys-tab-selection-shadow</code
      >
      和 <code>--hys-tab-nav-max-height</code>。
    </p>
  </section>
</template>
