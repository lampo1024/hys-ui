<script setup lang="ts">
const types = [
  [
    "HysNumberInputValue",
    "number | string | null",
    "普通数值、字符串精度模式与空值。",
  ],
  [
    "HysNumberInputFormatInfo",
    "{ userTyping, input }",
    "区分输入中的草稿和已提交的显示值。",
  ],
  [
    "HysNumberInputStepInfo",
    "{ offset, type, source }",
    "实际变化量、方向和按钮 / 键盘 / 滚轮等操作来源。",
  ],
  [
    "HysNumberInputInvalidInfo",
    "{ input, reason }",
    "拒绝提交的原始文本，以及解析、校验或范围错误。",
  ],
  [
    "HysNumberInputInstance",
    "input / focus / blur / select / clear / commit / increase / decrease",
    "组件实例引用，可使用 ref<HysNumberInputInstance>()。",
  ],
];
</script>

<template>
  <section class="notes">
    <h2>值类型与精度</h2>
    <p>
      空值使用 <code>null</code>，数值
      <code>0</code> 会正常显示。可清空的普通输入建议使用
      <code>ref&lt;number | null&gt;(null)</code>；字符串精度模式使用
      <code>ref&lt;string | null&gt;('9007199254740993.1')</code> 并开启
      <code>stringMode</code>。
      大数的步长、上下界和初始值也应使用字符串，避免数值在传入组件前已经失去精度。
    </p>
    <p>
      普通模式默认限制在安全整数范围内。<code>precision</code>
      控制提交时舍入和默认展示的小数位数， 至少保留步长所需位数；严格步进按
      <code>stepBase + n × step</code> 对齐，并在可用网格点内限制上下界。
      外部改变范围不会主动改写模型；下一次提交或步进才应用新范围。
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
          <tr v-for="row in types" :key="row[0]">
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
      模板从 <code>v-model</code> 推导值类型；渲染函数可写
      <code>h(HysNumberInput&lt;number | null&gt;, ...)</code> 或
      <code>h(HysNumberInput&lt;string | null&gt;, ...)</code
      >，使回调类型与模型一致。未显式指定的渲染函数应使用
      <code>HysNumberInputValue</code> 处理回调参数。
    </p>
    <h2>输入、提交与键盘</h2>
    <p>
      默认允许先编辑草稿，按 Enter、失焦或触发原生 change 时提交；Escape
      撤销未提交的编辑。
      <code>input</code> 表示草稿解析结果，<code>change</code>
      表示实际接受的新值。 开启
      <code>updateOnInput</code>
      后，合法输入即时更新模型，输入中的负号等未完成文本仍可继续编辑。
    </p>
    <p>
      上下方向键调整一步，Shift + 方向键及 PageUp / PageDown
      调整十步；配置上下界后，Home / End 定位对应边界。<code>keyboard</code>
      可整体关闭，也可分别关闭各个按键。
      滚轮调整默认关闭，开启后仅在输入聚焦时生效。按住步进按钮可连续调整，释放、禁用及页面离开时停止。
    </p>
    <p>
      <code>formatter</code> 只改变显示，<code>parser</code>
      将显示内容还原为原始值。
      <code>validator</code> 用于同步拒绝候选值；异步业务校验应交给
      <code>HysForm</code>。
      <code>name</code>
      提交原始数值，<code>id</code>、<code>autocomplete</code>、
      <code>aria-*</code> 等属性会透传到内部输入框；class 与 style
      应用于组件外层。
    </p>
  </section>
</template>
