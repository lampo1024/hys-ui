<script setup lang="ts">
import { computed, useTemplateRef, type Component, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import type { HysMenuKey } from "../../composables/menu";
import { useContainerWidth } from "../../composables/useContainerWidth";
import HysBreadcrumb, {
  type HysBreadcrumbItem,
} from "../HysBreadcrumb/HysBreadcrumb.vue";
import HysButton, { type HysButtonVariant } from "../HysButton/HysButton.vue";
import HysTag, { type HysTagProps } from "../HysTag/HysTag.vue";
import HysDropdown from "../HysDropdown/HysDropdown.vue";
import { ArrowLeft, Ellipsis } from "../HysIcon/svgIcons";

export interface HysPageHeaderAction {
  key: HysMenuKey;
  label: string;
  icon?: Component;
  variant?: HysButtonVariant;
  disabled?: boolean;
  /** 将次要操作始终收进更多菜单。 */
  overflow?: boolean;
}

export interface HysPageHeaderProps {
  /** 页面标题；title 插槽优先。 */
  title?: string;
  /** 标题下的说明；subtitle 插槽优先。 */
  subtitle?: string;
  /** 显示返回按钮，默认 false。 */
  showBack?: boolean;
  /** 返回按钮的无障碍名称，默认「返回」。 */
  backLabel?: string;
  /** 自定义返回入口图标。 */
  backIcon?: Component;
  /** 标题旁的状态标签。 */
  status?: string;
  /** 状态标签主题颜色，默认 neutral。 */
  statusTone?: HysTagProps["tone"];
  /** 面包屑路径，breadcrumb 插槽优先。 */
  breadcrumbs?: readonly HysBreadcrumbItem[];
  /** 使用紧凑的标题、留白和按钮尺寸。 */
  compact?: boolean;
  /** 隐藏外框及背景，适合嵌入现有卡片。 */
  frameless?: boolean;
  /** 标题级别 1–6，默认 1。 */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 随最近的滚动容器吸顶，默认 false。 */
  sticky?: boolean;
  /** 吸顶时距容器顶部的像素数，默认 0。 */
  stickyOffset?: number;
  /** 页面操作。窄容器保留首个操作，其余进入更多菜单。 */
  actions?: readonly HysPageHeaderAction[];
  /** 宽容器直显操作数，默认 3。 */
  maxVisibleActions?: number;
  /** 更多操作菜单的文字，默认「更多操作」。 */
  moreLabel?: string;
}

const props = withDefaults(defineProps<HysPageHeaderProps>(), {
  backLabel: "返回",
  headingLevel: 1,
  maxVisibleActions: 3,
  moreLabel: "更多操作",
});
const emit = defineEmits<{
  /** 激活返回按钮时将点击事件交给调用方。 */
  back: [event: MouseEvent];
  /** 用户触发页面操作时发出操作键。 */
  action: [key: HysMenuKey];
}>();
defineSlots<{
  /** 自定义页面标题，默认使用一级标题。 */
  title?: () => VNodeChild;
  /** 自定义副标题。 */
  subtitle?: () => VNodeChild;
  /** 标题右侧的应用操作。 */
  extra?: () => VNodeChild;
  /** 替换默认面包屑。 */
  breadcrumb?: () => VNodeChild;
  /** 标题下的状态、负责人或更新时间。 */
  meta?: () => VNodeChild;
  /** 标题左侧的头像、图标或品牌。 */
  leading?: () => VNodeChild;
  /** 底部导航区，适合放置页面级 Tabs。 */
  tabs?: () => VNodeChild;
  /** 替换标题旁的状态标签。 */
  status?: () => VNodeChild;
}>();

const skin = useHysRootAttrs();
const root = useTemplateRef<HTMLElement>("root");
const width = useContainerWidth(computed(() => root.value ?? undefined));
const heading = computed(
  () =>
    `h${[1, 2, 3, 4, 5, 6].includes(props.headingLevel) ? props.headingLevel : 1}`,
);
const offset = computed(() =>
  Math.max(0, Number.isFinite(props.stickyOffset) ? props.stickyOffset! : 0),
);
const actions = computed(() => [
  ...new Map((props.actions ?? []).map((item) => [item.key, item])).values(),
]);
const visible = computed(() => {
  const limit = Number.isFinite(props.maxVisibleActions)
    ? Math.max(0, Math.floor(props.maxVisibleActions))
    : 3;
  return actions.value
    .filter((item) => !item.overflow)
    .slice(
      0,
      width.value > 0 && width.value < 480 ? Math.min(1, limit) : limit,
    );
});
const overflow = computed(() =>
  actions.value
    .filter((item) => !visible.value.includes(item))
    .map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      danger: item.variant === "danger",
    })),
);
</script>

