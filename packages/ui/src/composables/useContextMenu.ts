import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type CSSProperties,
  type Ref,
} from "vue";
import { popupSize } from "../motion/popup";
import { useChoiceModel } from "./choiceModel";
import { useHysControlState } from "./formContext";
import { useFloating, type FloatingAnchor } from "./useFloating";
import {
  menuRows,
  menuKeys,
  menuKeysEqual,
  menuToken,
  type HysContextMenuProps,
  type HysMenuKey,
  type MenuRow,
  type HysMenuShowOptions,
  type HysMenuSelectInfo,
} from "./menu";
export function useContextMenu<N extends object>(
  props: HysContextMenuProps<N>,
  root: Ref<HTMLElement | undefined>,
  layer: Ref<HTMLElement | undefined>,
  panel: Ref<HTMLElement | undefined>,
  id: string,
  emit: (name: string, ...args: any[]) => void,
) {
  const control = useHysControlState(props),
    live = ref(true),
    suspended = ref(false),
    graph = computed(() => menuRows(props.items, props.fieldNames)),
    busy = computed(() => control.disabled.value || !!props.loading),
    triggers = computed(() =>
      Array.isArray(props.trigger)
        ? props.trigger
        : [props.trigger ?? "contextmenu"],
    );
  const openModel = useChoiceModel(
      {
        get modelValue() {
          return props.open;
        },
      },
      () => !!props.defaultOpen,
    ),
    pathModel = useChoiceModel(
      {
        get modelValue() {
          return props.openPath;
        },
      },
      () => menuKeys(props.defaultOpenPath),
      menuKeysEqual,
    ),
    checkedModel = useChoiceModel(
      {
        get modelValue() {
          return props.checkedKeys;
        },
      },
      () =>
        menuKeys(
          props.defaultCheckedKeys ??
            graph.value.all
              .filter(
                (row) =>
                  row.checked && ["checkbox", "radio"].includes(row.type),
              )
              .map((row) => row.key!),
        ),
      menuKeysEqual,
    ),
    selectedModel = useChoiceModel(
      {
        get modelValue() {
          return props.selectedKeys;
        },
      },
      () =>
        menuKeys(props.defaultSelectedKeys).slice(
          0,
          props.multiple ? undefined : 1,
        ),
      menuKeysEqual,
    );
  const checkedKeys = computed(() => menuKeys(checkedModel.current.value)),
    selectedKeys = computed(() => menuKeys(selectedModel.current.value)),
    checkedSet = computed(() => new Set(checkedKeys.value.map(menuToken))),
    selectedSet = computed(() => new Set(selectedKeys.value.map(menuToken)));
  const branches = computed(() => {
      const result: MenuRow<N>[] = [];
      let rows = graph.value.roots;
      for (const key of pathModel.current.value) {
        const row = rows.find(
          (row) => row.key === key && row.children.length && !row.disabled,
        );
        if (!row) break;
        result.push(row);
        rows = row.children;
      }
      return result;
    }),
    menus = computed(() => [
      graph.value.roots,
      ...(props.loading ? [] : branches.value.map((row) => row.children)),
    ]),
    openPath = computed(() => branches.value.map((row) => row.key!));
  const active = ref(new Map<number, HysMenuKey>()),
    point = shallowRef<{ x: number; y: number }>(),
    previous = shallowRef<HTMLElement>(),
    focusableChild = ref(false),
    childStyles = shallowRef<Record<number, CSSProperties>>({}),
    elements = new Map<number, HTMLElement>();
  const layoutWaiters = new Set<(ready: boolean) => void>();
  let restoring = false,
    autofocus = true,
    sequence = 0,
    layoutFrame = 0,
    rootUpdate = false,
    observer: ResizeObserver | undefined,
    showTimer: ReturnType<typeof setTimeout> | undefined,
    hideTimer: ReturnType<typeof setTimeout> | undefined,
    submenuTimer: ReturnType<typeof setTimeout> | undefined,
    searchTimer: ReturnType<typeof setTimeout> | undefined,
    search = "";
  const delay = (value: number | undefined, fallback: number) =>
    Number.isFinite(value) ? Math.max(0, Math.min(2000, value!)) : fallback;
  const anchor = computed<FloatingAnchor | undefined>(() =>
    root.value
      ? {
          getBoundingClientRect() {
            if (point.value)
              return {
                x: point.value.x,
                y: point.value.y - 7,
                left: point.value.x,
                top: point.value.y - 7,
                right: point.value.x + 1,
                bottom: point.value.y - 6,
                width: 1,
                height: 1,
                toJSON() {
                  return {};
                },
              } as DOMRect;
            return (
              root.value!.firstElementChild ?? root.value!
            ).getBoundingClientRect();
          },
          contains: (node) =>
            !!root.value?.contains(node) || !!layer.value?.contains(node),
          focus: () => focusTrigger(),
          get isConnected() {
            return !!root.value?.isConnected;
          },
        }
      : undefined,
  );
  const floating = useFloating(anchor, panel, {
    gap: 6,
    padding: 8,
    closeOnTab: false,
    get placement() {
      return point.value ? "bottom-start" : (props.placement ?? "bottom-start");
    },
    width: () => props.width,
    requestOpen(value, restore) {
      void requestOpen(value, restore);
      return false;
    },
  });
  const open = floating.open;
  function itemElement(row: MenuRow<N>) {
    const element = document.getElementById(id + "-item-" + row.id);
    return element instanceof HTMLElement && layer.value?.contains(element)
      ? element
      : undefined;
  }
  function focusTrigger() {
    const target =
      previous.value?.isConnected && previous.value !== document.body
        ? previous.value
        : (root.value?.querySelector<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])',
          ) ?? root.value);
    restoring = true;
    try {
      target?.focus({ preventScroll: true });
    } finally {
      restoring = false;
    }
  }
  function focus() {
    const target =
      root.value?.querySelector<HTMLElement>(
        'button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])',
      ) ?? root.value;
    target?.focus({ preventScroll: true });
  }
  function context(row: MenuRow<N>) {
    return {
      item: row.raw,
      value: row.key,
      label: row.label,
      path: row.path,
      keys: row.keys,
      level: row.level,
      disabled: row.disabled || busy.value,
      checked:
        row.key !== undefined && checkedSet.value.has(menuToken(row.key)),
      selected:
        row.key !== undefined && selectedSet.value.has(menuToken(row.key)),
      expanded: branches.value.some((branch) => branch.id === row.id),
      submenu: !!row.children.length,
    };
  }
  function enabled(rows: readonly MenuRow<N>[]) {
    return rows.filter(
      (row) => row.type !== "divider" && row.type !== "group" && !row.disabled,
    );
  }
  function setActive(row: MenuRow<N>, focus = false) {
    if (row.disabled || row.key === undefined || busy.value) return;
    active.value = new Map(active.value).set(row.level, row.key);
    if (focus) itemElement(row)?.focus({ preventScroll: true });
    if (focus) itemElement(row)?.scrollIntoView?.({ block: "nearest" });
  }
  function first(level = menus.value.length - 1, last = false) {
    if (busy.value) {
      elements
        .get(level)
        ?.querySelector<HTMLElement>('[role="menu"]')
        ?.focus({ preventScroll: true });
      return;
    }
    const options = enabled(menus.value[level] ?? []),
      row = last ? options.at(-1) : options[0];
    if (row) setActive(row, true);
    else
      elements
        .get(level)
        ?.querySelector<HTMLElement>('[role="menu"]')
        ?.focus({ preventScroll: true });
  }
  function tabbable(row: MenuRow<N>) {
    const key = active.value.get(row.level),
      options = enabled(menus.value[row.level] ?? []);
    return !busy.value &&
      !row.disabled &&
      (key === row.key ||
        (!options.some((r) => r.key === key) && options[0] === row))
      ? 0
      : -1;
  }
  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    clearTimeout(submenuTimer);
    clearTimeout(searchTimer);
    search = "";
  }
  function scheduleLayout(updateRoot = false) {
    if (!open.value || !live.value) return;
    rootUpdate ||= updateRoot;
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(async () => {
      layoutFrame = 0;
      const waiting = [...layoutWaiters];
      layoutWaiters.clear();
      if (!open.value || !live.value) {
        waiting.forEach((resolve) => resolve(false));
        return;
      }
      if (rootUpdate) {
        rootUpdate = false;
        floating.update();
        await nextTick();
      }
      const vw = document.documentElement.clientWidth,
        vh = document.documentElement.clientHeight,
        styles: Record<number, CSSProperties> = {};
      branches.value.forEach((branch, index) => {
        const parent = itemElement(branch),
          child = elements.get(index + 1),
          body = parent?.closest<HTMLElement>(".hys-ui-menu-body");
        if (!parent || !child) return;
        const a = parent.getBoundingClientRect(),
          b = popupSize(child),
          bounds = body?.getBoundingClientRect();
        if (bounds && (a.bottom <= bounds.top || a.top >= bounds.bottom)) {
          void setPath(openPath.value.slice(0, index));
          return;
        }
        const width = Math.min(b.width, Math.max(0, vw - 16)),
          height = Math.min(b.height, Math.max(0, vh - 16));
        let x = props.direction === "rtl" ? a.left - width - 6 : a.right + 6;
        if (x + width > vw - 8) x = a.left - width - 6;
        if (x < 8 && a.right + 6 + width <= vw - 8) x = a.right + 6;
        styles[index + 1] = {
          position: "fixed",
          left: Math.max(8, Math.min(x, vw - width - 8)) + "px",
          top: Math.max(8, Math.min(a.top - 5, vh - height - 8)) + "px",
          visibility: "visible",
          zIndex: Number(floating.style.value.zIndex) + index + 1,
        };
      });
      if (JSON.stringify(childStyles.value) !== JSON.stringify(styles))
        childStyles.value = styles;
      await nextTick();
      waiting.forEach((resolve) => resolve(open.value && live.value));
    });
  }
  function layoutReady() {
    if (!open.value || !live.value) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      layoutWaiters.add(resolve);
      scheduleLayout();
    });
  }
  function forceHide() {
    if (suspended.value && !open.value) return;
    suspended.value = true;
    clearTimers();
    sequence++;
    floating.close(false, true);
    if (openModel.current.value) emit("update:open", false);
  }
  function setPanel(level: number, element?: HTMLElement) {
    const previous = elements.get(level);
    if (previous === element) return;
    if (previous && previous !== element) observer?.unobserve(previous);
    if (element) {
      elements.set(level, element);
      observer?.observe(element);
    } else elements.delete(level);
    if (!level) panel.value = element;
    scheduleLayout(true);
  }
  async function syncOpen() {
    if (
      !live.value ||
      suspended.value ||
      control.disabled.value ||
      !openModel.current.value
    ) {
      floating.close(false, true);
      return;
    }
    const wasOpen = open.value;
    await floating.show(true);
    if (!open.value || !live.value) return;
    if (!wasOpen) {
      if (typeof ResizeObserver !== "undefined") {
        observer?.disconnect();
        observer = new ResizeObserver(() => scheduleLayout(true));
        elements.forEach((el) => observer!.observe(el));
      }
      scheduleLayout(true);
      if (autofocus && props.autofocus !== false) {
        if (branches.value.length) await layoutReady();
        else await nextTick();
        if (open.value && live.value) first();
      }
    }
  }
  async function requestOpen(value: boolean, restore = false) {
    if (!live.value || (value && control.disabled.value)) return false;
    if (!value) clearTimers();
    if (openModel.current.value !== value)
      await openModel.commit(
        value,
        (next) => emit("update:open", next),
        () => {},
      );
    await syncOpen();
    if (open.value === value && !value && restore) focusTrigger();
    return open.value === value;
  }
  async function show(event?: MouseEvent | KeyboardEvent | HysMenuShowOptions) {
    if (!live.value || control.disabled.value) return false;
    sequence++;
    suspended.value = false;
    clearTimers();
    autofocus = true;
    previous.value =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : root.value;
    if (event && "preventDefault" in event) {
      event.preventDefault();
      point.value =
        event instanceof MouseEvent && event.type === "contextmenu"
          ? { x: event.clientX, y: event.clientY }
          : undefined;
    } else {
      point.value =
        event && Number.isFinite(event.x) && Number.isFinite(event.y)
          ? { x: event.x!, y: event.y! }
          : undefined;
      autofocus = event?.focus !== false;
    }
    const accepted = await requestOpen(true);
    if (accepted) {
      scheduleLayout(true);
      if (autofocus && props.autofocus !== false) await nextTick(() => first());
    }
    return accepted;
  }
  async function setPath(keys: readonly HysMenuKey[], focusChild = false) {
    if (!live.value || busy.value) return false;
    const ticket = sequence,
      next = menuKeys(keys);
    if (menuKeysEqual(next, pathModel.current.value)) {
      if (focusChild && (await layoutReady())) first(next.length);
      return true;
    }
    const accepted = await pathModel.commit(
      next,
      (value) => emit("update:openPath", value),
      (value) => emit("openPathChange", value),
    );
    if (accepted && open.value && live.value && ticket === sequence) {
      await nextTick();
      scheduleLayout(true);
      if (focusChild && (await layoutReady()) && ticket === sequence)
        first(branches.value.length);
    }
    return accepted && menuKeysEqual(openPath.value, next);
  }
  async function openSubmenu(key: HysMenuKey, focusChild = true) {
    const row = graph.value.byKey.get(menuToken(key));
    if (!row || row.disabled || !row.children.length || !open.value)
      return false;
    clearTimeout(submenuTimer);
    return setPath(row.keys, focusChild);
  }
  async function focusItem(key: HysMenuKey) {
    const row = graph.value.byKey.get(menuToken(key));
    if (!row || row.disabled || busy.value || !live.value) return false;
    if (!open.value && !(await show())) return false;
    if (!(await setPath(row.parents.map((p) => p.key!)))) return false;
    if (!(await layoutReady())) return false;
    setActive(row, true);
    return !!itemElement(row);
  }
  async function setCheckedKeys(keys: readonly HysMenuKey[]) {
    if (busy.value || !live.value) return false;
    return checkedModel.commit(
      menuKeys(keys),
      (value) => emit("update:checkedKeys", value),
      (value) => emit("checkedChange", value),
    );
  }
  async function setSelectedKeys(keys: readonly HysMenuKey[]) {
    if (busy.value || !live.value) return false;
    return selectedModel.commit(
      menuKeys(keys).slice(0, props.multiple ? undefined : 1),
      (value) => emit("update:selectedKeys", value),
      (value) => emit("selectionChange", value),
    );
  }
  async function choose(row: MenuRow<N>, event?: MouseEvent | KeyboardEvent) {
    if (
      !live.value ||
      busy.value ||
      row.disabled ||
      row.key === undefined ||
      !open.value ||
      graph.value.byKey.get(menuToken(row.key)) !== row
    ) {
      event?.preventDefault();
      return false;
    }
    if (row.children.length) {
      event?.preventDefault();
      return openSubmenu(row.key);
    }
    const ticket = sequence,
      checkable = ["checkbox", "radio"].includes(row.type);
    let checks = checkedKeys.value,
      selected = selectedKeys.value,
      checked: boolean | undefined;
    if (checkable) {
      checked =
        row.type === "radio" || !checkedSet.value.has(menuToken(row.key));
      const group = menuToken(row.radioGroup ?? "@hys-menu-radio");
      checks = checks.filter(
        (key) =>
          key !== row.key &&
          !(
            row.type === "radio" &&
            (() => {
              const other = graph.value.byKey.get(menuToken(key));
              return (
                other?.type === "radio" &&
                menuToken(other.radioGroup ?? "@hys-menu-radio") === group
              );
            })()
          ),
      );
      if (checked) checks.push(row.key);
    } else if (props.selectable)
      selected = props.multiple
        ? selectedSet.value.has(menuToken(row.key))
          ? selected.filter((k) => k !== row.key)
          : [...selected, row.key]
        : [row.key];
    const info: HysMenuSelectInfo<N> = {
      item: row.raw,
      path: row.path,
      keys: row.keys,
      event,
      checked,
      checkedKeys: checks,
      selectedKeys: selected,
    };
    const checkChanged = checkable && !menuKeysEqual(checks, checkedKeys.value),
      selectionChanged =
        !checkable &&
        !!props.selectable &&
        !menuKeysEqual(selected, selectedKeys.value);
    let accepted = true;
    if (checkChanged)
      accepted = await checkedModel.commit(
        checks,
        (next) => emit("update:checkedKeys", next),
        () => emit("select", row.key, info),
        true,
      );
    else if (selectionChanged)
      accepted = await selectedModel.commit(
        selected,
        (next) => emit("update:selectedKeys", next),
        () => emit("select", row.key, info),
        true,
      );
    else emit("select", row.key, info);
    if (!accepted || !live.value) return false;
    if (checkChanged) emit("checkedChange", checkedKeys.value, info);
    else if (selectionChanged)
      emit("selectionChange", selectedKeys.value, info);
    if (
      (row.closeOnSelect ?? (!checkable && props.hideOnClick !== false)) &&
      ticket === sequence
    )
      await requestOpen(false, true);
    return true;
  }
  function inside(node: EventTarget | null) {
    return (
      node instanceof Node &&
      (!!root.value?.contains(node) || !!layer.value?.contains(node))
    );
  }
  function hoverRoot(value: boolean, event?: PointerEvent) {
    if (!triggers.value.includes("hover") || event?.pointerType === "touch")
      return;
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (value) {
      if (!open.value)
        showTimer = setTimeout(
          () => void show({ focus: false }),
          delay(props.showDelay, 120),
        );
    } else if (!inside(event?.relatedTarget ?? null))
      hideTimer = setTimeout(
        () => void requestOpen(false),
        delay(props.hideDelay, 180),
      );
  }
  function enterPanel() {
    clearTimeout(hideTimer);
    clearTimeout(submenuTimer);
  }
  function hoverRow(row: MenuRow<N>) {
    clearTimeout(hideTimer);
    clearTimeout(submenuTimer);
    if (props.submenuTrigger === "click" || row.disabled || busy.value) return;
    setActive(row);
    submenuTimer = setTimeout(
      () => {
        if (!open.value || graph.value.byKey.get(menuToken(row.key!)) !== row)
          return;
        void setPath(
          row.children.length ? row.keys : row.parents.map((p) => p.key!),
        );
      },
      delay(props.submenuDelay, 160),
    );
  }
  function triggerClick(event: MouseEvent) {
    if (
      !event.defaultPrevented &&
      triggers.value.includes("click") &&
      event.button === 0
    )
      void (open.value ? requestOpen(false) : show(event));
  }
  function contextmenu(event: MouseEvent) {
    if (triggers.value.includes("contextmenu")) void show(event);
  }
  function triggerFocus(event: FocusEvent) {
    if (
      triggers.value.includes("focus") &&
      !restoring &&
      !floating.restoringFocus.value &&
      !inside(event.relatedTarget)
    )
      void show({ focus: false });
  }
  function focusOut(event: FocusEvent) {
    if (triggers.value.includes("focus") && !inside(event.relatedTarget))
      void requestOpen(false);
  }
  function triggerKey(event: KeyboardEvent) {
    if (event.isComposing || !triggers.value.length) return;
    if (
      event.key === "ContextMenu" ||
      (event.shiftKey && event.key === "F10")
    ) {
      if (triggers.value.includes("contextmenu")) void show(event);
      return;
    }
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      void show(event).then((ok) => {
        if (ok) first(0, event.key === "ArrowUp");
      });
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === root.value &&
      !triggers.value.includes("contextmenu")
    ) {
      event.preventDefault();
      void (open.value ? requestOpen(false) : show(event));
    } else if (event.key === "Tab" && open.value) void requestOpen(false);
  }
  async function tab(event: KeyboardEvent) {
    const nodes = Array.from(
      layer.value?.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter(
      (el) =>
        el.tabIndex >= 0 &&
        el.getClientRects().length &&
        getComputedStyle(el).visibility !== "hidden" &&
        !el.closest("[inert]"),
    );
    if (
      document.activeElement !== (event.shiftKey ? nodes[0] : nodes.at(-1)) &&
      nodes.length
    )
      return;
    event.preventDefault();
    if (!(await requestOpen(false, true)) || event.shiftKey) return;
    const nodesOutside = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (el) =>
        el.tabIndex >= 0 &&
        el.getClientRects().length &&
        !el.closest("[inert]"),
    );
    const index = nodesOutside.indexOf(document.activeElement as HTMLElement);
    if (index >= 0) nodesOutside[index + 1]?.focus();
  }
  function keyboard(level: number, event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === "Tab") {
      void tab(event);
      return;
    }
    if (
      (event.target as Element).closest(
        'input,textarea,select,[contenteditable="true"]',
      )
    )
      return;
    const options = enabled(menus.value[level] ?? []),
      target = (event.target as Element).closest<HTMLElement>(
        "[data-hys-menu-item]",
      ),
      index = options.findIndex((row) => itemElement(row) === target),
      row = options[index];
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      let next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : index + (event.key === "ArrowUp" ? -1 : 1);
      next =
        props.loopNavigation === false
          ? Math.max(0, Math.min(next, options.length - 1))
          : (next + options.length) % options.length;
      if (options[next]) setActive(options[next], true);
    } else if (
      event.key === (props.direction === "rtl" ? "ArrowLeft" : "ArrowRight")
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (row?.children.length) void openSubmenu(row.key!);
    } else if (
      event.key === (props.direction === "rtl" ? "ArrowRight" : "ArrowLeft")
    ) {
      event.preventDefault();
      event.stopPropagation();
      const parent = branches.value[level - 1];
      if (parent)
        void setPath(openPath.value.slice(0, level - 1)).then((ok) => {
          if (ok) setActive(parent, true);
        });
    } else if (event.key === "Enter" || event.key === " ") {
      if (row) {
        event.preventDefault();
        event.stopPropagation();
        itemElement(row)?.click();
      }
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      search += event.key.toLocaleLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => (search = ""), 500);
      const query = [...search].every((char) => char === search[0])
        ? search[0]
        : search;
      for (let offset = 1; offset <= options.length; offset++) {
        const candidate =
          options[(index + offset + options.length) % options.length];
        if (candidate.label.toLocaleLowerCase().startsWith(query)) {
          event.preventDefault();
          setActive(candidate, true);
          break;
        }
      }
    }
  }
  function measureTrigger() {
    focusableChild.value = !!root.value?.querySelector(
      'button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])',
    );
  }
  function cleanup() {
    live.value = false;
    suspended.value = true;
    sequence++;
    clearTimers();
    observer?.disconnect();
    observer = undefined;
    cancelAnimationFrame(layoutFrame);
    layoutFrame = 0;
    layoutWaiters.forEach((resolve) => resolve(false));
    layoutWaiters.clear();
    floating.close(false, true);
    if (openModel.current.value) emit("update:open", false);
  }
  watch([openModel.current, control.disabled, live], () => void syncOpen(), {
    immediate: true,
    flush: "post",
  });
  watch(
    control.disabled,
    (value) => {
      if (value) forceHide();
    },
    { flush: "sync" },
  );
  watch(
    () => props.open,
    (value) => {
      if (value) suspended.value = false;
    },
  );
  watch(open, (value) => {
    emit("visibleChange", value);
    if (!value) {
      sequence++;
      clearTimers();
      observer?.disconnect();
      if (pathModel.isLive()) void setPath([]);
    }
  });
  watch(
    [menus, busy],
    async () => {
      if (!open.value) return;
      const focused = document.activeElement as HTMLElement | null,
        within = !!focused && !!layer.value?.contains(focused),
        level = Number(
          focused?.closest<HTMLElement>("[data-level]")?.dataset.level ?? 0,
        );
      await nextTick();
      if (
        within &&
        open.value &&
        (!layer.value?.contains(document.activeElement) ||
          (document.activeElement as HTMLElement | null)?.getAttribute(
            "aria-disabled",
          ) === "true")
      )
        first(Math.min(level, menus.value.length - 1));
    },
    { flush: "pre" },
  );
  watch(
    [menus, () => props.placement, () => props.direction],
    () => {
      void nextTick(() => scheduleLayout(true));
    },
    { flush: "post" },
  );
  // Root placement changes need flyout layout only; never feed style writes back into positioning.
  watch(floating.style, () => scheduleLayout(false));
  watch(
    () => props.loading,
    () => {
      if (props.loading) clearTimers();
    },
  );
  onMounted(() => {
    measureTrigger();
    void syncOpen();
  });
  onActivated(() => {
    live.value = true;
    measureTrigger();
  });
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return {
    control,
    live,
    busy,
    graph,
    triggers,
    open,
    branches,
    menus,
    openPath,
    checkedKeys,
    selectedKeys,
    context,
    tabbable,
    active,
    childStyles,
    floating,
    forceHide,
    focusableChild,
    measureTrigger,
    setPanel,
    scheduleLayout,
    show,
    hide: (restore = false) => requestOpen(false, restore),
    focus,
    toggle: () => (open.value ? requestOpen(false) : show()),
    focusItem,
    openSubmenu,
    closeSubmenus: () => setPath([]),
    setCheckedKeys,
    setSelectedKeys,
    choose,
    setActive,
    hoverRoot,
    enterPanel,
    hoverRow,
    triggerClick,
    contextmenu,
    triggerFocus,
    focusOut,
    triggerKey,
    keyboard,
    first,
    setPath,
    getItems: () =>
      graph.value.all
        .filter((row) => row.type !== "group" && row.type !== "divider")
        .map((row) => row.raw),
  };
}
