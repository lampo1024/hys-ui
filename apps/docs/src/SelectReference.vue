<script setup lang="ts">
const rows = [
  [
    "HysSelectValue",
    "string | number | boolean | Record<string, unknown>",
    "单个选项的值。对象值建议配置稳定的 valueKey。",
  ],
  [
    "HysSelectModelValue",
    "HysSelectValue | HysSelectValue[] | null",
    "单选、多选和未选择状态。原有文本单选用法保持可用。",
  ],
  [
    "HysSelectOption",
    "{ label, value, disabled?, ... }",
    "标准选项，保留额外业务字段供自定义插槽使用。",
  ],
  [
    "HysSelectGroup",
    "{ label, options, disabled?, ... }",
    "分组选项，支持禁用整组。",
  ],
  [
    "HysSelectFieldNames",
    "{ label?, value?, options?, disabled? }",
    "将标准字段映射为接口中的字段名。",
  ],
  [
    "HysSelectSearchContext",
    "{ signal: AbortSignal }",
    "remoteMethod 用于取消请求的上下文。",
  ],
  [
    "HysSelectInstance",
    "focus / blur / open / close / scrollTo / retry",
    "实例引用可使用 ref<HysSelectInstance>()，也可读取 selected、query、isOpen。",
  ],
];
</script>
<template>
  <section class="notes"><h2>多选项与浮层高度</h2><p>列表默认最高 240px，可通过 listHeight 调整（有效范围 80–800px）；同时限制在视口高度的 45% 内。整个浮层最高占视口的 60%，搜索、头部和底部保持固定，选项在列表内滚动。短列表按实际内容收缩，不预留空白。方向键和实例 scrollTo 可定位后面的选项，大数据默认启用虚拟渲染。</p></section>
  <section class="notes">
    <h2>值类型与实例</h2>
    <p>
      下列类型均可从 <code>hys-ui</code> 导入。默认将空字符串、null 与 undefined
      视为未选；若需要空字符串选项，配置
      <code>:empty-values="[null, undefined]"</code>。数值 0、布尔 false
      与同名文本分别匹配。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>公开类型</th>
            <th>结构</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row[0]">
            <td>
              <code>{{ row[0] }}</code>
            </td>
            <td>
              <code>{{ row[1] }}</code>
            </td>
            <td>{{ row[2] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      模板中可从 v-model 推导值类型。使用渲染函数并需要精确回调类型时，可写
      <code>h(HysSelect&lt;string&gt;, ...)</code> 或
      <code>h(HysSelect&lt;number | null&gt;, ...)</code>
      显式指定类型；未指定的渲染函数应按 HysSelectModelValue 处理回调参数。
    </p>
    <h2>键盘与搜索</h2>
    <p>
      方向键移动可用选项；Home / End 定位首末项，PageUp / PageDown
      按页移动；Enter 确认，Escape 关闭并恢复焦点，Tab
      继续移动。没有搜索框时可输入首字母定位；多选搜索框为空时，Backspace
      移除最后一个可移除标签。
    </p>
    <p>
      <code>search</code>
      在搜索词提交后立即触发，中文输入法组合完成后触发。<code
        >remoteMethod</code
      >
      额外应用 debounce 并提供
      signal；新查询、关闭、禁用及页面离开会取消旧请求。也可继续使用
      <code>remote + @search</code> 自行管理外部结果和加载状态。
    </p>
    <p>
      虚拟列表使用固定行高。包含头像或多行内容的自定义选项应设置合适的
      itemHeight，或关闭 virtual。列表按 valueKey
      识别对象值，不会根据标签文字合并两个不同值。
    </p>
  </section>
</template>
