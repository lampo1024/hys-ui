import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watch,
} from "vue";
import {
  tableToken,
  tableValue,
  tableFilterPredicate,
  tableCompare,
  type HysTableProps,
  type HysTableKey,
  type HysTableColumn,
  type HysTableSort,
  type HysTableFilters,
  type HysTableFilterValue,
  type HysTableQuery,
  type TableNode,
} from "./table";
export function useTable<T extends object>(
  props: HysTableProps<T>,
  columns: () => readonly HysTableColumn<T>[],
  hasExpand: () => boolean,
  emit: (name: string, ...args: any[]) => void,
) {
  const live = ref(true),
    busy = computed(() => !!props.loading || !!props.disabled);
  const localSort = ref<HysTableSort[]>(
    Array.isArray(props.defaultSort)
      ? [...props.defaultSort]
      : props.defaultSort
        ? [props.defaultSort as HysTableSort]
        : props.defaultSort === undefined
          ? columns()
              .filter((c) => c.defaultSortOrder)
              .map((c) => ({ key: c.key, direction: c.defaultSortOrder! }))
          : [],
  );
  const localFilters = ref<HysTableFilters>({
      ...Object.fromEntries(
        columns()
          .filter((c) => c.defaultFilterValue)
          .map((c) => [c.key, [...c.defaultFilterValue!]]),
      ),
      ...props.defaultFilters,
    }),
    localPage = ref(1),
    localSize = ref(10);
  const ownSelected = ref<HysTableKey[]>([
      ...(props.defaultSelectedRowKeys ?? []),
    ]),
    ownExpanded = ref<HysTableKey[]>([...(props.defaultExpandedRowKeys ?? [])]);
  const ownCurrent = ref<HysTableKey | null>(
    props.defaultCurrentRowKey ?? null,
  );
  const cache = shallowRef(
    new Map<string, { row: T; rows: readonly T[]; override?: boolean }>(),
  );
  const pending = shallowRef(
    new Map<string, { row: T; controller: AbortController }>(),
  );
  const loadErrors = shallowRef(new Map<string, unknown>());
  let autoAttempted = new WeakSet<object>();
  const fallback = new WeakMap<object, string>();
  let ordinal = 0;
  function rowId(row: T): HysTableKey {
    const value =
      typeof props.rowKey === "function"
        ? props.rowKey(row)
        : tableValue(row, props.rowKey ?? "id");
    if (
      typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value))
    )
      return value;
    if (!fallback.has(row)) fallback.set(row, "@hys-table-row:" + ++ordinal);
    return fallback.get(row)!;
  }
  const graph = computed(() => {
    const roots: TableNode<T>[] = [],
      all: TableNode<T>[] = [],
      map = new Map<string, TableNode<T>>(),
      objects = new WeakSet<object>();
    const stack = [...props.rows].reverse().map((row) => ({
      row,
      parent: undefined as TableNode<T> | undefined,
      depth: 0,
    }));
    while (stack.length) {
      const { row, parent, depth } = stack.pop()!;
      if (!row || typeof row !== "object" || objects.has(row)) continue;
      objects.add(row);
      const key = rowId(row),
        token = tableToken(key);
      if (map.has(token)) continue;
      const raw = props.treeMode
          ? tableValue(row, props.childrenKey ?? "children")
          : undefined,
        stored = cache.value.get(token);
      const children: readonly T[] =
        stored?.row === row && stored.override
          ? stored.rows
          : Array.isArray(raw)
            ? raw
            : stored?.row === row
              ? stored.rows
              : [];
      const node: TableNode<T> = {
        row,
        key,
        token,
        index: all.length,
        depth,
        rootToken: parent?.rootToken ?? token,
        parent,
        children: [],
        lazy:
          !!props.treeMode &&
          !!props.loadChildren &&
          !Array.isArray(raw) &&
          stored?.row !== row &&
          !!tableValue(row, props.hasChildrenKey ?? "hasChildren"),
      };
      map.set(token, node);
      all.push(node);
      (parent?.children ?? roots).push(node);
      if (props.treeMode)
        for (let i = children.length - 1; i >= 0; i--)
          stack.push({ row: children[i], parent: node, depth: depth + 1 });
    }
    return { roots, all, map };
  });
  const selectedKeys = computed<HysTableKey[]>(() => [
    ...new Set(props.selectedRowKeys ?? ownSelected.value),
  ]);
  const selectedSet = computed(
    () => new Set(selectedKeys.value.map(tableToken)),
  );
  const expandedKeys = computed<HysTableKey[]>(() => [
    ...new Set(
      props.expandedRowKeys ??
        (props.defaultExpandAll && !expansionTouched.value
          ? graph.value.all
              .filter((n) => n.children.length || n.lazy || hasExpand())
              .map((n) => n.key)
          : ownExpanded.value),
    ),
  ]);
  const expansionTouched = ref(false),
    expandedSet = computed(() => new Set(expandedKeys.value.map(tableToken)));
  const selectedMemory = new Map<string, T>();
  watch(
    [selectedKeys, () => graph.value.all, () => props.reserveSelection],
    () => {
      for (const token of selectedMemory.keys())
        if (!selectedSet.value.has(token)) selectedMemory.delete(token);
      for (const key of selectedKeys.value) {
        const node = graph.value.map.get(tableToken(key));
        if (node) selectedMemory.set(node.token, node.row);
      }
      if (!props.reserveSelection) {
        const next = selectedKeys.value.filter((key) =>
          graph.value.map.has(tableToken(key)),
        );
        if (next.length !== selectedKeys.value.length)
          void requestSelection(next);
      }
      let nextCache:
        | Map<string, { row: T; rows: readonly T[]; override?: boolean }>
        | undefined;
      for (const [token, item] of cache.value)
        if (graph.value.map.get(token)?.row !== item.row) {
          nextCache ??= new Map(cache.value);
          nextCache.delete(token);
        }
      if (nextCache) cache.value = nextCache;
      for (const [token, item] of pending.value)
        if (graph.value.map.get(token)?.row !== item.row) abortRow(token);
    },
    { immediate: true },
  );
  const sorts = computed<HysTableSort[]>(() => {
    const list =
        props.sorts ??
        (props.sort !== undefined
          ? props.sort
            ? [props.sort]
            : []
          : localSort.value),
      seen = new Set<string>();
    return list
      .filter(
        (item) =>
          ["asc", "desc"].includes(item.direction) &&
          columns().some((c) => c.key === item.key && c.sortable) &&
          !seen.has(item.key) &&
          (seen.add(item.key), true),
      )
      .slice(0, props.multiSort ? undefined : 1)
      .sort(
        (a, b) =>
          (columns().find((c) => c.key === b.key)?.sortPriority ?? 0) -
          (columns().find((c) => c.key === a.key)?.sortPriority ?? 0),
      );
  });
  const filters = computed<HysTableFilters>(
    () => props.filters ?? localFilters.value,
  );
  const processed = computed(() => {
    const g = graph.value,
      keep = new Set<string>(),
      children = new Map<string, TableNode<T>[]>(),
      matches = tableFilterPredicate(filters.value, columns());
    if (!props.serverMode)
      for (let i = g.all.length - 1; i >= 0; i--) {
        const node = g.all[i];
        if (matches(node.row) || node.children.some((c) => keep.has(c.token)))
          keep.add(node.token);
      }
    const compare = tableCompare(sorts.value, columns());
    function group(nodes: readonly TableNode<T>[]) {
      const result = props.serverMode
        ? [...nodes]
        : nodes.filter((n) => keep.has(n.token));
      return props.serverMode || !sorts.value.length
        ? result
        : result.sort((a, b) => compare(a.row, b.row) || a.index - b.index);
    }
    for (const node of g.all)
      if (node.children.length) children.set(node.token, group(node.children));
    return { roots: group(g.roots), children };
  });
  const pagination = computed(() =>
    typeof props.pagination === "object" ? props.pagination : {},
  );
  const pageSize = computed(() => {
    const n = props.pageSize ?? pagination.value.pageSize ?? localSize.value;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10;
  });
  const total = computed(() =>
    props.serverMode
      ? Math.max(0, props.total ?? pagination.value.total ?? props.rows.length)
      : processed.value.roots.length,
  );
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value)),
  );
  const page = computed(() => {
    const n = props.page ?? pagination.value.page ?? localPage.value;
    return Math.min(
      pageCount.value,
      Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1),
    );
  });
  const pageRoots = computed(() =>
    !props.pagination || props.serverMode
      ? processed.value.roots
      : processed.value.roots.slice(
          (page.value - 1) * pageSize.value,
          page.value * pageSize.value,
        ),
  );
  const display = computed(() => {
    const result: TableNode<T>[] = [],
      stack = [...pageRoots.value].reverse();
    while (stack.length) {
      const node = stack.pop()!;
      result.push(node);
      if (
        expandedSet.value.has(node.token) ||
        (!props.serverMode &&
          Object.values(filters.value).some((v) => v.length))
      ) {
        const list = processed.value.children.get(node.token) ?? [];
        for (let i = list.length - 1; i >= 0; i--) stack.push(list[i]);
      }
    }
    return result;
  });
  const filteredRows = computed(() => {
    const result: T[] = [],
      stack = [...processed.value.roots].reverse();
    while (stack.length) {
      const n = stack.pop()!;
      result.push(n.row);
      const list = processed.value.children.get(n.token) ?? [];
      for (let i = list.length - 1; i >= 0; i--) stack.push(list[i]);
    }
    return result;
  });
  const currentKey = computed(() =>
    props.currentRowKey !== undefined ? props.currentRowKey : ownCurrent.value,
  );
  const currentRow = computed(() =>
    currentKey.value == null
      ? undefined
      : graph.value.map.get(tableToken(currentKey.value))?.row,
  );
  const halfSet = computed(() => {
    const half = new Set<string>();
    if (props.checkStrictly !== false) return half;
    for (let i = graph.value.all.length - 1; i >= 0; i--) {
      const node = graph.value.all[i];
      if (
        node.children.some(
          (n) => half.has(n.token) || selectedSet.value.has(n.token),
        ) &&
        !node.children
          .filter(eligible)
          .every((n) => selectedSet.value.has(n.token))
      )
        half.add(node.token);
    }
    return half;
  });
  function eligible(node: TableNode<T>) {
    return (
      props.selectable !== false &&
      props.getSelectionProps?.(node.row, node.index).disabled !== true &&
      (typeof props.selectable !== "function" ||
        props.selectable(node.row, node.index))
    );
  }
  const selectionPage = computed(() => {
    const result: TableNode<T>[] = [],
      stack = [...pageRoots.value].reverse();
    while (stack.length) {
      const node = stack.pop()!;
      if (eligible(node)) result.push(node);
      const children = processed.value.children.get(node.token) ?? [];
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
    }
    return result;
  });
  const allSelected = computed(
    () =>
      !!selectionPage.value.length &&
      selectionPage.value.every((n) => selectedSet.value.has(n.token)),
  );
  const someSelected = computed(
    () =>
      !allSelected.value &&
      selectionPage.value.some(
        (n) => selectedSet.value.has(n.token) || halfSet.value.has(n.token),
      ),
  );
  const query = computed<HysTableQuery<T>>(() => ({
    action: "page",
    page: page.value,
    pageSize: pageSize.value,
    sorts: sorts.value.map((s) => ({ ...s })),
    filters: Object.fromEntries(
      Object.entries(filters.value).map(([key, values]) => [key, [...values]]),
    ),
    currentData: filteredRows.value,
  }));
  function notify(
    action: HysTableQuery<T>["action"],
    changes: Partial<HysTableQuery<T>> = {},
  ) {
    const info = { ...query.value, ...changes, action };
    emit("queryChange", info);
    emit("change", info);
  }
  function requestPage(n: number, action: "page" | "pageSize" = "page") {
    if (busy.value || !live.value) return;
    const next = Math.max(1, Math.min(pageCount.value, Math.floor(n) || 1));
    localPage.value = next;
    emit("update:page", next);
    emit("pageChange", next);
    notify(action, { page: next });
  }
  function changeSize(n: number) {
    if (busy.value || !live.value || !Number.isFinite(n) || n < 1) return;
    localSize.value = Math.floor(n);
    localPage.value = 1;
    emit("update:pageSize", localSize.value);
    emit("pageSizeChange", localSize.value);
    emit("update:page", 1);
    emit("pageChange", 1);
    notify("pageSize", { page: 1, pageSize: localSize.value });
  }
  function setSort(value: HysTableSort | readonly HysTableSort[] | null) {
    if (busy.value || !live.value) return;
    const next = (
      Array.isArray(value) ? [...value] : value ? [value as HysTableSort] : []
    ).filter(
      (s) =>
        columns().some((c) => c.key === s.key && c.sortable) &&
        ["asc", "desc"].includes(s.direction),
    );
    localSort.value = props.multiSort ? next : next.slice(0, 1);
    if (props.multiSort)
      localSort.value.sort(
        (a, b) =>
          (columns().find((c) => c.key === b.key)?.sortPriority ?? 0) -
          (columns().find((c) => c.key === a.key)?.sortPriority ?? 0),
      );
    localPage.value = 1;
    emit("update:sort", localSort.value[0] ?? null);
    emit("update:sorts", localSort.value);
    emit("sortChange", localSort.value[0] ?? null, localSort.value);
    emit("update:page", 1);
    notify("sort", { sorts: localSort.value, page: 1 });
  }
  function toggleSort(column: HysTableColumn<T>, direction?: "asc" | "desc") {
    if (!column.sortable) return;
    const previous = sorts.value.find((s) => s.key === column.key)?.direction,
      orders = column.sortOrders?.length
        ? column.sortOrders
        : props.sortOrders?.length
          ? props.sortOrders
          : (["asc", "desc", null] as const);
    const next = direction
      ? previous === direction
        ? null
        : direction
      : orders[(orders.indexOf(previous ?? null) + 1) % orders.length];
    const list = props.multiSort
      ? sorts.value.filter((s) => s.key !== column.key)
      : [];
    if (next) list.push({ key: column.key, direction: next });
    setSort(list);
  }
  function requestFilters(value: HysTableFilters) {
    if (busy.value || !live.value) return;
    localFilters.value = value;
    localPage.value = 1;
    emit("update:filters", value);
    emit("filterChange", value);
    emit("update:page", 1);
    notify("filter", { filters: value, page: 1 });
  }
  function setFilter(key: string, values: readonly HysTableFilterValue[]) {
    if (!columns().some((c) => c.key === key)) return;
    requestFilters({ ...filters.value, [key]: [...values] });
  }
  function clearFilter(keys?: readonly string[]) {
    requestFilters(
      keys
        ? Object.fromEntries(
            Object.entries(filters.value).filter(
              ([key]) => !keys.includes(key),
            ),
          )
        : {},
    );
  }
  function find(value: T | HysTableKey) {
    return graph.value.map.get(
      tableToken(typeof value === "object" ? rowId(value) : value),
    );
  }
  function getSelectionRows() {
    return selectedKeys.value.flatMap((key) => {
      const token = tableToken(key),
        row =
          graph.value.map.get(token)?.row ??
          (props.reserveSelection ? selectedMemory.get(token) : undefined);
      return row ? [row] : [];
    });
  }
  async function requestSelection(next: readonly HysTableKey[]) {
    if (busy.value || !live.value) return false;
    const keys = [...new Set(next)];
    ownSelected.value = keys;
    emit("update:selectedRowKeys", keys);
    await nextTick();
    const accepted =
      live.value &&
      keys.length === selectedKeys.value.length &&
      keys.every((k) => selectedSet.value.has(tableToken(k)));
    if (accepted)
      emit("selectionChange", getSelectionRows(), selectedKeys.value);
    return accepted;
  }
  function cascade(set: Set<string>) {
    if (props.checkStrictly !== false || props.selectionType === "radio")
      return;
    for (let i = graph.value.all.length - 1; i >= 0; i--) {
      const n = graph.value.all[i],
        children = n.children.filter(eligible);
      if (!children.length || !eligible(n)) continue;
      if (children.every((c) => set.has(c.token))) set.add(n.token);
      else set.delete(n.token);
    }
  }
  let selectionAnchor: string | undefined;
  async function toggleRowSelection(
    value: T | HysTableKey,
    checked?: boolean,
    range = false,
  ) {
    const node = find(value);
    if (!node || !eligible(node) || busy.value) return false;
    const yes = checked ?? !selectedSet.value.has(node.token);
    if (props.selectionType === "radio") {
      const accepted = await requestSelection(yes ? [node.key] : []);
      if (accepted) emit("select", getSelectionRows(), node.row, yes);
      return accepted;
    }
    const start =
        range && props.rangeSelection
          ? display.value.findIndex((n) => n.token === selectionAnchor)
          : -1,
      end = display.value.findIndex((n) => n.token === node.token),
      rangeNodes =
        start >= 0 && end >= 0
          ? display.value.slice(Math.min(start, end), Math.max(start, end) + 1)
          : [node],
      next = new Set(selectedSet.value),
      stack = [...rangeNodes],
      visited = new Set<string>();
    while (stack.length) {
      const item = stack.pop()!;
      if (visited.has(item.token)) continue;
      visited.add(item.token);
      if (eligible(item)) yes ? next.add(item.token) : next.delete(item.token);
      if (props.checkStrictly === false) stack.push(...item.children);
    }
    cascade(next);
    const keys = [
      ...new Map([
        ...selectedKeys.value
          .filter((k) => next.has(tableToken(k)))
          .map((k) => [tableToken(k), k] as const),
        ...graph.value.all
          .filter((n) => next.has(n.token))
          .map((n) => [n.token, n.key] as const),
      ]).values(),
    ];
    const accepted = await requestSelection(keys);
    if (accepted) {
      selectionAnchor = node.token;
      emit("select", getSelectionRows(), node.row, yes);
      if (rangeNodes.length > 1)
        emit(
          "selectRange",
          getSelectionRows(),
          rangeNodes.filter(eligible).map((n) => n.row),
          yes,
        );
    }
    return accepted;
  }
  async function toggleAllSelection(checked?: boolean) {
    if (props.selectionType === "radio") return false;
    const yes =
        checked ??
        (someSelected.value && props.selectOnIndeterminate === false
          ? false
          : !allSelected.value),
      next = new Set(selectedSet.value);
    for (const node of selectionPage.value)
      yes ? next.add(node.token) : next.delete(node.token);
    cascade(next);
    const keys = [
      ...new Map([
        ...selectedKeys.value
          .filter((k) => next.has(tableToken(k)))
          .map((k) => [tableToken(k), k] as const),
        ...graph.value.all
          .filter((n) => next.has(n.token))
          .map((n) => [n.token, n.key] as const),
      ]).values(),
    ];
    const accepted = await requestSelection(keys);
    if (accepted) emit("selectAll", getSelectionRows(), yes);
    return accepted;
  }
  async function invertSelection() {
    if (props.selectionType === "radio" || busy.value || !live.value)
      return false;
    const next = new Set(selectedSet.value);
    // Toggle leaves in linked trees, then derive parent state once.
    for (const node of selectionPage.value)
      if (props.checkStrictly !== false || !node.children.some(eligible))
        next.has(node.token) ? next.delete(node.token) : next.add(node.token);
    cascade(next);
    const keys = [
      ...new Map([
        ...selectedKeys.value
          .filter((k) => next.has(tableToken(k)))
          .map((k) => [tableToken(k), k] as const),
        ...graph.value.all
          .filter((n) => next.has(n.token))
          .map((n) => [n.token, n.key] as const),
      ]).values(),
    ];
    const accepted = await requestSelection(keys);
    if (accepted) emit("selectInvert", getSelectionRows(), selectedKeys.value);
    return accepted;
  }
  async function setCurrentRow(value?: T | HysTableKey | null) {
    if (busy.value || !live.value) return false;
    const node = value == null ? undefined : find(value);
    if (value != null && !node) return false;
    const previous = currentRow.value;
    ownCurrent.value = node?.key ?? null;
    emit("update:currentRowKey", ownCurrent.value);
    await nextTick();
    const accepted = live.value && currentKey.value === (node?.key ?? null);
    if (accepted && currentRow.value !== previous)
      emit("currentChange", currentRow.value, previous);
    return accepted;
  }
  function abortRow(token: string) {
    const item = pending.value.get(token);
    if (!item) return;
    item.controller.abort();
    autoAttempted.delete(item.row);
    const next = new Map(pending.value);
    next.delete(token);
    pending.value = next;
  }
  async function loadRow(value: T | HysTableKey, force = false) {
    const node = find(value),
      loader = props.loadChildren;
    if (
      !node ||
      !loader ||
      !props.treeMode ||
      busy.value ||
      !live.value ||
      pending.value.has(node.token)
    )
      return false;
    if (!force && !node.lazy && cache.value.has(node.token)) return true;
    autoAttempted.add(node.row);
    const request = { row: node.row, controller: new AbortController() };
    pending.value = new Map(pending.value).set(node.token, request);
    const errors = new Map(loadErrors.value);
    errors.delete(node.token);
    loadErrors.value = errors;
    try {
      const rows = await loader(node.row, {
        signal: request.controller.signal,
        key: node.key,
        depth: node.depth,
      });
      if (
        !live.value ||
        request.controller.signal.aborted ||
        pending.value.get(node.token) !== request ||
        graph.value.map.get(node.token)?.row !== node.row ||
        props.loadChildren !== loader
      )
        return false;
      if (!Array.isArray(rows))
        throw new TypeError("loadChildren must return an array");
      cache.value = new Map(cache.value).set(node.token, {
        row: node.row,
        rows: rows as readonly T[],
      });
      emit("load", node.row, rows);
      return true;
    } catch (error) {
      if (
        live.value &&
        !request.controller.signal.aborted &&
        pending.value.get(node.token) === request
      ) {
        loadErrors.value = new Map(loadErrors.value).set(node.token, error);
        emit("loadError", node.row, error);
      }
      return false;
    } finally {
      if (pending.value.get(node.token) === request) {
        const next = new Map(pending.value);
        next.delete(node.token);
        pending.value = next;
      }
    }
  }
  function canExpand(node: TableNode<T>) {
    return (
      props.rowExpandable?.(node.row) !== false &&
      (node.children.length > 0 ||
        node.lazy ||
        !!props.expandable ||
        hasExpand())
    );
  }
  async function updateKeyChildren(
    value: T | HysTableKey,
    children: readonly T[],
  ) {
    const node = find(value);
    if (
      !node ||
      !props.treeMode ||
      busy.value ||
      !live.value ||
      !Array.isArray(children)
    )
      return false;
    abortRow(node.token);
    autoAttempted.add(node.row);
    const record = { row: node.row, rows: [...children], override: true };
    cache.value = new Map(cache.value).set(node.token, record);
    const errors = new Map(loadErrors.value);
    errors.delete(node.token);
    loadErrors.value = errors;
    await nextTick();
    if (
      !live.value ||
      cache.value.get(node.token) !== record ||
      graph.value.map.get(node.token)?.row !== node.row
    )
      return false;
    emit("childrenChange", node.row, record.rows);
    return true;
  }
  async function toggleRowExpansion(
    value: T | HysTableKey,
    expanded?: boolean,
  ) {
    const node = find(value);
    if (!node || !canExpand(node) || busy.value || !live.value) return false;
    const yes = expanded ?? !expandedSet.value.has(node.token),
      next = expandedKeys.value.filter((k) => tableToken(k) !== node.token);
    if (yes) next.push(node.key);
    expansionTouched.value = true;
    ownExpanded.value = next;
    emit("update:expandedRowKeys", next);
    await nextTick();
    const accepted = live.value && expandedSet.value.has(node.token) === yes;
    if (!accepted) return false;
    emit("expandChange", node.row, yes, expandedKeys.value);
    if (!yes) abortRow(node.token);
    return true;
  }
  function cleanup() {
    live.value = false;
    for (const token of [...pending.value.keys()]) abortRow(token);
  }
  watch(
    () => props.loadChildren,
    () => {
      for (const token of [...pending.value.keys()]) abortRow(token);
      cache.value = new Map();
      loadErrors.value = new Map();
      autoAttempted = new WeakSet();
    },
  );
  watch(busy, (value) => {
    if (value) for (const token of [...pending.value.keys()]) abortRow(token);
  });
  watch(
    [expandedKeys, () => graph.value.all, () => pending.value.size, live, busy],
    () => {
      if (!live.value || busy.value) return;
      let remaining = Math.max(0, 4 - pending.value.size);
      for (const node of graph.value.all) {
        if (!remaining) break;
        if (
          node.lazy &&
          expandedSet.value.has(node.token) &&
          !autoAttempted.has(node.row) &&
          !loadErrors.value.has(node.token) &&
          props.rowExpandable?.(node.row) !== false
        ) {
          remaining--;
          void loadRow(node.key);
        }
      }
    },
    { immediate: true, flush: "post" },
  );
  onActivated(() => (live.value = true));
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return {
    live,
    busy,
    graph,
    rowId,
    selectedKeys,
    selectedSet,
    expandedKeys,
    expandedSet,
    halfSet,
    eligible,
    allSelected,
    someSelected,
    sorts,
    filters,
    processed,
    filteredRows,
    display,
    page,
    pageSize,
    total,
    pagination,
    currentKey,
    currentRow,
    query,
    pending,
    loadErrors,
    canExpand,
    toggleSort,
    setSort,
    setFilter,
    clearFilter,
    requestPage,
    changeSize,
    toggleRowSelection,
    toggleAllSelection,
    invertSelection,
    clearSelection: () => requestSelection([]),
    getSelectionRows,
    getHalfSelectionRows: () =>
      graph.value.all
        .filter((n) => halfSet.value.has(n.token))
        .map((n) => n.row),
    setCurrentRow,
    toggleRowExpansion,
    loadRow,
    updateKeyChildren,
    find,
  };
}
