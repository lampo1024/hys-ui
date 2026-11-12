<template>
  <section class="notes sortable-reference" aria-labelledby="sortable-usage">
    <h2 id="sortable-usage">操作与数据约定</h2>
    <dl>
      <div>
        <dt>项目键</dt>
        <dd>
          <code>itemKey</code> 默认读取
          <code>id</code
          >，接受字符串或数字。每个列表内的键必须唯一且稳定。跨列表移动时，目标列表也不能有同键项目。<code
            >itemLabel</code
          >
          默认读取 <code>label</code>，同时用于键盘操作提示。
        </dd>
      </div>
      <div>
        <dt>键盘和多选</dt>
        <dd>
          焦点在项目或手柄上时，按空格或 Enter 拾起，方向键选择位置，Home / End
          跳到首尾，再按空格或 Enter 放置。Escape 取消。Ctrl
          加方向键切换可达列表。Alt
          加方向键可直接排序。勾选复选框后，从任一已选项开始可移动整组。Shift
          可扩展连续选择。
        </dd>
      </div>
      <div>
        <dt>索引和固定项</dt>
        <dd>
          插入使用目标原始模型的边界，<code>0</code> 是开头，<code>length</code>
          是末尾。交换使用目标项目索引。批量交换要求目标是一段等长且与所选项不重叠的区间。置顶和置底项须在数据中预先排到对应端，绝对固定项在排序后保留原索引。
        </dd>
      </div>
      <div>
        <dt>跨列表</dt>
        <dd>
          列表通过唯一的 <code>listId</code> 定位。同名
          <code>group</code> 默认允许互移，<code>put</code> 可限制来源。<code
            >copy</code
          >
          浅拷贝，<code>clone</code>
          深拷贝可结构化克隆的对象。组件会生成新键。使用函数键、特殊数据类型或业务编号时，通过
          <code>clone</code> 返回所需副本和新键。
        </dd>
      </div>
      <div>
        <dt>预览、确认和保存</dt>
        <dd>
          <code>preview</code>
          返回预测的各列表顺序，模型在放置时才更新。跨列表移动会同步提交各模型，使用源列表的
          <code>save</code>，未配置时使用目标列表的
          <code>save</code
          >。一次回调收到全部变化，适合由服务端事务保存。宿主应立即接受受控更新，并在取消时中止请求。外部数据冲突时保留宿主的新状态。
        </dd>
      </div>
      <div>
        <dt>历史与持久化</dt>
        <dd>
          <code>undo</code> 和
          <code>redo</code> 会校验当前模型是否与记录吻合。<code>reset</code>
          按挂载时的键顺序重新排列仍存在的项目。<code>storageKey</code>
          只存浏览器内的键顺序，跨列表归属可通过 <code>save</code> 持久化。
        </dd>
      </div>
      <div>
        <dt>布局与尺寸</dt>
        <dd>
          虚拟模式先按
          <code>estimateSize</code>
          计算，渲染后再测量实际尺寸。横向模式以宽度为估算值，其他布局以高度为估算值。虚拟网格通过
          <code>columns</code> 配置列数或响应式函数。表格行通过
          <code>header</code> 和 <code>cells</code> 插槽提供原生单元格。
        </dd>
      </div>
      <div>
        <dt>样式与减少动效</dt>
        <dd>
          可用
          <code>--hys-sort-gap</code>、<code>--hys-sort-radius</code>、<code
            >--hys-sort-grid-min</code
          >
          和
          <code>--hys-sort-picked-opacity</code>
          覆盖列表样式。浮动预览的样式可通过
          <code>ghostStyle</code>
          设置。<code>motion=false</code>、全局关闭动效和系统减少动效会关闭移动与回弹动画。
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.sortable-reference dl {
  display: grid;
  gap: 12px 20px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
}
.sortable-reference dl > div {
  padding: 12px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-surface);
}
.sortable-reference dt {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 650;
}
.sortable-reference dd {
  margin: 0;
  color: var(--docs-muted);
  font-size: 12px;
  line-height: 1.65;
}
</style>
