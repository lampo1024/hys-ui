<script setup lang="ts">
defineProps<{ name: string }>();
</script>
<template>
  <section class="notes">
    <h2>值与受控状态</h2>
    <p v-if="name === 'HysRating'">
      评分默认从零分开始；未绑定时使用
      defaultValue。已有小数会按实际比例展示，allowHalf
      决定用户操作的步长。超出范围、空值或非有限数值只规范展示，不改写宿主数据。max
      优先于 count，clearable 显式值优先于
      allowClear；保留再次点击当前分数清零的默认行为。
    </p>
    <p v-else>
      选项可为字符串、数值、布尔值或业务对象，通过 fieldNames 映射字段。数字
      0、字符串 “0” 和 false 保持区别。未绑定模型且没有 defaultValue
      时选择首个可用项；之后删除或禁用选中项不会擅自改写模型。
    </p>
    <p>
      update:modelValue 与 change
      表示一次操作请求；宿主可以拒绝更新。实例提交方法返回
      Promise&lt;boolean&gt;，表示最终是否接受。只读允许聚焦，禁止修改；禁用会从
      Tab 顺序移除。name / form
      支持原生表单值与外部表单关联，非受控模式会响应原生 reset。
    </p>
  </section>
  <section class="notes" v-if="name === 'HysRating'">
    <h2>评分展示与预览</h2>
    <p>
      colors / icons 可使用低、中、高三级数组，或按阈值递增排列的对象；excluded
      表示不包含当前阈值。统一 color 优先于 colors。showScore 优先于
      showText，文本说明可使用 texts、scoreTemplate、formatScore 或 text 插槽。
    </p>
    <p>
      hoverValue 独立于提交值，可通过 v-model:hoverValue
      控制；mouseleave、失焦与缓存页面离开会撤销非受控预览。character
      插槽分别渲染背景与裁剪前景，收到 filled 与
      fraction；适合放置非交互图形或文字，避免重复 ID。图形两层应保持相同尺寸。
    </p>
    <p>
      方向键调整分值，Home / End 定位边界；允许清空时 Delete / Backspace
      清零。屏幕阅读器描述可通过 formatValueText 设置。
    </p>
  </section>
  <section class="notes" v-else>
    <h2>布局、键盘与动效</h2>
    <p>
      block 铺满容器，横向选项均分宽度；vertical 或 direction 可切换纵向。label
      / 默认插槽支持自定义内容，选项可提供 icon、title、className 与
      style。单项内容应保持为非交互元素，完整可访问名称由选项文本提供。
    </p>
    <p>
      Tab 保留一个可用入口，方向键跳过禁用项，Home / End
      定位首尾；loopNavigation
      控制是否循环，并遵循从右向左的视觉方向。选中指示器在实际值变化后更新位置；仅观察当前组件和选中项的尺寸，离开缓存页面时解除观察与待执行动画帧。系统减少动态效果与组件
      motion=off 会关闭过渡。
    </p>
  </section>
</template>
