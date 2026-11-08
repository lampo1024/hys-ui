<template>
  <section class="notes">
    <h2>头像内容与回退</h2>
    <p>
      图片优先展示；加载失败后先尝试 fallbackSrc，再展示 fallback 插槽、icon
      插槽或组件、默认文字和 name 缩写。未指定内容时展示用户图标。替换 src /
      srcset 或调用 reload() 会重新尝试加载。loadError 返回 false
      时保留原图节点，由宿主处理失败。
    </p>
    <p>
      fit 支持 fill、contain、cover、none 和 scale-down。srcset（或
      srcSet）、sizes、crossOrigin、draggable、lazy 与 imgProps
      可配置图片属性；图片事件额外提供 {src,fallback}
      信息。默认不允许原生图片拖动。
    </p>
    <h2>尺寸与文字</h2>
    <p>
      size 支持像素数值、sm / md / lg，以及按 xs / sm / md / lg / xl / xxl
      配置的响应式对象；small / medium / default / large
      也可使用。断点依据窗口宽度，多个头像共享尺寸监听。默认大小为 36px。
    </p>
    <p>
      默认插槽支持完整文字，name 保持显示前两个 Unicode 字符的简写。autoFit
      默认开启，文字会根据可用宽度和 gap 缩小；修改文字或尺寸后重新测量。使用
      name、alt 或 aria-label 提供完整的可访问名称。
    </p>
    <h2>头像组与键盘</h2>
    <p>
      HysAvatarGroup 支持 options
      数据或默认插槽，统一尺寸、形状与描边；单个头像的显式配置优先。负 gap
      重叠头像，正 gap 添加间距。maxCount 控制可见成员数，+N
      入口额外展示；隐藏成员在浮层展开前不挂载。
    </p>
    <p>
      计数入口支持 hover、focus、click 三种触发方式，也可用 Tab 聚焦并按 Enter /
      空格打开。向下方向键打开并聚焦浮层，Escape
      关闭并恢复焦点。浮层继承主题，页面离开时清理。头像本身是展示内容，需要点击行为时请由按钮或链接包裹。
    </p>
    <p>
      公共类型：HysAvatarProps、HysAvatarSize、HysAvatarBreakpoint、HysAvatarFit、HysAvatarLoadInfo、HysAvatarOption、HysAvatarInstance、HysAvatarGroupProps、HysAvatarGroupInstance。
    </p>
  </section>
</template>
