<script setup lang="ts">
defineProps<{ name: string }>();
</script>
<template>
  <template v-if="name === 'HysAlert'">
    <section class="notes">
      <h2>显示状态与关闭结果</h2>
      <p>
        未绑定显示状态时，提示条默认展示；defaultVisible 设置初始值。visible
        优先于
        modelValue，受控更新被拒绝时继续显示。兼容原有标题变化重新显示的行为，说明变化不会重新打开已关闭提示。
      </p>
      <p>
        closeRequest 在检查开始时发出；beforeClose 返回 false
        或抛出异常保留内容。检查通过后请求更新两个显示模型并发出兼容的无参数
        close 事件。close()/show() 返回
        Promise，表示实际状态是否接受；afterClose 只在退出完成后触发，不应使用
        close 代替动画完成通知。
      </p>
    </section>
    <section class="notes">
      <h2>布局、内容与动效</h2>
      <p>
        effect 选择 light、dark 或 outline；banner 使用横幅布局，未指定时默认
        warning 和图标。默认插槽保留为说明内容，优先于 description 插槽；action
        是独立操作区。自定义操作应使用插槽提供的 closing/disabled 状态。
      </p>
      <p>
        transition 支持 fade、slide、collapse、none；collapse
        在退出时回收高度。transitionDuration 设为 0、系统减少动态效果或全局
        motion=off
        时立即完成。重新打开、标题替换、禁用和页面离开会取消旧检查，不会由迟到结果关闭新提示。
      </p>
    </section>
    <section class="notes">
      <h2>辅助技术与焦点</h2>
      <p>
        danger 默认 role=alert，其他类型使用 status；可通过 role、ariaLive 和
        ariaLabel
        按场景调整。关闭按钮保留键盘访问，退出期间内容不再可聚焦。需要在关闭后聚焦下一项时，请在
        afterClose 中处理；组件不会擅自移动焦点。
      </p>
    </section>
  </template>
  <template v-else-if="name === 'HysEmpty'">
    <section class="notes">
      <h2>图片、占位与回退</h2>
      <p>
        保留默认 Inbox 图形和原有标题说明；illustration 还提供 simple 与
        default。image 接受图片 URL，imageSize 控制默认宽高，imageStyle
        可以分别调整宽高。image=false 或 imageSize=0 隐藏图片区。
      </p>
      <p>
        原生图片拥有加载、错误、重试状态；错误时使用 fallback
        插槽或内置图形。imageLoad/imageError
        只通知当前图片的事件，替换地址或页面离开后的旧事件会忽略。image
        插槽接管图形内容，不执行原生图片请求。重试仅重新加载当前地址，业务重新请求数据应通过独立按钮处理。
      </p>
    </section>
    <section class="notes">
      <h2>内容与可访问性</h2>
      <p>
        title/description 设为 false
        隐藏对应区域，空字符串也可以结合插槽自定义内容。action
        是独立操作区，兼容默认底部插槽，两者可同时使用。内置图形和无 imageAlt
        的原生图片默认是装饰内容；有信息含义时设置
        imageAlt。列表更新的播报需要显式选择
        ariaLive，避免每个空状态都打断阅读。
      </p>
    </section>
  </template>
  <template v-else>
    <section class="notes">
      <h2>记录、身份与顺序</h2>
      <p>
        items 保留原始记录，不修改源数组。默认字段与旧
        title/time/description/status/color 用法一致；fieldNames
        可映射嵌套业务字段。动态列表建议提供唯一 id/key 或
        itemKey；没有编号时按对象身份保留内部状态，克隆对象需要稳定编号才能关联原来的实例。
      </p>
      <p>
        reverse 只反转记录。插槽中的 item 仍为原始业务对象，index
        是显示序号，sourceIndex 是源数组位置。pending 始终独立放在
        pendingPosition
        指定的一侧，兼容默认末尾文字。重复编号会使用对象身份回退，业务仍应提供唯一编号。
      </p>
    </section>
    <section class="notes">
      <h2>布局与节点</h2>
      <p>
        left/right 将轴放在对应一侧，alternate/alternate-reverse
        交替展示内容。单项 position 或 label 会使用居中轴布局；position
        表示内容所在侧。responsive 默认开启，组件容器不宽于 480px
        时转为单侧布局并把标签放到正文上方。
      </p>
      <p>
        节点支持语义色、自定义颜色、尺寸、空心、图标和加载。timePlacement、showTime、单项
        hideTime 控制时间；dateTime 为机器可读的日期。自定义 item
        接管整个正文，time/title/description
        插槽仅在默认正文中生效。加载动画遵守减少动态效果和全局配置，缓存页面离开时暂停。
      </p>
    </section>
  </template>
</template>
