<template>
  <section class="notes">
    <h2>数据与查询方式</h2>
    <p>
      <code>options</code> 接收字符串、对象或带
      <code>options / children</code> 的分组。<code>valueKey</code>、<code
        >labelKey</code
      >
      默认分别为 <code>value</code>、<code>label</code>。模型始终是字符串；<code
        >select(item, value)</code
      >
      同时提供原始项目和最终文本。
    </p>
    <p>
      <code>fetchSuggestions(query, callback, {signal})</code>
      支持回调、直接返回数组或返回
      Promise。同次请求只接受第一个结果；下一次查询、关闭、禁用、重置或页面离开会取消旧请求。请用
      <code>signal</code> 取消实际网络工作，组件也会忽略不能取消的过期结果。
    </p>
    <p>
      本地模式默认忽略大小写过滤标签和值。远程模式默认直接显示返回结果，可显式配置
      <code>filterOption</code
      >。切换提供函数本身不会重复发起当前查询，外部条件变化后可调用实例的
      <code>getData()</code> 立即刷新。
    </p>
  </section>
  <section class="notes">
    <h2>输入、受控状态与插槽</h2>
    <p>
      <code>v-model</code> 控制已提交的文本；未提供时使用
      <code>defaultValue</code>。<code>v-model:open</code> 控制建议列表。<code
        >input / change</code
      >
      表示文本变化，<code>search</code>
      只在用户接受的查询输入后触发；外部赋值不会重复触发这些事件。选择后触发
      <code>select</code>，自由输入默认不会自动变成选择。
    </p>
    <p>
      <code>input</code> 插槽用于自定义输入框，接收
      <code>value / setValue / inputProps / loading / clear</code
      >。将提供的属性和更新函数接入输入组件。默认插槽（或
      <code>option</code>）自定义建议；<code
        >header / footer / loading / empty / error / group</code
      >
      定义浮层各区域。自定义输入仍需保留原生 input 或 textarea 作为焦点目标。
    </p>
  </section>
  <section class="notes">
    <h2>键盘与可访问性</h2>
    <ul>
      <li>
        方向键打开列表、移动高亮并跳过禁用项；Home / End 定位首尾，PageUp /
        PageDown 移动一页。
      </li>
      <li>
        Enter 确认高亮项；没有高亮时保留自由输入。selectWhenUnmatched 允许 Enter
        将输入作为自定义选择。
      </li>
      <li>
        Tab 默认离开输入，selectOnTab 可先确认高亮项；Escape 撤销 backfill
        预览并关闭。
      </li>
      <li>
        中文输入法组合期间不搜索、不确认，组合结束后统一处理。自定义多行输入使用
        Shift + Enter 换行。
      </li>
      <li>
        输入具有 combobox、aria-expanded、aria-controls 和
        aria-activedescendant；表单标签、禁用与尺寸会自动继承。插槽内的交互内容需提供可访问名称。
      </li>
    </ul>
  </section>
</template>
