<template>
  <section class="notes" aria-labelledby="description-item-reference">
    <h2 id="description-item-reference">字段配置</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">字段</th>
            <th scope="col">类型</th>
            <th scope="col">默认行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>key</code> / <code>label</code></td>
            <td><code>string | number</code> / <code>string</code></td>
            <td>
              两者必填。键在列表内唯一，也用于 <code>#label-字段键</code> 和
              <code>#value-字段键</code>。
            </td>
          </tr>
          <tr>
            <td><code>value</code> / <code>format</code></td>
            <td>
              <code>HysDescriptionValue</code> /
              <code>(value, item) =&gt; HysDescriptionValue</code>
            </td>
            <td>
              可使用字符串、数字、布尔、bigint、null 或
              undefined。格式化返回空值时使用占位文字。
            </td>
          </tr>
          <tr>
            <td><code>span</code> / <code>rowSpan</code></td>
            <td><code>number | 'full'</code> / <code>number</code></td>
            <td>
              均默认 1。跨列不超过当前列数，<code>full</code>
              占满一行。跨行不超过可见字段数，单列时归为 1。
            </td>
          </tr>
          <tr>
            <td><code>hidden</code></td>
            <td><code>boolean</code></td>
            <td>
              默认 false。隐藏项不占格，也不计入插槽的 <code>index</code>。
            </td>
          </tr>
          <tr>
            <td>
              <code>labelWidth</code> / <code>labelAlign</code> /
              <code>align</code>
            </td>
            <td>
              <code>number | string</code> / <code>HysDescriptionAlign</code>
            </td>
            <td>
              继承列表的标签宽度、标签对齐和值对齐。单字段的宽度和对齐优先。
            </td>
          </tr>
          <tr>
            <td><code>labelClass</code> / <code>contentClass</code></td>
            <td><code>string</code></td>
            <td>为字段的标签或值增加 CSS 类名。</td>
          </tr>
          <tr>
            <td><code>labelStyle</code> / <code>contentStyle</code></td>
            <td><code>CSSProperties</code></td>
            <td>合并到标签或值的内联样式，同名属性优先于列表级设置。</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      响应式列数按组件容器宽度计算。<code>xs</code> 从 0 px 生效，<code
        >sm</code
      >
      从 576 px，<code>md</code> 从 768 px，<code>lg</code> 从 992 px，<code
        >xl</code
      >
      从 1200 px，<code>xxl</code> 从 1600 px
      生效。未配置的断点沿用最近的较小配置。
    </p>
  </section>
</template>
