<script setup lang="ts">
const tokens = [
  ["--hys-number-font", "数值字号、粗细、字体与行高，接受 font 简写"],
  ["--hys-number-width / --hys-number-align", "数值区域宽度与整体对齐方式"],
  ["--hys-number-justify", "固定宽度区域内的数值内容对齐"],
  ["--hys-number-positive / --hys-number-negative", "增减方向或正负值的语义色"],
  ["--hys-number-color / --hys-number-bg", "数字前景与背景色"],
  ["--hys-number-shadow / --hys-number-stroke", "数字阴影、发光和描边"],
  [
    "--hys-number-letter-spacing / --hys-number-vertical-align",
    "字间距与基线对齐",
  ],
  [
    "--hys-number-digit-width / --hys-number-digit-bg",
    "单个数字位的最小宽度与背景",
  ],
  [
    "--hys-number-digit-border / --hys-number-digit-radius",
    "单个数字位的边框和圆角",
  ],
  [
    "--hys-number-digit-gap / --hys-number-text-gradient",
    "数字位间距与 display 面板的字面渐变",
  ],
  [
    "--hys-number-prefix-color / --hys-number-suffix-color / --hys-number-unit-color",
    "前缀、后缀和单位颜色",
  ],
  ["--hys-number-separator-color", "分组符及小数点颜色"],
  [
    "--hys-number-highlight-color / --hys-number-gradient-color",
    "动画高亮和渐变目标色",
  ],
];
</script>

<template>
  <section
    class="notes animated-number-reference"
    aria-labelledby="animated-number-reference"
  >
    <h2 id="animated-number-reference">播放与格式约定</h2>
    <ul>
      <li>
        <code>v-model</code> 绑定业务目标。<code>frame.value</code>
        是当前帧，<code>displayValue</code> 包含格式化单位，前后缀单独渲染。
      </li>
      <li>
        <code>duration</code>、<code>delay</code>、<code>easing</code>、<code
          >interpolate</code
        >
        与循环配置在新一轮播放时读取。<code>speed</code>、<code>fps</code>
        和数字格式可以在播放中修改。
      </li>
      <li>
        <code>seek(0.5)</code> 设置当前轮的原始进度为
        50%。无活动播放时会进入暂停状态，可以通过
        <code>resume()</code> 从该位置继续。
      </li>
      <li>
        数值达到 49 位时会回退为整段文本。可以用
        <code>minimumIntegerDigits</code> 补齐位数，并用
        <code>stableWidth</code> 为起点和终点预留空间。
      </li>
      <li>
        <code>effect</code>
        可叠加缩放、淡入淡出、高亮等整体效果。数组中第一个逐位效果负责数字位的渲染，阈值效果排在常规效果之前。
        <code>interpolate</code>
        只处理中间帧，返回无效值或抛出错误时回退到内置插值。
      </li>
      <li>
        <code>animation</code> 支持名称、配置或最多 8 层的配置数组，例如
        <code>[{ name: 'drum-roll', cycles: 3 }, 'highlight']</code
        >。配置还可指定 <code>strength</code>、<code>axis</code>、<code
          >seed</code
        >
        和以总时长为基准的 <code>stagger</code>。
        效果与数值使用同一播放进度，暂停、跳转和运行时切换共享该进度。
      </li>
      <li>
        <code>animationPresets</code> 可以定义可复用的名称，例如
        <code>{ dashboard: ['scan-reveal', 'highlight'] }</code>，再设置
        <code>animation="dashboard"</code>。 解析不到效果时会尝试
        <code>fallbackAnimation</code>。<code>digitAnimations</code> 的
        <code>integer:0</code> 对应个位，<code>fraction:1</code>
        对应第一位小数，<code>*</code> 匹配未单独配置的数位。
      </li>
      <li>
        <code>hysNumberAnimationCatalog</code> 提供分类、名称和标题。用
        <code>parseHysNumberAnimation</code> 与
        <code>stringifyHysNumberAnimation</code> 读写效果配置， 用
        <code>createHysNumberSequence(name, count, options)</code>
        取得多实例的延迟、时长与方向。
        环形进度、排行榜和业务阈值在演示中使用实际数值联动。
      </li>
      <li>
        倒计时按系统时间计算。服务器与客户端以相同初值渲染，挂载后同步剩余时间。<code
          >change</code
        >
        和 <code>finish</code> 用于倒计时，普通动画使用 <code>update</code> 和
        <code>end</code>。
      </li>
      <li>
        页面隐藏时默认停止倒计时刷新，恢复后按截止时间同步剩余量。设置
        <code>:pause-when-hidden="false"</code> 可继续刷新。
      </li>
      <li>
        <code>useHysAnimatedNumber(() =&gt; ({ value, from, duration }))</code>
        可在 Vue setup 中驱动图表或自定义视图。其 <code>frame</code> 为只读
        Ref，第二参数可接收 <code>(event, frame)</code>。
      </li>
      <li>
        <code
          >useHysNumberAnimationGroup(() =&gt; [first.value, second.value,
          chart])</code
        >
        接受组件实例和独立动画，可统一暂停、继续、反向和跳转。
      </li>
      <li>
        <code>trigger="activate"</code> 在组件从 KeepAlive 恢复时播放。组合
        <code>['mount', 'activate']</code> 可同时在首次进入和重新进入时播放。
      </li>
    </ul>
    <details>
      <summary>CSS 自定义属性</summary>
      <div class="api-scroll">
        <table>
          <thead>
            <tr>
              <th>变量</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[name, use] in tokens" :key="name">
              <td>
                <code>{{ name }}</code>
              </td>
              <td>{{ use }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </section>
</template>

<style scoped>
.animated-number-reference summary {
  margin-block-start: 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}
.animated-number-reference td:first-child {
  overflow-wrap: anywhere;
}
.animated-number-reference td:nth-child(2) {
  min-width: 9rem;
}
</style>
