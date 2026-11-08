<script setup lang="ts">
const rows = [
  [
    "type",
    "HysFormRuleType",
    "string、number、integer、float、boolean、array、object、date、email、url、hex、regexp、method、pattern、enum 或 any。建议显式声明；未声明时会按字段值推断，以兼容原有用法。",
  ],
  [
    "required / whitespace",
    "boolean",
    "检查空值；whitespace 额外拒绝仅包含空白字符的文本。",
  ],
  [
    "min / max / len",
    "number",
    "文本与数组检查长度；数值检查大小。len 为精确约束。",
  ],
  ["enum", "数组", "允许的值，可显式包含 0、false、null 等边界值。"],
  ["pattern", "RegExp | string", "正则匹配。"],
  [
    "transform",
    "(value) => unknown",
    "转换用于校验的值；不会直接修改宿主 model。",
  ],
  [
    "fields / defaultField",
    "HysFormRules / HysFormRule",
    "嵌套对象规则，或应用于数组、对象各成员的规则。",
  ],
  [
    "trigger",
    "blur | change | 数组",
    "自动检查时筛选规则；手动调用 validate 会检查全部规则。",
  ],
  ["level", "error | warning", "warning 仅展示建议，不阻止提交；默认 error。"],
  ["message", "string | (path?) => string", "自定义错误或建议文字。"],
  [
    "validator",
    "(value, model, { path, signal }) => result",
    "返回 true、void 表示通过；false、字符串、Error 或拒绝的 Promise 表示失败。model 是本次检查的数据快照；signal 可用于取消请求。",
  ],
  [
    "asyncValidator",
    "(value, callback, model, context) => void | Promise<void>",
    "调用 callback() 通过，传字符串或 Error 失败；也可返回 Promise。取消时忽略旧结果，signal 可用于取消请求。",
  ],
];
const types = [
  [
    "HysFormPath",
    "string | readonly (string | number)[]",
    '字段路径。操作单个数组路径用 ["profile", "email"]；操作路径列表用 [["profile", "email"]]。',
  ],
  [
    "HysFormPaths",
    "string | readonly HysFormPath[]",
    "批量操作的路径列表；父级路径会包含已知子字段。",
  ],
  [
    "HysFormRule / HysFormRules",
    "规则 / 路径到规则的映射",
    "支持嵌套对象 fields 和成员规则 defaultField，注册的叶子字段可直接使用父级规则。",
  ],
  [
    "HysFormGridValue",
    "number | Partial<Record<Breakpoint, number>>",
    "列数或跨列数量。断点以表单容器宽度计算。",
  ],
  [
    "HysFormCol",
    "{ span?, offset?, xs?, sm?, md?, lg?, xl?, xxl? }",
    "标签和控件的 24 栅格配置。断点值可为数值或 { span, offset }。",
  ],
  [
    "HysFormFieldData",
    "{ name, value?, errors?, warnings? }",
    "setFields 的数据项。错误与警告均为字符串数组。",
  ],
  [
    "HysFormValidateCallback",
    "(valid, result) => void | Promise<void>",
    "完成回调，取消检查时不执行；result 包含数据快照、首条消息与全部消息。",
  ],
  [
    "HysFormValidationResult",
    "{ valid, cancelled, values, errors, warnings, errorMessages, warningMessages }",
    "区分通过、失败与取消。errors / warnings 保留首条消息，errorMessages / warningMessages 保留消息数组。",
  ],
];
</script>
<template>
  <section class="notes">
    <h2>校验规则</h2>
    <p>
      <code>HysFormRules</code> 使用字段路径作为键，每项可为一个
      <code>HysFormRule</code> 或规则数组。字段的 <code>prop</code> 支持
      <code>profile.email</code>、<code>contacts[0].email</code>
      或路径数组。跨字段校验应同时在表单项上声明 <code>dependencies</code>。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>规则字段</th>
            <th>类型</th>
            <th>说明</th>
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
      表单规则和字段规则会合并，错误规则优先，警告在错误通过后检查。更晚的校验结果优先；重置、清除、禁用或页面离开会取消旧检查。<code
        >validateResult()</code
      >
      可区分校验失败和已取消；自定义请求应使用传入的
      <code>signal</code> 释放资源。
    </p>
    <h2>公开类型</h2>
    <p>
      下列类型均可从 <code>hys-ui</code> 导入，无需引用内部文件。<code
        >InstanceType&lt;typeof HysForm&gt;</code
      >
      和
      <code>InstanceType&lt;typeof HysFormItem&gt;</code> 可用于组件实例引用。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>类型</th>
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
    <h2>键盘与关联</h2>
    <p>
      Tab / Shift+Tab 在可用控件间移动；Enter
      提交表单。选择器、日期等浮层使用各自的键盘操作，关闭后恢复焦点。单个控件自动关联标签，组合字段通过
      group 和各控件的 aria-label 提供名称；不要对同一字段手动复用 ID。
    </p>
    <p>
      <a
        href="https://github.com/lampo1024/hys-ui/tree/main/packages/ui/src/components/HysForm"
        target="_blank"
        rel="noopener noreferrer"
        >查看组件源码</a
      >
      ·
      <a
        href="https://github.com/lampo1024/hys-ui/graphs/contributors"
        target="_blank"
        rel="noopener noreferrer"
        >贡献者</a
      >
    </p>
  </section>
</template>
