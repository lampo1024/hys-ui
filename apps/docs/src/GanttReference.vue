<template>
  <section class="notes">
    <h2>撤销与重做</h2>
    <p>
      history 默认启用，historyLimit 默认保留 50 步，可设为 0
      停止记录；showHistoryControls 和 historyKeyboard
      分别控制工具栏与快捷键。一次任务移动、起止日期调整、键盘微调、关系增删或终点改接只记作一步；仅在宿主接受
      update:items 后入栈，取消操作和拒绝更新不记入历史。
    </p>
    <p>
      undo / redo 返回 Promise&lt;boolean&gt;，通过一次 update:items
      原子恢复受影响任务，并分别触发 change；成功后触发 undo 或
      redo，恢复过程不重复触发 dependencyAdd / dependencyRemove /
      dependencyMove。canUndo、canRedo、historyState
      可用于宿主工具栏，clearHistory 只清空记录，不改数据。
    </p>
    <p>
      历史按字段保存差量，恢复时保留任务标题、负责人、进度等最新数据；宿主从外部修改排期、依赖或任务集合时清空旧历史。操作遵守当前编辑权限。缓存页面保留历史并停用快捷键，返回后可继续恢复。选择、视图、滚动和列宽不进入排期历史。
    </p>
  </section>
  <section class="notes">
    <h2>排期冲突检查</h2>
    <p>
      当前关系为完成→开始，日期包含结束当天，因此后置任务最早从前置任务结束的次日开始。组件检查前后置日期冲突、无效日期、失效引用和外部数据中的循环依赖；不会自动推迟任务或修改宿主数据。showConflicts
      可隐藏图表提示，conflicts 与 conflictChange 仍提供诊断结果。
    </p>
    <p>
      任务与冲突连线使用警示标记，详情支持搜索、分页和定位，定位不打开业务详情。循环检测使用迭代图遍历，能区分环内任务与环下游任务。拖动时仅重新检查该任务相连的依赖，并预览新增及消除的冲突；松开、撤销和重做后更新完整结果。
    </p>
  </section>
  <section class="notes">
    <h2>滚动区域与大数据</h2>
    <p>
      点击时间轴空白处或按 Esc 可取消任务行选中；宿主也可将 v-model 设为
      null。Esc
      会先关闭浮层、取消连接或排期拖动，再清除任务选中；取消选中不会触发 open
      事件。
    </p>
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
      关系列表支持按前置任务名称或编号搜索。每项可直接删除依赖、定位前置任务或进入终点改接；后置任务旁的定位按钮可回到汇入任务。定位仅选中并显露任务，不会打开详情。操作按钮与关系选择独立，删除一条关系会保留其他前置关系。
    </p>
    <p>
      多条关系共享同一终点时，点击汇入端或数字标记可打开前置关系列表，按任务名称选择要操作的一条。选中连线会突出显示，其他线条淡化；仅当前连线的终点可拖动。列表支持上下键、Home
      / End、Enter 和 Esc，Esc 关闭时恢复到选择入口，确定关系后聚焦相应连接点。
    </p>
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
      点击任务、时间轴空白、日期表头或工具栏会取消连线的选中状态，保留关系数据；终点编辑和移除按钮可继续操作当前连线。
    </p>
    <p>
      当前后任务排期发生重叠时，折返连线会沿目标行外的空隙绕行，从目标左侧收口。终点保留水平引导线与箭头间距，避免被任务条或选中轮廓遮挡；向上、向下连接和自定义行高均采用同一规则。
    </p>
    <p>
      已有连线可再次编辑。悬停或选中连线后，拖动终点空心圆到新的后置任务，或聚焦终点后按
      Enter 进入键盘选择。改接期间保留原关系；校验通过后通过一次 update:items
      同时更新原后置任务和新后置任务，日期及其他前置关系保持不变。无效目标、Esc
      或丢弃到空白处均保留原关系。
    </p>
    <p>
      moveDependency(sourceId, previousTargetId, targetId)
      可通过实例执行同样的操作。dependencyMove 在宿主接受后返回关系信息（含
      previousTargetId）、新后置任务与原后置任务；不会同时触发 dependencyAdd /
      dependencyRemove。change
      分别报告两个任务的更新请求。放回原任务视为未修改，不产生更新事件。
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
