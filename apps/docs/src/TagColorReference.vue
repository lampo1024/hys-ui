<script setup lang="ts">
defineProps<{ name: string }>();
</script>
<template>
  <template v-if="name === 'HysTagInput'">
    <section class="notes">
      <h2>模型、草稿与检查</h2>
      <p>
        modelValue 保留字符串数组接口；未绑定时可使用 defaultValue。默认
        max=10、addOnBlur=true，不修改调用方数组。草稿与实际标签独立：拒绝更新时保留草稿，成功后只移除已处理的文字，新输入不会被旧检查清空。
      </p>
      <p>
        separator 保留保存时拆分的行为；delimiters
        支持输入或粘贴时拆分，接受字符串、数组或正则。beforeAdd
        的原单参数用法仍然有效，第二参数提供 signal、当前候选 values 与
        reason。异步检查期间避免重复提交；按
        Esc、模型替换、禁用或页面离开取消旧检查。reject 保留字符串参数，invalid
        提供详细原因。
      </p>
      <p>
        兼容的 change/add/remove 表示变更请求，宿主可拒绝；acceptedChange
        只在实际更新后触发。实例 add/remove/clear/move 返回
        Promise&lt;boolean&gt;。更新列表本身不会自动清空新草稿。
      </p>
    </section>
    <section class="notes">
      <h2>标签布局、排序与键盘</h2>
      <p>
        size 继承字段或表单配置；tagTone、tagEffect、tagRound
        控制标签外观。collapseTags 折叠超过 maxCollapseTags
        的内容，点击加号查看虚拟列表；未开启折叠时保留自然换行。maxTagTextLength
        只影响显示，不截断模型。
      </p>
      <p>
        输入为空时 Backspace 删除末项，左方向键进入标签，左右方向键或 Home/End
        移动焦点，Delete/Backspace 移除当前项。draggable 开启鼠标排序和
        Alt+左右方向键排序；放置位置以插入线提示，Esc
        取消。只读允许查看折叠标签，禁止修改。
      </p>
    </section>
    <section class="notes">
      <h2>表单与内容定制</h2>
      <p>
        name 以多个同名隐藏字段提交实际标签，不提交草稿。原生 form
        重置恢复非受控初值，HysForm
        重置由表单模型管理。默认输入使用字段标签和关联 ID；ariaLabel
        可显式覆盖。tag 插槽保留 value/index，新增
        remove、readonly、disabled；prefix/suffix
        和清空图标插槽提供整个控件上下文。
      </p>
    </section>
  </template>
  <template v-else>
    <section class="notes">
      <h2>格式与即时更新</h2>
      <p>
        保留原有字符串 v-model 与即时 #RRGGBB 输出。支持
        #RGB/#RGBA/#RRGGBB/#RRGGBBAA、RGB、HSL、HSV 及常见颜色名；透明色会保留
        alpha。showAlpha 开启透明度轨道，未指定 format 时输出 RGBA；显式 format
        决定后续编辑使用 hex、rgb、hsl、hsv。仅改变配置不会自动改写模型。
      </p>
      <p>
        immediate=false 暂存预览，activeChange 通知预览值；confirm
        成功后才更新并关闭。取消、外部关闭或模型替换会放弃旧预览。clearable
        默认为
        false，启用后清空为字符串空值。无效文本显示错误并阻止确认，预设中的无效颜色会跳过。
      </p>
    </section>
    <section class="notes">
      <h2>面板、键盘与实例</h2>
      <p>
        inline 将面板嵌入页面，不创建浮层；浮层支持
        open/defaultOpen、位置、挂载目标、宽度、内容样式与展开动效。自定义
        trigger 通过上下文 show/hide 控制显示，header/footer/preset
        可单独定制。只读允许查看面板，禁用会关闭面板并终止编辑。
      </p>
      <p>
        色板左右调整饱和度、上下调整亮度，色相与透明度使用方向键、Home/End。Shift
        或 PageUp/PageDown 加速。实例提供
        show/hide、focus/blur、setColor、confirm/cancel/clear；返回值表示请求是否接受，内嵌面板不响应隐藏。
      </p>
    </section>
    <section class="notes">
      <h2>连续交互与表单</h2>
      <p>
        指针编辑开始时读取轨道尺寸，后续移动按动画帧合并；释放后进行一次表单检查，取消恢复手势开始值。外部值替换、滚动、禁用和页面离开会清理手势，旧操作不会覆盖新数据。name
        提交已接受的颜色，不提交确认模式的预览。
      </p>
      <p>
        组件继承表单尺寸、禁用状态和反馈，默认文本框与字段标签关联。表单自身仍负责外部模型变化和规则变化的检查；validateEvent
        控制控件主动触发的检查，不会停用整个表单的规则。
      </p>
    </section>
  </template>
</template>
