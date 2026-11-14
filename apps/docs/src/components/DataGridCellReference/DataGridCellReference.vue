<template>
  <section class="notes">
    <h2>单元格列配置</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>GridColumn 参数</th>
            <th>行为与默认值</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>editable</code></td>
            <td>
              <code
                >boolean | ((context: HysDataGridCellContext) =&gt;
                boolean)</code
              >。 默认 false，组件需同时开启
              editable。回调接收原值、列、行及其位置和状态。
              批量编辑中，行不在当前可见数据时 pageIndex 为 -1，隐藏列的
              columnIndex 为 -1。 尚未加载的已选行只适用布尔配置。
            </td>
          </tr>
          <tr>
            <td><code>formatter</code></td>
            <td>
              <code
                >(context: HysDataGridCellContext) =&gt; string | number | null
                | undefined</code
              >。 默认使用原值文本。返回 undefined 回退到原值，null 显示为空。
              列专属插槽与 body-cell 插槽优先，查询、排序和编辑使用原值。
            </td>
          </tr>
          <tr>
            <td><code>wrap</code></td>
            <td>
              <code>boolean | number</code>，默认单行显示。true
              保留换行并完整显示文本。 大于等于 1
              的有限数值向下取整，用作最大显示行数。
            </td>
          </tr>
          <tr>
            <td><code>emptyText</code></td>
            <td>
              <code>string</code>，默认继承 emptyCellText。原值为
              null、undefined 或空字符串时替代默认正文与 formatter，插槽仍优先。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
