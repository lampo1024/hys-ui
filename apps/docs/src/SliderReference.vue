<template>
  <section class="notes">
    <h2>数值与交互</h2>
    <p>
      轨道和滑块均由组件自行绘制，使用指针事件处理鼠标、触摸及触控笔交互。轨道点击选择最近的端点，范围两端不会相互越过。<code
        >draggableTrack</code
      >
      允许整体移动数值范围并保留区间宽度。
    </p>
    <p>
      <code>step</code> 从 min 开始计算，支持小数。<code>step="mark"</code> 或
      null 只允许选择 marks
      中的刻度；无可用刻度或范围不可调整时自动禁用。外部传入值按当前范围和步长展示，但不会主动改写模型。
    </p>
    <p>
      拖动过程中立即发出 update:modelValue 和
      input，接受数值变化后在释放时发出一次 change。按 Escape 或调用 cancel()
      撤销本次拖动；系统取消、窗口失焦、页面离开或配置改变会停止拖动，保留已接受的数值，不发送迟到的
      change。指针移动按动画帧合并，数值停靠点受 maxStops 限制。
    </p>
    <h2>键盘与可访问性</h2>
    <p>
      拖动按动画帧合并指针更新，滑块与选中轨道使用位移变换，提示复用稳定的样式和尺寸测量并在同一帧跟随。step
      决定停靠间隔；需要细腻调节时可使用较小步长。请求和大批数据重算建议放在
      change 中执行。
    </p>
    <p>
      提示渲染为独立浮层，不受轨道外层 overflow
      裁切。靠近视口边缘时自动偏移，首选方向放不下时切换到另一侧，长文本自动换行。浮层随滚动和容器尺寸变化更新，滑块离开可视区域时隐藏。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>按键</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tab / Shift + Tab</td>
            <td>依次聚焦各个端点</td>
          </tr>
          <tr>
            <td>右 / 上、左 / 下</td>
            <td>增加、减少一步；reverse 时反转方向</td>
          </tr>
          <tr>
            <td>Shift + 方向键、PageUp / PageDown</td>
            <td>一次调整十步；仅刻度模式调整十个刻度</td>
          </tr>
          <tr>
            <td>Home / End</td>
            <td>定位允许的最小值、最大值；范围端点受另一端限制</td>
          </tr>
          <tr>
            <td>Escape</td>
            <td>撤销当前拖动</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      每个端点拥有 slider 角色及独立名称、方向、允许范围和当前值。使用 label /
      ariaLabel 或 rangeStartLabel / rangeEndLabel 设置名称，formatValueText
      可提供比可见提示更完整的说明。表单反馈自动关联到端点；name
      使用隐藏字段提交原始数值。
    </p>
    <p>
      公共类型：HysSliderValue、HysSliderStep、HysSliderMarks、HysSliderDragInfo、HysSliderInstance，均可从
      hys-ui 导入。
    </p>
  </section>
</template>
