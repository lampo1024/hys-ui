import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  type Component,
} from "vue";
import type { HysContextMenuInstance } from "../../composables/menu";
import type TabsPrompts from "./TabsPrompts/TabsPrompts.vue";
import type { TabsEmit } from "./tabsTypes";

export function useTabsOverlays(emit: TabsEmit) {
  const menu = ref<HysContextMenuInstance>();
  const prompts = ref<InstanceType<typeof TabsPrompts>>();
  const menuComponent = shallowRef<Component>();
  const promptComponent = shallowRef<Component>();
  let live = true,
    request = 0;
  async function showMenu(point: { x: number; y: number }) {
    const ticket = ++request;
    try {
      if (!menuComponent.value) {
        const component = await import("../HysContextMenu/HysContextMenu.vue");
        if (!live || ticket !== request) return;
        menuComponent.value = component.default;
      }
      await nextTick();
      if (live && ticket === request) await menu.value?.show(point);
    } catch (error) {
      if (live && ticket === request) emit("guardError", error);
    }
  }
  function closeMenu() {
    request++;
    void menu.value?.hide();
  }
  async function prompt() {
    try {
      if (!promptComponent.value) {
        const component = await import("./TabsPrompts/TabsPrompts.vue");
        if (!live) return;
        promptComponent.value = component.default;
      }
      await nextTick();
      return live ? prompts.value : undefined;
    } catch (error) {
      if (live) emit("guardError", error);
    }
  }
  function stop() {
    live = false;
    closeMenu();
  }
  onActivated(() => {
    live = true;
  });
  onDeactivated(stop);
  onBeforeUnmount(stop);
  return {
    menu,
    prompts,
    menuComponent,
    promptComponent,
    showMenu,
    closeMenu,
    prompt,
  };
}
