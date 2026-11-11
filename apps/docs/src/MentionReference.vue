<template>
  <section class="mention-reference">
    <h2>提及规则与实体</h2>
    <p>
      <code>prefix</code> 适合共享规则的触发词。<code>triggers</code>
      可按触发词设置边界、最小查询长度、空格、
      自定义匹配、数据源、搜索策略、写入格式和分隔符。<code>open()</code>
      可在没有触发词的位置打开候选，
      <code>recommendOnFocus</code> 会在聚焦时提供推荐和最近记录。
    </p>
    <p>
      <code>v-model</code> 始终接收纯文本。<code>v-model:entities</code>
      提供包含 ID、类型、显示名、业务数据和
      起止位置的实体集合。位置使用与原生选区一致的 UTF-16 索引。<code
        >type="rich"</code
      >
      将实体渲染为独立节点， 双击节点可打开替换候选。纯文本模式可用
      <code>highlightMentions</code> 高亮同一实体集合。
    </p>
    <p>
      <code>insertMention()</code
      >、<code>removeMention()</code>、<code>getDocument()</code>、
      <code>serialize()</code> 和
      <code>setDocument()</code> 支持程序化操作与回显。
      <code>canSelect</code>、<code>beforeRemove</code> 和
      <code>validateEntity</code> 接入业务权限，
      <code>invalidEntity</code> 决定失效实体标记、降为纯文本或删除。
    </p>
    <h3>搜索与候选</h3>
    <p>
      <code>sources</code> 可组合多组本地与远程数据。加载器收到
      <code>query</code>、<code>prefix</code>、
      <code>page</code>、<code>pageSize</code>、<code>cursor</code> 和
      <code>signal</code>。 返回数组表示一页结束，返回分页对象可继续滚动、按
      Page Down 或调用 <code>loadMore()</code>。
      <code>cache</code> 配置有效期和容量，<code>historyKey</code>
      选择浏览器持久化键。
    </p>
    <p>
      <code>searchMode</code> 支持包含、模糊、全拼和首字母。<code
        >searchFields</code
      >
      扩展搜索字段， <code>sortOptions</code> 与
      <code>groupBy</code> 控制排序与分组。启用 <code>virtual</code> 后，
      自定义选项和分组应使用与 <code>itemHeight</code> 一致的高度。
    </p>
    <h3>键盘、表单与外观</h3>
    <p>
      方向键循环选择并跳过禁用项，Enter 选择，Escape 关闭。<code
        >selectOnTab</code
      >
      允许 Tab 选中并继续移动焦点。 <code>shortcuts</code> 支持如
      <code>Ctrl+End</code> 的组合键。Ctrl/Cmd+Z 与重做快捷键应用到文本和实体。
    </p>
    <p>
      单行和多行模式使用原生表单控件。富文本模式用隐藏字段提交纯文本，可通过
      FormItem 规则校验。
      <code>locale</code> 覆盖候选、状态和辅助技术文案，<code
        >--hys-ui-mention-*</code
      >
      变量可定制颜色、圆角、阴影和间距。
    </p>
  </section>
</template>

<style scoped>
.mention-reference {
  margin: 24px 0;
}
.mention-reference p {
  margin: 10px 0;
  line-height: 1.75;
}
.mention-reference code {
  overflow-wrap: anywhere;
}
</style>
