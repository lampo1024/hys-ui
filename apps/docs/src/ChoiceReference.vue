<template>
  <section class="notes">
    <h2>值、事件与受控状态</h2>
    <p>
      选项值支持字符串、有限数值和布尔值，保留数字与同名字串之间的区别。复选框可绑定单值或数组；单值使用
      <code>trueValue / falseValue</code> 映射，数组和复选框组使用每项的
      <code>value</code>。开关使用
      <code>activeValue / inactiveValue</code>，单选组件使用选项本身的值。
    </p>
    <p>
      <code>v-model</code> 由调用方控制；未绑定时使用
      <code>defaultValue</code>。<code>update:modelValue</code> 和
      <code>change</code> 表示一次操作请求，支持只用 change
      更新模型的现有用法。宿主拒绝请求时，视觉状态会恢复为实际模型值。实例切换与选择方法返回
      Promise，结果表示最终值是否被接受。
    </p>
  </section>
  <section class="notes">
    <h2>分组、限制与表单</h2>
    <p>
      复选框组、单选组支持 options 数据或默认插槽组合子组件；提供 options
      时优先使用数据模式。<code>fieldNames</code>
      可映射业务字段，分组的尺寸、禁用、只读和外观会传递给子项。
    </p>
    <p>
      复选框组的 min / max
      控制选择数量；全选会选至上限，清除会保留最少项、不可修改的已选项和尚未加载的值。约束相互矛盾时停止操作并显示错误语义，不改写宿主数据。表单必填与数组长度规则请通过
      HysForm 配置。
    </p>
    <p>
      控件继承字段的标签、错误说明、尺寸和禁用状态。name / form
      支持原生表单提交与外部表单关联，禁用项不参与提交。原生表单重置会恢复非受控初值；受控数据使用
      HysForm 的 resetFields 或直接更新模型。
    </p>
  </section>
  <section class="notes">
    <h2>异步切换与键盘</h2>
    <p>
      开关的 <code>beforeChange(next, current, {signal})</code> 可返回 false
      阻止切换，也可返回 Promise。等待期间阻止重复操作，拒绝时触发
      error；外部值变化、禁用、表单重置或页面离开会取消过期请求。请把 signal
      传给实际网络工作。
    </p>
    <p>
      复选框支持 Space，开关支持 Enter / Space。单选组只保留一个 Tab
      入口，方向键跳过禁用项，Home / End
      定位首尾，并支持从右向左的布局。单独组合多个单选框时共享 v-model 和
      name；需要完整方向键导航时使用 HysRadioGroup。
    </p>
  </section>
</template>
