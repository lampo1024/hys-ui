<script setup lang="ts">
import { computed, toRaw, type Component } from "vue";
import { LoaderCircle } from "lucide-vue-next";
import TabsSlot from "../TabsSlot/TabsSlot";
import HysButton from "../../HysButton/HysButton.vue";
import type {
  HysTabContent,
  HysTabItem,
  HysTabPanelScope,
  HysTabsSlots,
  HysTabValue,
} from "../tabsTypes";
import type { TabDeclaration } from "../tabsItems";
import type { useTabsPanels } from "../useTabsPanels";

const props = defineProps<{
  items: readonly HysTabItem[];
  declarations: readonly TabDeclaration[];
  slots: HysTabsSlots;
  active: HysTabValue;
  panels: ReturnType<typeof useTabsPanels>;
  panelId: (value: HysTabValue) => string;
  tabId: (value: HysTabValue) => string;
  declarative: boolean;
  forcePanels: boolean;
}>();
const panes = computed(
  () =>
    new Map(props.declarations.map((entry) => [entry.item.value, entry.slots])),
);
const hasPanels = computed(
  () =>
    props.declarative ||
    props.forcePanels ||
    props.slots.panel ||
    props.items.some(
      (item) => item.content !== undefined || item.component || item.load,
    ),
);
function context(item: HysTabItem): HysTabPanelScope {
  const resource = props.panels.loaded.get(item.value);
  return {
    item,
    active: props.active === item.value,
    loading: !!item.load && (!resource || resource.state === "loading"),
    error: resource?.error,
    content: getContent(item),
    reload: () => props.panels.reload(item.value),
  };
}
function getContent(item: HysTabItem): HysTabContent | undefined {
  return item.load
    ? props.panels.loaded.get(item.value)?.content
    : item.component
      ? { component: item.component, props: item.componentProps }
      : item.content;
}
function component(content: HysTabContent | undefined) {
  return content && typeof content !== "string"
    ? toRaw(
        "component" in content && content.component
          ? content.component
          : (content as Component),
      )
    : undefined;
}
function componentProps(content: HysTabContent | undefined) {
  return content && typeof content === "object" && "component" in content
    ? content.props
    : undefined;
}
</script>

<template>
  <template v-if="hasPanels">
    <template v-for="item in items" :key="item.value">
      <div
        v-if="panels.render(item)"
        v-show="active === item.value"
        :id="panelId(item.value)"
        :aria-labelledby="tabId(item.value)"
        class="hys-ui-tab-panel"
        :class="item.panelClass"
        :style="item.panelStyle"
        :data-active="active === item.value"
        :aria-busy="context(item).loading || undefined"
        role="tabpanel"
        :tabindex="item.panelTabIndex ?? 0"
      >
        <div
          :key="panels.versions.get(item.value) ?? 0"
          class="hys-tab-panel-body"
        >
          <template v-for="scope in [context(item)]" :key="0">
            <div
              v-if="scope.loading"
              class="hys-tab-panel-message"
              role="status"
            >
              <TabsSlot :render="panes.get(item.value)?.loading ?? slots.loading" :scope="scope"
                ><LoaderCircle
                  :size="17"
                  class="hys-tab-spinner"
                  aria-hidden="true"
                />
                正在加载页签…</TabsSlot
              >
            </div>
            <div
              v-else-if="panels.loaded.get(item.value)?.state === 'error'"
              class="hys-tab-panel-message"
              role="alert"
            >
              <TabsSlot :render="panes.get(item.value)?.error ?? slots.error" :scope="scope">
                <span>页签加载失败。</span>
                <HysButton size="sm" variant="secondary" @click="scope.reload()"
                  >重试</HysButton
                >
              </TabsSlot>
            </div>
            <TabsSlot
              v-else-if="panes.get(item.value)?.default || slots.panel"
              :render="panes.get(item.value)?.default ?? slots.panel"
              :scope="scope"
            />
            <template v-else>
              <template v-for="content in [getContent(item)]" :key="0">
                <component
                  v-if="component(content)"
                  :is="component(content)"
                  v-bind="componentProps(content) ?? {}"
                />
                <template
                  v-else-if="typeof content === 'string' && content !== ''"
                  >{{ content }}</template
                >
                <div v-else class="hys-tab-panel-message">
                  <TabsSlot :render="panes.get(item.value)?.empty ?? slots.empty" :scope="scope"
                    >暂无页签内容</TabsSlot
                  >
                </div>
              </template>
            </template>
          </template>
        </div>
      </div>
    </template>
  </template>
  <div
    v-else-if="slots.default && items.some((item) => item.value === active)"
    :id="panelId(active)"
    class="hys-ui-tab-panel"
    role="tabpanel"
    :aria-labelledby="tabId(active)"
    tabindex="0"
    data-active="true"
  >
    <TabsSlot :render="slots.default" :scope="{ active }" />
  </div>
</template>
