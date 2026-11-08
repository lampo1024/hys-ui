<script setup lang="ts">
const rows=[
 ['type','HysFormRuleType','string、number、integer、float、boolean、array、object、date、email、url、hex、regexp、method、pattern、enum 或 any。建议显式声明；未声明时会按字段值推断，以兼容原有用法。'],
 ['required / whitespace','boolean','检查空值；whitespace 额外拒绝仅包含空白字符的文本。'],
 ['min / max / len','number','文本与数组检查长度；数值检查大小。len 为精确约束。'],
 ['enum','数组','允许的值，可显式包含 0、false、null 等边界值。'],
 ['pattern','RegExp | string','正则匹配。'],
 ['transform','(value) => unknown','转换用于校验的值；不会直接修改宿主 model。'],
 ['fields / defaultField','HysFormRules / HysFormRule','嵌套对象规则，或应用于数组、对象各成员的规则。'],
 ['trigger','blur | change | 数组','自动检查时筛选规则；手动调用 validate 会检查全部规则。'],
 ['level','error | warning','warning 仅展示建议，不阻止提交；默认 error。'],
 ['message','string','自定义错误或建议文字。'],
 ['validator','(value, model, { path, signal }) => result','返回 true、void 表示通过；false、字符串、Error 或拒绝的 Promise 表示失败。model 是本次检查的数据快照；signal 可用于取消请求。']
]
</script>
<template><section class="notes"><h2>校验规则</h2><p><code>HysFormRules</code> 使用字段路径作为键，每项可为一个 <code>HysFormRule</code> 或规则数组。字段的 <code>prop</code> 支持 <code>profile.email</code>、<code>contacts[0].email</code> 或路径数组。跨字段校验应同时在表单项上声明 <code>dependencies</code>。</p><div class="api-scroll"><table><thead><tr><th>规则字段</th><th>类型</th><th>说明</th></tr></thead><tbody><tr v-for="row in rows" :key="row[0]"><td><code>{{row[0]}}</code></td><td><code>{{row[1]}}</code></td><td>{{row[2]}}</td></tr></tbody></table></div><p>表单规则和字段规则会合并，错误规则优先，警告在错误通过后检查。更晚的校验结果优先；重置、清除、禁用或页面离开会取消旧检查。<code>validateResult()</code> 可区分校验失败和已取消；自定义请求应使用传入的 <code>signal</code> 释放资源。</p></section></template>
