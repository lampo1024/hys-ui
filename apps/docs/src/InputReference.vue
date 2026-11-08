<template>
  <section class="notes">
    <p>示例站点中的密码仅用于体验交互，离开示例、重置或切换页面时会清空；普通输入状态继续保留。此行为仅作用于本站示例，不改变组件在宿主项目中的密码与自动填充行为。</p>
    <h2>文本、格式与长度</h2>
    <p>
      <code>v-model</code> 保存文本，数字或 null 初始值会转为显示文本。未传
      modelValue 时可用 defaultValue 设置非受控初始值。formatter
      改变显示，parser 将输入还原为原始值；input 和 change 事件、长度统计及原生
      name 字段均使用原始值。
    </p>
    <p>
      默认长度单位为 UTF-16，与 JavaScript 的 length 一致。<code
        >countGraphemes=true</code
      >
      使用 Intl.Segmenter 计算可见字符，旧浏览器回退为 Unicode
      码点。也可以提供返回非负、单调增长数值的计数函数。自定义计数会替代原生
      maxlength/minlength，输入裁剪与原生最小长度校验使用同一规则。外部传入的超限模型会完整展示，不会被主动截断。
    </p>
    <p>
      中文输入法组合期间不裁剪、不格式化、不更新模型；组合结束后统一解析和处理长度。<code
        >input</code
      >
      在接受输入后触发，<code>change</code>
      在原生提交或失焦时触发；清空会触发两者及 clear。
    </p>
    <h2>多行输入与实例</h2>
    <p>
      Input 可设置 <code>type="textarea"</code>，也可使用 HysTextarea。autosize
      自动测量内容与宽度；设置 minRows / maxRows 约束高度，超出后内部滚动。关闭
      autosize 后恢复 rows 和 resize
      行为。组件离开缓存页面时会停止尺寸监听与临时密码查看监听。
    </p>
    <p>
      使用 <code>ref&lt;HysInputInstance&gt;()</code> 或
      <code>ref&lt;HysTextareaInstance&gt;()</code> 获取实例，可调用
      focus、blur、select、clear、resize、setSelectionRange 和 scrollTo。input
      返回原生输入元素，textarea 在多行模式下返回文本区域。也可导入
      HysInputProps、HysTextareaProps、HysInputFormatInfo、HysInputCountInfo 和
      HysInputCountStrategy。
    </p>
    <p>
      prefixIcon、suffixIcon、clearIcon 接受 Vue
      图标组件；对应插槽优先。password-icon 接收 visible，count 接收
      value、count、maxLength。class 与 style 作用于组件外层，inputProps
      可设置内部输入的原生属性与样式；组件管理的值、类型、禁用和长度规则优先。
    </p>
  </section>
</template>
