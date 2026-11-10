<template>
  <section class="notes">
    <h2>视口、固定区域与性能</h2>
    <p>
      <code>height</code> 是表体高度，表头和
      <code>fixedRows</code> 另计。行高统一由 <code>rowHeight</code> 控制。设置
      <code>fixed: 'left' | 'right'</code>
      固定列，确保两侧列宽之和给中间列留出空间。<code>fit</code>
      可以填充剩余宽度。
    </p>
    <p>
      行虚拟化默认启用；列很多时添加 <code>virtual-columns</code>，用
      <code>overscan</code> 和
      <code>columnOverscan</code>
      调整缓冲。组件自动观察容器尺寸，按帧同步滚动。<code>rangeChange</code>
      的索引从 0 开始，结束索引包含末项，空列表的结束索引为 -1。
    </p>
  </section>
  <section class="notes">
    <h2>数据、排序与选择</h2>
    <p>
      提供唯一、稳定的
      <code>rowKey</code
      >。列支持字段路径、<code>valueGetter</code>、<code>formatter</code>、通用
      <code>cell</code>
      与列名插槽。回调和插槽得到原始记录；显示下标按当前排序结果计算。
    </p>
    <p>
      <code>sortable: true</code> 在组件内排序，<code>sortable: 'custom'</code>
      由宿主获取数据。排序、选中键和当前行支持受控更新；宿主拒绝时不会触发对应的接受事件。全选覆盖所有可选数据，<code
        >reserveSelection</code
      >
      可保留暂时缺席的键。
    </p>
  </section>
  <section class="notes">
    <h2>定位、追加与键盘操作</h2>
    <p>
      <code>scrollTo</code> 接收像素位置；<code>scrollToRow</code>、<code
        >scrollToKey</code
      >
      和 <code>scrollToColumn</code> 定位当前数据。收到
      <code>endReached</code>
      后可以追加记录，组件保持当前位置。宿主负责加载、重试与是否还有更多数据。
    </p>
    <p>
      开启 <code>keyboard</code> 后可用方向键、Page Up / Page Down、Home / End
      和 Ctrl + Home / End 导航。空格选择，Shift + 空格扩大范围；Esc
      取消当前单元格及当前行。<code>focusCell</code>
      可以直接聚焦未渲染的单元格。
    </p>
  </section>
</template>
