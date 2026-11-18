<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
import HysButton from "../HysButton/HysButton.vue";
import { ChevronDown, ChevronRight } from "../HysIcon/svgIcons";
import { resolveScrollTarget, scrollTargetTo, scrollTargetTop } from "../../composables/scrollTarget";

export interface HysAnchorItem {
  id: string;
  label: string;
  children?: readonly HysAnchorItem[];
}
export interface HysAnchorProps {
  /** 目录树。id 对应目标元素的唯一 HTML id。 */
  items: readonly HysAnchorItem[];
  /** 受控高亮的章节 id。 */
  modelValue?: string;
  /** 滚动容器元素或选择器。省略时监听页面。 */
  container?: HTMLElement | string;
  /** 固定头部占用的顶部高度，单位像素。 */
  offset?: number;
  /** 点击时平滑滚动，默认 true，遵从减少动态效果。 */
  smooth?: boolean;
  /** 目录的可访问名称，默认「章节导航」。 */
  ariaLabel?: string;
  /** 点击目录时添加 URL Hash，并响应浏览器前进、后退和 Hash 变动。 */
  syncHash?: boolean;
  /** 为含下级的章节提供收起和展开入口。 */
  collapsible?: boolean;
}
const props = withDefaults(defineProps<HysAnchorProps>(), { offset: 0, smooth: true, ariaLabel: "章节导航" });
const emit = defineEmits<{
  /** 点击或滚动选出当前章节时请求更新 id。 */
  "update:modelValue": [id: string];
  /** 点击目录链接后发出目标项。 */
  navigate: [item: HysAnchorItem];
}>();
defineSlots<{
  /** 目录项文案，提供条目及嵌套层级。 */
  item?: (scope: { item: HysAnchorItem; depth: number }) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const { effectiveMotion } = useMotion();
const current = ref("");
let target: ReturnType<typeof resolveScrollTarget>;
let frame = 0;
let active = false;
let observer: ResizeObserver | undefined;
let mutations: MutationObserver | undefined;
let observedSections = new Set<HTMLElement>();
let requestedHash: string | undefined;
const collapsed = ref(new Set<string>());
const rows = computed(() => {
  const result: { item: HysAnchorItem; depth: number; ancestors: readonly string[] }[] = [];
  const seen = new Set<string>();
  function visit(items: readonly HysAnchorItem[], ancestors: readonly string[]) {
    for (const item of items) {
      if (!item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      result.push({ item, depth: ancestors.length, ancestors });
      if (item.children?.length) visit(item.children, [...ancestors, item.id]);
    }
  }
  visit(props.items, []);
  return result;
});
const visible = computed(() => props.collapsible ? rows.value.filter(({ ancestors }) => ancestors.every(id => !collapsed.value.has(id))) : rows.value);
const visibleCurrent = computed(() => {
  const id = props.modelValue ?? current.value;
  if (!props.collapsible) return id;
  const row = rows.value.find(row => row.item.id === id);
  return row?.ancestors.find(parent => collapsed.value.has(parent)) ?? id;
});
function toggle(id: string) {
  if (collapsed.value.has(id)) collapsed.value.delete(id);
  else collapsed.value.add(id);
}
function element(id: string) {
  const node = document.getElementById(id);
  return node && (target instanceof HTMLElement ? target.contains(node) : true) ? node : undefined;
}
function choose(id: string) {
  if (current.value === id) return;
  current.value = id;
  if (props.modelValue !== id) emit("update:modelValue", id);
}
function read() {
  frame = 0;
  if (!active) return;
  if (target !== resolveScrollTarget(props.container)) {
    bind();
    return;
  }
  if (!target) {
    choose("");
    return;
  }
  const sections = rows.value.flatMap(({ item }) => {
    const node = element(item.id);
    return node instanceof HTMLElement ? [{ id: item.id, node }] : [];
  });
  const nodes = new Set(sections.map(({ node }) => node));
  for (const node of observedSections) if (!nodes.has(node) && node !== target) observer?.unobserve(node);
  for (const node of nodes) if (!observedSections.has(node) && node !== target) observer?.observe(node);
  observedSections = nodes;
  if (restoreHash()) return;

  const scroller = target instanceof HTMLElement ? target : document.scrollingElement;
  const edge = target instanceof HTMLElement ? target.getBoundingClientRect().top + target.clientTop : 0;
  const limit = scroller ? scroller.scrollHeight - scroller.clientHeight : 0;
  const atEnd = limit > 2 && scrollTargetTop(target) >= limit - 2;
  const offset = props.offset + 2;
  let first = { id: "", top: Infinity };
  let nearest = { id: "", top: -Infinity };
  for (const { id, node } of sections) {
    if (!node.getClientRects().length) continue;
    const top = node.getBoundingClientRect().top - edge;
    if (top < first.top) first = { id, top };
    if (top >= nearest.top && (atEnd || top <= offset)) nearest = { id, top };
  }
  choose(nearest.id || first.id);
}
function queue() { if (!frame) frame = requestAnimationFrame(read); }
function disconnect() {
  target?.removeEventListener("scroll", queue);
  observer?.disconnect();
  observer = undefined;
  observedSections.clear();
  mutations?.disconnect();
  mutations = undefined;
  window.removeEventListener("hashchange", readHash);
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}
function bind() {
  disconnect();
  if (!active) return;
  target = resolveScrollTarget(props.container);
  target?.addEventListener("scroll", queue, { passive: true });
  if (target && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(queue);
    observer.observe(target instanceof HTMLElement ? target : document.documentElement);
  }
  if (typeof MutationObserver !== "undefined") {
    const container = typeof props.container !== "string" && target instanceof HTMLElement ? target : document.body;
    mutations = new MutationObserver(queue);
    mutations.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["id", "hidden"] });
  }
  requestedHash = undefined;
  if (props.syncHash) {
    window.addEventListener("hashchange", readHash);
    readHash();
  }
  queue();
}
function start() { active = true; void nextTick(bind); }
function stop() { active = false; disconnect(); target = undefined; }
onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);
watch(() => [props.container, props.syncHash], () => nextTick(bind));
watch([rows, () => props.offset], () => { if (active) void nextTick(queue); });
function jump(id: string, node: HTMLElement, smooth: boolean) {
  if (!target) return;
  const edge = target instanceof HTMLElement ? target.getBoundingClientRect().top + target.clientTop : 0;
  scrollTargetTo(target, scrollTargetTop(target) + node.getBoundingClientRect().top - edge - props.offset, smooth);
  choose(id);
}
function readHash() {
  try {
    requestedHash = decodeURIComponent(window.location.hash.slice(1)) || undefined;
  } catch {
    requestedHash = undefined;
  }
  queue();
}
function restoreHash() {
  const id = requestedHash;
  if (!id) return false;
  const match = rows.value.find(row => row.item.id === id);
  const node = match && element(id);
  if (!match || !node?.getClientRects().length) return false;
  requestedHash = undefined;
  for (const parent of match.ancestors) collapsed.value.delete(parent);
  jump(id, node, false);
  return true;
}
function go(event: MouseEvent, item: HysAnchorItem) {
  if (!target || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  const node = element(item.id);
  if (!node) return;
  event.preventDefault();
  requestedHash = undefined;
  const hash = "#" + encodeURIComponent(item.id);
  if (props.syncHash && location.hash !== hash) history.pushState(history.state, "", hash);
  jump(item.id, node, props.smooth && effectiveMotion.value !== "off");
  emit("navigate", item);
}
</script>
<template>
  <nav v-bind="skin" class="hys-anchor" :aria-label="ariaLabel">
    <ul>
      <li v-for="{ item, depth } in visible" :key="item.id" :style="{ '--anchor-depth': depth }">
        <a :href="'#' + encodeURIComponent(item.id)" :aria-current="visibleCurrent === item.id ? 'location' : undefined" @click="go($event, item)">
          <slot name="item" :item="item" :depth="depth">{{ item.label }}</slot>
        </a>
        <HysButton v-if="collapsible && item.children?.length" variant="ghost" size="sm"
          :icon="collapsed.has(item.id) ? ChevronRight : ChevronDown" :aria-expanded="!collapsed.has(item.id)"
          :aria-label="(collapsed.has(item.id) ? '展开 ' : '收起 ') + item.label" @click="toggle(item.id)" />
      </li>
    </ul>
  </nav>
</template>
<style scoped>
ul { margin: 0; padding: 0; list-style: none; }
li { display: flex; align-items: center; }
a { display: block; flex: 1; min-inline-size: 0; border-inline-start: 2px solid var(--hys-ui-theme-border); padding: 6px 10px; padding-inline-start: calc(10px + 12px * var(--anchor-depth)); color: var(--hys-ui-theme-muted); text-decoration: none; overflow-wrap: anywhere; }
a:hover, a:focus-visible { color: var(--hys-ui-theme-primary); }
a[aria-current] { color: var(--hys-ui-theme-primary); border-inline-start-color: var(--hys-ui-theme-primary); font-weight: 600; }
</style>