<template>
  <header
    ref="root"
    v-bind="skin"
    class="hys-page-header"
    :class="{ 'is-compact': compact, 'is-sticky': sticky, 'is-frameless': frameless }"
    :style="sticky ? { insetBlockStart: offset + 'px' } : undefined"
  >
    <div
      v-if="breadcrumbs?.length || $slots.breadcrumb"
      class="hys-page-breadcrumb"
    >
      <slot name="breadcrumb"
        ><HysBreadcrumb :items="props.breadcrumbs ?? []" size="sm"
      /></slot>
    </div>
    <div class="hys-page-header-row">
      <div class="hys-page-main">
        <HysButton
          v-if="showBack"
          class="hys-page-back"
          variant="ghost"
          :size="compact ? 'sm' : 'md'"
          :icon="backIcon ?? ArrowLeft"
          :aria-label="backLabel"
          @click="emit('back', $event)"
        />
        <slot name="leading" />
        <div
          v-if="
            title || subtitle || status || $slots.title || $slots.subtitle || $slots.status || $slots.meta
          "
          class="hys-page-heading"
        >
          <div v-if="title || status || $slots.title || $slots.status" class="hys-page-title-line">
            <slot name="title">
              <component :is="heading" v-if="title" class="hys-page-title">{{ title }}</component>
            </slot>
            <slot name="status">
              <HysTag v-if="status" :tone="statusTone ?? 'neutral'" size="sm">{{ status }}</HysTag>
            </slot>
          </div>
          <slot name="subtitle"
            ><p v-if="subtitle">{{ subtitle }}</p></slot
          >
          <div v-if="$slots.meta" class="hys-page-meta">
            <slot name="meta" />
          </div>
        </div>
      </div>
      <div v-if="actions.length || $slots.extra" class="hys-page-extra">
        <HysButton
          v-for="item in visible"
          :key="item.key"
          :size="compact ? 'sm' : 'md'"
          :variant="item.variant ?? 'secondary'"
          :icon="item.icon"
          :disabled="item.disabled"
          @click="emit('action', item.key)"
          >{{ item.label }}</HysButton
        >
        <HysDropdown
          v-if="overflow.length"
          :items="overflow"
          :aria-label="moreLabel"
          @select="emit('action', $event)"
        >
          <template #trigger
            ><HysButton
              variant="secondary"
              :size="compact ? 'sm' : 'md'"
              :icon="Ellipsis"
              >{{ moreLabel }}</HysButton
            ></template
          >
        </HysDropdown>
        <slot name="extra" />
      </div>
    </div>
    <div v-if="$slots.tabs" class="page-tabs"><slot name="tabs" /></div>
  </header>
</template>

<style scoped>
.page-tabs { margin-block-start: 10px; min-inline-size: 0; }
.hys-page-header.is-frameless { background: transparent; border-color: transparent; padding-inline: 0; }
.hys-page-header {
  display: grid;
  gap: 10px;
  min-inline-size: 0;
  color: var(--hys-ui-theme-text);
  overflow-wrap: anywhere;
}
.hys-page-header.is-compact {
  gap: 6px;
}
.hys-page-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  column-gap: 16px;
  row-gap: 10px;
}
.hys-page-main {
  display: flex;
  min-inline-size: 0;
  align-items: flex-start;
  gap: 6px;
}
.hys-page-back {
  flex: none;
}
.hys-page-heading {
  display: grid;
  min-inline-size: 0;
  gap: 3px;
}
.hys-page-title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-inline-size: 0;
}
.hys-page-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 650;
}
.is-compact .hys-page-title {
  font-size: 19px;
}
.hys-page-heading p {
  margin: 0;
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
.hys-page-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-inline-size: 0;
}
.hys-page-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
.is-sticky {
  position: sticky;
  z-index: 2;
  background: var(--hys-ui-theme-surface);
  padding-block: 8px;
  border-block-end: 1px solid var(--hys-ui-theme-border);
}
</style>
