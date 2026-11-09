<template>
  <section class="notes">
    <h2>滚动区域与大数据</h2>
    <p>
      任务名称和时间轴共享一个滚动区域。height 设置固定高度；未指定时，maxHeight
      默认使用 620px，短列表按内容收缩。设置 maxHeight=false
      可随页面展开。有限高度下，日期表头与任务名称列保持可见。
    </p>
    <p>
      大量任务建议启用 virtual，并设置有限的 height 或
      maxHeight。左右任务行使用同一窗口与行高，overscan
      控制上下缓冲行数。日期解析会复用同批数据中的相同日期；完成数量与依赖几何在数据变化时更新，滚动仅更新可视窗口。离开缓存页面时取消活动操作和观察器，返回后恢复双向滚动位置。
    </p>
    <p>
      scrollToTask(id, options) 可按 ID 定位，options 支持
      block、behavior、horizontal。返回值表示任务存在并已请求定位；平滑动画遵循浏览器行为。定位、选中和打开任务可由调用方分别决定。
    </p>
  </section>
  <section class="notes">
    <h2>调整任务列宽</h2>
    <p>
      拖动任务名称列右侧的分隔线即可调整列宽，时间轴会适配剩余空间。labelWidth
      支持 v-model:labelWidth；labelResizable 可关闭交互，minLabelWidth /
      maxLabelWidth 设置边界。窄容器会优先为时间轴保留可见空间。
    </p>
    <p>
      分隔线支持左右键每次调整 10px、Shift + 左右键调整 50px、Home / End
      移到边界；Esc 取消当前拖动，双击还原初始宽度。update:labelWidth
      在变化时触发，labelResize
      在鼠标释放、键盘调整或还原后触发。拖动按动画帧合并更新。
    </p>
  </section>
  <section class="notes">
    <h2>前置依赖编辑</h2>
    <p>
      dependencies 保存当前任务的前置任务 ID，连线方向为“前置任务完成 →
      当前任务开始”。拖动任务右侧圆点到后置任务可建立关系，靠近可视区边缘时自动滚动。也可点击连接点后点击目标，或使用
      Enter 开始、上下键选择、Enter 确认、Esc 取消。
    </p>
    <p>
      选中连线后可通过“移除依赖”或 Delete
      删除。组件拦截自身依赖、重复边、循环关系、无效任务和禁止编辑的任务；禁用任务不能新建关系，移除关系以其后置任务是否可编辑为准。依赖编辑更新后置任务的
      dependencies，日期继续由 start / end 管理。
    </p>
    <p>
      dependencyEditable 默认继承
      editable，可单独配置依赖编辑权限。showDependencies
      控制连线与连接点的展示，隐藏时保留关系数据。update:items 和 change
      表示更新请求；dependencyAdd / dependencyRemove
      在宿主接受后触发，拒绝或校验失败通过 dependencyInvalid 反馈。
    </p>
  </section>
</template>
