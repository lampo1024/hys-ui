<script setup lang="ts">
const tokens = [
  ["--hys-number-font", "数值字号、粗细、字体与行高，接受 font 简写"],
  ["--hys-number-width / --hys-number-align", "数值区域宽度与整体对齐方式"],
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
        <code>duration</code>、<code>delay</code>、<code>easing</code>
        与循环配置在新一轮播放时读取。<code>speed</code>、<code>fps</code>
        和数字格式可以在播放中修改。
      </li>
      <li>
        <code>seek(0.5)</code> 设置当前轮的原始进度为
        50%。无活动播放时会进入暂停状态，可以通过
        <code>resume()</code> 从该位置继续。
      </li>
      <li>
        逐位效果只作用于前 48 位以内的数字显示，长数值以普通文本展示。可以用
        <code>minimumIntegerDigits</code> 补齐位数，并用
        <code>stableWidth</code> 为起点和终点预留空间。
      </li>
      <li>
        倒计时按系统时间计算。服务器与客户端以相同初值渲染，挂载后同步剩余时间。<code
          >change</code
        >
        和 <code>finish</code> 用于倒计时，普通动画使用 <code>update</code> 和
        <code>end</code>。
      </li>
      <li>
        <code>useHysAnimatedNumber(() =&gt; ({ value, from, duration }))</code>
        可在 Vue setup 中驱动图表或自定义视图。其 <code>frame</code> 为只读
        Ref，第二参数可接收 <code>(event, frame)</code>。
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
