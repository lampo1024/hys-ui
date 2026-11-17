import { computed, nextTick, ref, watch, type Ref } from "vue";
import { useChoiceModel } from "../../composables/choiceModel";
import {
  menuKeys,
  menuKeysEqual,
  menuRows,
  menuToken,
  type HysMenuKey,
  type MenuRow,
} from "../../composables/menu";
import type {
  NavigationMenuItem,
  NavigationMenuProps,
  NavigationMenuSelection,
} from "./menuTypes";

type Row = MenuRow<NavigationMenuItem>;
type Event = MouseEvent | KeyboardEvent;
const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase();

export function useMenuNavigation(
  props: NavigationMenuProps,
  root: Readonly<Ref<HTMLElement | null>>,
  disabled: Readonly<Ref<boolean>>,
  listeners: {
    select(key: HysMenuKey, context: NavigationMenuSelection): void;
    expand(keys: readonly HysMenuKey[]): void;
    selectKeys(keys: readonly HysMenuKey[]): void;
  },
) {
  const graph = computed(() => menuRows(props.items, { value: "key" }));
  const query = computed(() => normalize(props.search?.trim() ?? ""));
  const searchClosed = ref(new Set<string>());
  const matched = computed(() => {
    if (!query.value) return undefined;
    const found = new Set<Row>();
    for (const row of graph.value.all) {
      if (row.type !== "item") continue;
      const keywords = "keywords" in row.raw ? (row.raw.keywords ?? []) : [];
      if (
        ![row.label, ...keywords].some((text) =>
          normalize(text).includes(query.value),
        )
      )
        continue;
      found.add(row);
      for (const parent of row.parents) found.add(parent);
      const descendants = [...row.children];
      while (descendants.length) {
        const child = descendants.pop()!;
        found.add(child);
        for (const descendant of child.children) descendants.push(descendant);
      }
    }
    return found;
  });
  watch(query, () => {
    searchClosed.value = new Set();
  });
  const isShown = (row: Row) => matched.value?.has(row) ?? true;
  const hasChildren = (row: Row) => row.children.some(isShown);
  const selected = useChoiceModel(
    {
      get modelValue() {
        return props.selectedKeys;
      },
    },
    () => menuKeys(props.defaultSelectedKeys),
    menuKeysEqual,
  );
  const expanded = useChoiceModel(
    {
      get modelValue() {
        return props.openKeys;
      },
    },
    () => menuKeys(props.defaultOpenKeys),
    menuKeysEqual,
  );
  const selectedSet = computed(
    () => new Set(menuKeys(selected.current.value).map(menuToken)),
  );
  const openSet = computed(
    () => new Set(menuKeys(expanded.current.value).map(menuToken)),
  );
  const active = ref<string>();

  function isSelected(row: Row) {
    return row.key !== undefined && selectedSet.value.has(menuToken(row.key));
  }
  function isOpen(row: Row) {
    if (matched.value)
      return hasChildren(row) && !searchClosed.value.has(row.id);
    return row.key !== undefined && openSet.value.has(menuToken(row.key));
  }
  function isDisabled(row: Row) {
    return disabled.value || row.disabled;
  }
  const visible = computed(() =>
    disabled.value
      ? []
      : graph.value.all.filter(
          (row) =>
            !row.disabled &&
            isShown(row) &&
            row.key !== undefined &&
            row.type === "item" &&
            row.parents.every(isOpen),
        ),
  );
  const tabId = computed(() => {
    const rows = visible.value;
    return (
      rows.find((row) => row.id === active.value)?.id ??
      rows.find(isSelected)?.id ??
      rows[0]?.id
    );
  });

  function toggle(row: Row, open = !isOpen(row)) {
    if (!hasChildren(row) || isDisabled(row) || row.key === undefined)
      return Promise.resolve(false);
    if (matched.value) {
      if (open) searchClosed.value.delete(row.id);
      else searchClosed.value.add(row.id);
      return Promise.resolve(true);
    }
    let keys = menuKeys(expanded.current.value).filter(
      (key) => key !== row.key,
    );
    if (open) {
      if (props.accordion) {
        const parent = row.parents.at(-1);
        const siblings = new Set(
          graph.value.all.filter(
            (candidate) =>
              candidate !== row &&
              candidate.parents.at(-1) === parent &&
              candidate.children.length,
          ),
        );
        const blockingKeys = new Set(
          graph.value.all
            .filter(
              (candidate) =>
                siblings.has(candidate) ||
                candidate.parents.some((ancestor) => siblings.has(ancestor)),
            )
            .map((candidate) => candidate.key),
        );
        keys = keys.filter((key) => !blockingKeys.has(key));
      }
      keys.push(row.key);
    }
    return expanded.commit(keys, listeners.expand, () => {});
  }

  function choose(row: Row, event: Event) {
    if (isDisabled(row) || row.key === undefined) {
      event.preventDefault();
      return;
    }
    if (hasChildren(row)) {
      event.preventDefault();
      void toggle(row);
      return;
    }
    const keys =
      props.selectionMode === "multiple" && props.mode === "actions"
        ? isSelected(row)
          ? menuKeys(selected.current.value).filter((key) => key !== row.key)
          : menuKeys([...selected.current.value, row.key])
        : [row.key];
    void selected.commit(keys, listeners.selectKeys, () => {});
    listeners.select(row.key, { item: row.raw, path: row.path, event });
  }

  function element(id: string) {
    return Array.from(
      root.value?.querySelectorAll<HTMLElement>("[data-hys-menubar-row]") ?? [],
    ).find((node) => node.dataset.hysMenubarRow === id);
  }

  function focusRow(row: Row | undefined) {
    if (row) {
      active.value = row.id;
      const node = element(row.id);
      node?.focus({ preventScroll: true });
      node?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    } else if (props.mode === "actions") root.value?.focus();
  }

  function focus(edge: "first" | "last" = "first") {
    focusRow(edge === "last" ? visible.value.at(-1) : visible.value[0]);
  }

  let typed = "";
  let typedAt = 0;

  watch(
    visible,
    (rows, prior) => {
      if (!active.value || rows.some((row) => row.id === active.value)) return;
      const previous = prior.find((row) => row.id === active.value);
      const focused = root.value?.ownerDocument.activeElement;
      if (focused && element(active.value) === focused) {
        const replacement =
          previous?.parents
            .slice()
            .reverse()
            .find((parent) => rows.includes(parent)) ?? rows[0];
        void nextTick(() => focusRow(replacement));
      }
      active.value = undefined;
    },
    { flush: "sync" },
  );

  async function keydown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing
    )
      return;
    const rows = visible.value;
    if (!rows.length) return;
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-hys-menubar-row]")
        : null;
    const index = rows.findIndex(
      (row) => row.id === target?.dataset.hysMenubarRow,
    );
    const row = rows[index];
    const rtl = root.value && getComputedStyle(root.value).direction === "rtl";
    const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
    const backKey = rtl ? "ArrowRight" : "ArrowLeft";

    if (
      event.key === "Home" ||
      event.key === "End" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    ) {
      event.preventDefault();
      if (event.key === "Home") focusRow(rows[0]);
      else if (event.key === "End") focusRow(rows.at(-1));
      else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const next =
          index < 0
            ? direction === 1
              ? 0
              : rows.length - 1
            : (index + direction + rows.length) % rows.length;
        focusRow(rows[next]);
      }
      return;
    }
    if (event.key === expandKey && row && hasChildren(row)) {
      event.preventDefault();
      const open = isOpen(row) || (await toggle(row, true));
      if (open) {
        await nextTick();
        focusRow(visible.value.find((item) => item.parents.at(-1) === row));
      }
    } else if (event.key === backKey && row) {
      const parent = row.parents.at(-1);
      if (hasChildren(row) && isOpen(row)) {
        event.preventDefault();
        await toggle(row, false);
      } else if (parent) {
        event.preventDefault();
        await toggle(parent, false);
        focusRow(parent);
      }
    } else if (
      props.mode === "actions" &&
      event.key === " " &&
      target?.localName === "a"
    ) {
      event.preventDefault();
      target.click();
    } else if (event.key !== " " && Array.from(event.key).length === 1) {
      const letter = normalize(event.key);
      if (event.timeStamp - typedAt > 650) typed = "";
      typedAt = event.timeStamp;
      typed = typed === letter ? letter : typed + letter;
      const candidates = rows.slice(index + 1).concat(rows.slice(0, index + 1));
      const match = candidates.find((item) =>
        normalize(item.label).startsWith(typed),
      );
      if (match) {
        event.preventDefault();
        focusRow(match);
      }
    }
  }

  return {
    graph,
    active,
    visible,
    tabId,
    choose,
    isOpen,
    isShown,
    hasChildren,
    isSelected,
    isDisabled,
    focus,
    keydown,
  };
}
