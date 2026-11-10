<template>
  <section class="notes">
    <h2>数值与成功进度</h2>
    <p>
      <code>value</code> 保持原有必填百分比参数，限制在
      0–100；非有限数值归零。<code>success.value</code>
      是整体进度中已经确认的部分，最多等于
      value，不与整体进度相加。状态不会根据百分比自动改变。
    </p>
    <p>
      <code>size</code> 提供 sm / md / lg；未设置时保留原来的 7px 线形粗细与
      100px 环形宽度。显式 strokeWidth 和 width 优先。width
      控制环形，线形长度由容器或 style 决定；环形粗细按 100 × 100 坐标计算。
    </p>
    <h2>颜色与形状</h2>
    <p>
      <code>color</code> 支持颜色文字、接收百分比的函数、{ value, color }
      阈值数组，以及 { from, to, direction?, stops? }
      渐变。阈值数组复制后排序；渐变色标 offset 为
      0–100。字符串数组在分段模式中循环使用，连续模式中形成等距渐变。success.color
      支持相同配置，trailColor 单独控制未完成部分。
    </p>
    <p>
      circle 默认完整一圈；dashboard 默认在底部保留 75° 缺口。gapDegree 支持
      0–295，gapPosition 为 top / right / bottom / left。strokeLinecap
      控制圆角、平直或方形端点。
    </p>
    <p>
      steps 在三种形状中均可使用，并保留不满一段的准确进度。分段最多
      200；stepGap 在线形中使用像素，在环形中使用 SVG
      坐标单位。环形分段过密时自动细化轨道并限制间隙，避免相邻端点重叠。
    </p>
    <h2>文字与辅助技术</h2>
    <p>
      showLabel 默认开启，保留百分比。precision 只影响默认文字；format(value,
      successValue) 可返回文字或 VNode，default 插槽优先于格式器。插槽还接收
      status 和 indeterminate。showStatusIcon 默认关闭，可与 icon 插槽一起使用。
    </p>
    <p>
      textInside
      在线形中把文字放入轨道；未指定粗细时自动留出文字高度。显式轨道过细时，文字改放外侧。长文字会换行并保留轨道空间；showLabel=false
      仍保留 progressbar 语义。ariaLabel、ariaValueText 和 aria-describedby
      可补充任务说明。
    </p>
    <h2>动效与未知总量</h2>
    <p>
      animated 控制数值过渡和循环动效，duration
      是数值过渡的毫秒时长，flowDuration 是循环动效时长，设为 0 停止循环。active
      状态显示进行中反馈；striped / stripedFlow
      为线形增加静态或流动条纹。系统减少动态效果和全局 motion=off 优先。
    </p>
    <p>
      indeterminate 用于无法确定总量的操作，使用连续轨道并省略
      aria-valuenow。此时 steps 暂不生效；通过 format
      或插槽显示“加载中”等文字。组件不启动 JavaScript
      定时器或逐帧回调，缓存页面离开时停止自身动画。
    </p>
  </section>
</template>
