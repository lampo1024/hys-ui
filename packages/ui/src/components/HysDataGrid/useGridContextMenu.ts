import { nextTick, shallowRef, useTemplateRef } from "vue";
import type {
  HysContextMenuInstance,
  HysContextMenuItem,
  HysMenuKey,
  HysMenuSelectInfo,
} from "../../composables/menu";
import type {
  HysDataGridContext,
  HysDataGridContextMenu,
} from "./gridPresentation";

export function useGridContextMenu<T extends object>(options: {
  enabled: (context: HysDataGridContext<T>) => boolean;
  config: () => HysDataGridContextMenu<T> | undefined;
  defaults: (context: HysDataGridContext<T>) => readonly HysContextMenuItem[];
  select: (
    value: HysMenuKey,
    context: HysDataGridContext<T>,
    info: HysMenuSelectInfo,
  ) => void;
}) {
  const menu = useTemplateRef<HysContextMenuInstance>("gridContextMenu");
  const context = shallowRef<HysDataGridContext<T>>();
  const items = shallowRef<readonly HysContextMenuItem[]>([]);
  let sequence = 0;

  async function open(
    target: HysDataGridContext<T>,
    event: MouseEvent | KeyboardEvent,
  ) {
    const config = options.config();
    if (event.defaultPrevented || !config || !options.enabled(target)) return;
    const defaults = options.defaults(target);
    const entries =
      typeof config === "function" ? config(target, defaults) : defaults;
    if (
      !entries ||
      !entries.some(
        (item) =>
          !item.hidden && item.type !== "divider" && item.type !== "group",
      )
    )
      return;
    event.preventDefault();
    const anchor = event.currentTarget as HTMLElement;
    const rect = anchor.getBoundingClientRect();
    const pointer =
      event instanceof MouseEvent &&
      (event.detail > 0 ||
        (event.type === "contextmenu" &&
          (event.button === 2 || event.clientX !== 0 || event.clientY !== 0)));
    const x = pointer
      ? event.clientX
      : rect.left + Math.min(rect.width / 2, 28);
    const y = pointer ? event.clientY : rect.bottom;
    const ticket = ++sequence;
    if (
      pointer &&
      !anchor.contains(anchor.ownerDocument.activeElement) &&
      (anchor.tabIndex >= 0 || anchor.hasAttribute("tabindex"))
    )
      anchor.focus({ preventScroll: true });
    context.value = target;
    items.value = entries;
    await nextTick();
    if (ticket === sequence && options.enabled(target))
      await menu.value?.showAt(x, y);
  }
  function keydown(target: HysDataGridContext<T>, event: KeyboardEvent) {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
      void open(target, event);
  }
  function select(value: HysMenuKey, info: HysMenuSelectInfo) {
    const target = context.value;
    if (target && options.enabled(target)) options.select(value, target, info);
  }
  function close() {
    sequence++;
    if (menu.value?.open) void menu.value.hide(false);
  }
  return { items, open, keydown, select, close };
}
