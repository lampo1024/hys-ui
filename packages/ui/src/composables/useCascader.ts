import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
} from "vue";
import { useTreeSelect, type HysTreeSelectStore } from "./useTreeSelect";
import { treeKey, type HysTreeKey, type HysTreeRecord } from "./tree";
import type {
  HysTreeSelectProps,
  HysTreeSelectValue,
  HysTreeSelectChange,
} from "./treeSelect";
import {
  cascaderEntries,
  cascaderToken,
  cascaderPath,
  validCascaderPath,
  cascaderWords,
  type CascaderEntry,
  type HysCascaderProps,
  type HysCascaderValue,
  type HysCascaderKey,
  type HysCascaderPath,
  type HysCascaderItem,
  type HysCascaderChange,
} from "./cascader";
export function useCascader<N extends object>(
  props: HysCascaderProps<N>,
  disabled: ComputedRef<boolean>,
  active: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
) {
  const live = ref(true),
    own = shallowRef<HysCascaderValue>(
      props.defaultValue ??
        (props.emitPath === false && !props.multiple ? null : []),
    ),
    ownPath = shallowRef<HysCascaderKey[]>([
      ...(props.defaultExpandedPath ?? []),
    ]),
    rootData = shallowRef<readonly N[]>(),
    rootPending = ref(false),
    rootError = shallowRef<unknown>(),
    checking = ref(false),
    engineRef = shallowRef<HysTreeSelectStore<CascaderEntry<N>>>();
  const multiple = computed(() => !!props.multiple),
    current = computed(() =>
      props.modelValue === undefined ? own.value : props.modelValue,
    ),
    blocked = computed(
      () =>
        !live.value || disabled.value || !!props.readonly || !!props.loading,
    ),
    words = computed(() => ({
      ...cascaderWords,
      ...props.locale,
      search:
        props.searchPlaceholder ?? props.locale?.search ?? cascaderWords.search,
      empty: props.emptyText ?? props.locale?.empty ?? cascaderWords.empty,
      noMatch:
        props.noMatchText ?? props.locale?.noMatch ?? cascaderWords.noMatch,
      loading:
        props.loadingText ?? props.locale?.loading ?? cascaderWords.loading,
    })),
    anyLevel = computed(
      () =>
        !!props.checkStrictly || (!multiple.value && !!props.changeOnSelect),
    );
  const forest = computed(() =>
      cascaderEntries(rootData.value ?? props.options, props),
    ),
    cached = computed(() => cascaderEntries(props.cacheData ?? [], props));
  const entries = computed(() => {
    const map = new Map(cached.value.map);
    for (const [key, entry] of forest.value.map) map.set(key, entry);
    if (engineRef.value)
      for (const row of engineRef.value.tree.index.value.rows)
        map.set(String(row.key), row.node);
    return map;
  });
  const byValue = computed(() => {
    const map = new Map<HysCascaderKey, CascaderEntry<N>>();
    for (const entry of entries.value.values())
      if (!map.has(entry.path.at(-1)!)) map.set(entry.path.at(-1)!, entry);
    const actual = engineRef.value?.tree.index.value.rows.map(
        (row) => row.node,
      ) ?? [...forest.value.map.values()],
      seen = new Set<HysCascaderKey>();
    for (const entry of actual) {
      const value = entry.path.at(-1)!;
      if (!seen.has(value)) {
        map.set(value, entry);
        seen.add(value);
      }
    }
    return map;
  });
  const resolvedPaths = new Map<HysCascaderKey, HysCascaderKey[]>();
  function resolvePath(value: HysCascaderKey) {
    const entry = byValue.value.get(value);
    if (entry) resolvedPaths.set(value, entry.path);
    return entry?.path ?? resolvedPaths.get(value) ?? [value];
  }
  function pathsFor(value: HysCascaderValue | undefined): HysCascaderKey[][] {
    if (
      props.clearValue !== undefined &&
      JSON.stringify(value) === JSON.stringify(props.clearValue)
    )
      return [];
    if (props.emitPath === false) {
      const values = multiple.value
        ? Array.isArray(value)
          ? value
          : treeKey(value)
            ? [value]
            : []
        : treeKey(value)
          ? [value]
          : [];
      return values.filter(treeKey).map(resolvePath);
    }
    if (multiple.value)
      return Array.isArray(value)
        ? value
            .filter(validCascaderPath)
            .filter((path) => path.length)
            .map((path) => [...path])
        : [];
    return validCascaderPath(value) && value.length ? [[...value]] : [];
  }
  const selectedPaths = computed(() => pathsFor(current.value)),
    modelKeys = computed(() => selectedPaths.value.map(cascaderToken)),
    browsing = computed(() => [...(props.expandedPath ?? ownPath.value)]);
  const expandedKeys = computed(() =>
    browsing.value.map((_, i) => cascaderToken(browsing.value.slice(0, i + 1))),
  );
  const loadMethod = computed(() =>
    props.loadChildren
      ? async (entry: CascaderEntry<N>, context: { signal: AbortSignal }) => {
          const children = await props.loadChildren!(entry.raw, {
            signal: context.signal,
            path: [...entry.path],
            nodes: [...entry.nodes],
            level: entry.path.length - 1,
          });
          if (!Array.isArray(children))
            throw new TypeError("loadChildren must resolve to an array");
          return cascaderEntries(children, props, entry).roots;
        }
      : undefined,
  );
  function output(value: HysTreeSelectValue) {
    const keys = Array.isArray(value)
        ? value
        : typeof value === "string" && value
          ? [value]
          : [],
      paths = keys
        .filter((key): key is string => typeof key === "string")
        .map(cascaderPath)
        .filter((path) => path.length);
    if (!paths.length && props.clearValue !== undefined)
      return props.clearValue;
    return multiple.value
      ? props.emitPath === false
        ? paths.map((path) => path.at(-1)!)
        : paths
      : props.emitPath === false
        ? (paths[0]?.at(-1) ?? null)
        : (paths[0] ?? []);
  }
  function item(key: string): HysCascaderItem<N> {
    const cachedItem = engineRef.value?.item(key),
      entry = entries.value.get(key) ?? cachedItem?.node,
      path = entry?.path ?? cascaderPath(key),
      labels = entry?.labels ?? path.map(String);
    return {
      path: [...path],
      labels: [...labels],
      nodes: [...(entry?.nodes ?? [])],
      node: entry?.raw,
      value: path.at(-1)!,
      label:
        props.showAllLevels === false
          ? (labels.at(-1) ?? "")
          : labels.join(props.separator ?? " / "),
      disabled: !!(entry?.disabled || cachedItem?.disabled),
      missing: !engineRef.value?.tree.index.value.map.has(key),
    };
  }
  function info(
    value: HysTreeSelectChange<CascaderEntry<N>>,
  ): HysCascaderChange<N> {
    const keys = value.values.filter(
      (key): key is string => typeof key === "string",
    );
    return {
      reason: value.reason,
      node: value.node?.raw,
      items: keys.map(item),
      paths: keys.map(cascaderPath),
      halfCheckedPaths: value.halfCheckedKeys.map((key) =>
        cascaderPath(String(key)),
      ),
      event: value.event,
    };
  }
  let actionEpoch = 0,
    navigationEpoch = 0;
  function acceptExpanded(keys: readonly HysTreeKey[]) {
    const previous = [...browsing.value],
      epoch = actionEpoch;
    const paths = keys
        .map((key) => cascaderPath(String(key)))
        .sort((a, b) => b.length - a.length),
      path = paths[0] ?? [];
    if (props.expandedPath === undefined) ownPath.value = path;
    emit("update:expandedPath", path);
    emit(
      "expandChange",
      path,
      path.flatMap((_, i) => {
        const node = entries.value.get(
          cascaderToken(path.slice(0, i + 1)),
        )?.raw;
        return node ? [node] : [];
      }),
    );
    void nextTick().then(() => {
      if (
        !live.value ||
        epoch !== actionEpoch ||
        cascaderToken(browsing.value) !== cascaderToken(path)
      )
        return;
      const prefixes = (value: HysCascaderPath) =>
        value.map((_, i) => cascaderToken(value.slice(0, i + 1)));
      const before = new Set(prefixes(previous)),
        after = new Set(prefixes(path));
      for (const [keys, other, name] of [
        [before, after, "node-collapse"],
        [after, before, "node-expand"],
      ] as const) {
        for (const key of keys) {
          const row = engineRef.value?.tree.index.value.map.get(key);
          if (!other.has(key) && row?.hasChildren)
            emit(name, row.node.raw, { path: [...row.node.path] });
        }
      }
    });
  }
  const engineProps: HysTreeSelectProps<CascaderEntry<N>> = {
    get nodes() {
      return forest.value.roots;
    },
    get cacheData() {
      return cached.value.roots;
    },
    get modelValue() {
      return multiple.value ? modelKeys.value : (modelKeys.value[0] ?? "");
    },
    get multiple() {
      return multiple.value;
    },
    get checkable() {
      return multiple.value;
    },
    get checkStrictly() {
      return props.checkStrictly;
    },
    get showCheckedStrategy() {
      return props.showCheckedStrategy ?? "child";
    },
    get disabled() {
      return disabled.value;
    },
    get readonly() {
      return props.readonly;
    },
    get loading() {
      return props.loading;
    },
    get multipleLimit() {
      return props.multipleLimit;
    },
    get searchValue() {
      return props.searchValue;
    },
    get defaultSearchValue() {
      return props.defaultSearchValue;
    },
    get expandedKeys() {
      return expandedKeys.value;
    },
    autoExpandParent: true,
    accordion: true,
    get loadChildren() {
      return loadMethod.value;
    },
    get validateEvent() {
      return props.validateEvent;
    },
  };
  const engine = useTreeSelect(
    engineProps,
    disabled,
    active,
    (name, ...args) => {
      if (name === "update:modelValue") {
        const value = output(args[0]);
        if (props.modelValue === undefined) own.value = value;
        emit(name, value);
      } else if (name === "change" || name === "value-change") {
        emit(name, output(args[0]), info(args[1]));
        if (
          name === "value-change" &&
          props.clearSearchAfterSelect !== false &&
          !props.retainSearch
        )
          engine.filter("");
      } else if (name === "update:expandedKeys") acceptExpanded(args[0]);
      else if (name === "load" || name === "children-loaded") {
        const event = args[0];
        emit(name, {
          node: event.node.raw,
          path: [...event.node.path],
          children: event.children.map((entry: CascaderEntry<N>) => entry.raw),
        });
      } else if (name === "load-error")
        emit(name, {
          node: args[0].node.raw,
          path: [...args[0].node.path],
          error: args[0].error,
        });
      else if (name === "node-expand" || name === "node-collapse")
        emit(name, args[0].raw, { path: [...args[0].path] });
      else if (name === "remove-tag")
        emit(name, cascaderPath(String(args[0])), args[1]?.raw);
      else if (
        ["update:searchValue", "search", "clear", "limit"].includes(name)
      )
        emit(name, ...args);
    },
    validate,
  );
  engineRef.value = engine;
  const items = computed(() =>
      engine.items.value.map((entry) => item(String(entry.value))),
    ),
    columns = computed(() => {
      const result: CascaderEntry<N>[][] = [forest.value.roots];
      for (let i = 0; i < browsing.value.length; i++) {
        const row = engine.tree.index.value.map.get(
          cascaderToken(browsing.value.slice(0, i + 1)),
        );
        if (!row?.hasChildren) break;
        result.push(
          row.children.map((key) => engine.tree.index.value.map.get(key)!.node),
        );
      }
      return result;
    });
  async function expandPath(path: HysCascaderPath) {
    if (blocked.value || !active.value) return false;
    const epoch = actionEpoch,
      navigation = ++navigationEpoch;
    // Load each missing level in order; a controlled host may reject expansion.
    for (let i = 0; i < path.length; i++) {
      const token = cascaderToken(path.slice(0, i + 1)),
        row = engine.tree.index.value.map.get(token);
      if (!row || row.disabled) return false;
      const keys = path
        .slice(0, i + 1)
        .map((_, n) => cascaderToken(path.slice(0, n + 1)));
      await engine.tree.setExpandedKeys(keys);
      if (
        !live.value ||
        epoch !== actionEpoch ||
        navigation !== navigationEpoch ||
        !active.value ||
        !engine.tree.expanded.value.has(token)
      )
        return false;
      if (row.hasChildren && props.loadChildren) {
        const ok = await engine.tree.load(token);
        if (
          !ok ||
          epoch !== actionEpoch ||
          navigation !== navigationEpoch ||
          !active.value ||
          !live.value
        )
          return false;
      }
    }
    if (!path.length) {
      await engine.tree.setExpandedKeys([]);
      return (
        epoch === actionEpoch &&
        navigation === navigationEpoch &&
        browsing.value.length === 0
      );
    }
    return cascaderToken(browsing.value) === cascaderToken(path);
  }
  async function ensureDescendants(key: string, epoch: number) {
    let queue = [key],
      visited = new Set<string>();
    while (queue.length) {
      const batch = queue.splice(0, 4).filter((key) => !visited.has(key));
      for (const key of batch) visited.add(key);
      const ok = await Promise.all(
        batch.map(async (key) => {
          let row = engine.tree.index.value.map.get(key);
          if (!row || row.disabled) return true;
          if (row.hasChildren && !row.children.length && !props.loadChildren)
            return false;
          if (row.hasChildren && !row.children.length && props.loadChildren) {
            if (!(await engine.tree.load(key))) return false;
            row = engine.tree.index.value.map.get(key);
          }
          if (row) queue.push(...row.children.map(String));
          return true;
        }),
      );
      if (
        ok.some((value) => !value) ||
        !active.value ||
        !live.value ||
        epoch !== actionEpoch
      )
        return false;
    }
    return true;
  }
  async function pick(key: string, event?: Event, checked?: boolean) {
    let row = engine.tree.index.value.map.get(key);
    if (!row || row.disabled || blocked.value || checking.value) return false;
    const epoch = actionEpoch;
    if (multiple.value) {
      if (
        !props.checkStrictly &&
        row.hasChildren &&
        !engine.tree.checked.value.has(key)
      ) {
        checking.value = true;
        try {
          if (!(await ensureDescendants(key, epoch))) return false;
        } finally {
          checking.value = false;
        }
        row = engine.tree.index.value.map.get(key);
        if (!row) return false;
      }
      if (
        checked !== undefined &&
        checked === engine.tree.checked.value.has(key)
      )
        return false;
      return engine.pick(row, event);
    }
    if (row.hasChildren && !anyLevel.value) {
      await expandPath(row.node.path);
      return false;
    }
    const ok = await engine.request([key], "select", row.node, event);
    if (ok) emit("select", [...row.node.path], [...row.node.nodes], event);
    return ok;
  }
  function removeTag(value: HysCascaderPath | HysCascaderKey) {
    const path = Array.isArray(value)
      ? value
      : resolvePath(value as HysCascaderKey);
    return engine.removeTag(cascaderToken(path));
  }
  function setValue(value: HysCascaderValue) {
    const paths = pathsFor(value);
    return engine.setValue(
      multiple.value
        ? paths.map(cascaderToken)
        : paths[0]
          ? cascaderToken(paths[0])
          : "",
    );
  }
  // Before-filter hooks are cancelable and cannot replace a newer query.
  const filterPending = ref(false),
    filterError = shallowRef<unknown>(),
    acceptedQuery = ref("");
  let searchController: AbortController | undefined,
    searchTimer: ReturnType<typeof setTimeout> | undefined,
    searchEpoch = 0;
  function cancelSearch() {
    searchEpoch++;
    clearTimeout(searchTimer);
    searchTimer = undefined;
    searchController?.abort();
    searchController = undefined;
    filterPending.value = false;
  }
  async function searchNow(immediate = false) {
    cancelSearch();
    filterError.value = undefined;
    const query = engine.query.value.trim();
    if (!props.filterable || !query || !active.value || blocked.value) {
      acceptedQuery.value = "";
      return;
    }
    const epoch = searchEpoch,
      controller = new AbortController();
    searchController = controller;
    filterPending.value = true;
    const run = async () => {
      searchTimer = undefined;
      try {
        const allowed = await (props.beforeFilter?.(query, {
          signal: controller.signal,
        }) ?? true);
        if (
          !controller.signal.aborted &&
          live.value &&
          active.value &&
          epoch === searchEpoch
        )
          acceptedQuery.value = allowed ? query : "";
      } catch (error) {
        if (!controller.signal.aborted && epoch === searchEpoch) {
          filterError.value = error;
          acceptedQuery.value = "";
          emit("search-error", error, query);
        }
      } finally {
        if (epoch === searchEpoch) {
          filterPending.value = false;
          searchController = undefined;
        }
      }
    };
    const delay = immediate
      ? 0
      : Math.max(0, Math.min(5000, props.debounce ?? 0));
    if (delay) searchTimer = setTimeout(run, delay);
    else await run();
  }
  const searchResults = computed(() => {
    const query = acceptedQuery.value;
    if (!query) return [];
    const candidates = engine.tree.index.value.rows
      .filter((row) => !row.disabled && (anyLevel.value || !row.hasChildren))
      .filter((row) =>
        props.filterMethod
          ? props.filterMethod(query, row.node.nodes)
          : row.node.labels
              .join(props.separator ?? " / ")
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
      );
    if (props.searchSort)
      candidates.sort((a, b) =>
        props.searchSort!(item(String(a.key)), item(String(b.key)), query),
      );
    const limit =
      props.searchLimit === false
        ? Infinity
        : Math.max(0, Math.floor(props.searchLimit ?? 50));
    return candidates.slice(0, limit).map((row) => row.node);
  });
  watch(
    [
      engine.query,
      active,
      blocked,
      () => props.filterable,
      () => props.beforeFilter,
    ],
    () => {
      void searchNow();
    },
    { immediate: true },
  );
  let rootController: AbortController | undefined,
    rootEpoch = 0,
    rootPromise: Promise<boolean> | undefined;
  function cancelRoot() {
    rootEpoch++;
    rootController?.abort();
    rootController = undefined;
    rootPending.value = false;
    rootPromise = undefined;
  }
  function reloadRoot(force = true): Promise<boolean> {
    if (!props.loadRoot || !active.value || blocked.value)
      return Promise.resolve(false);
    if (!force && rootData.value !== undefined) return Promise.resolve(true);
    if (rootPromise && !force) return rootPromise;
    cancelRoot();
    const epoch = rootEpoch,
      controller = new AbortController(),
      method = props.loadRoot;
    rootController = controller;
    rootPending.value = true;
    rootError.value = undefined;
    let onAbort!: () => void;
    const aborted = new Promise<boolean>((resolve) => {
      onAbort = () => resolve(false);
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
    const work = (async () => {
      try {
        const result = await method({ signal: controller.signal });
        if (
          controller.signal.aborted ||
          epoch !== rootEpoch ||
          !live.value ||
          !active.value ||
          method !== props.loadRoot
        )
          return false;
        if (!Array.isArray(result))
          throw new TypeError("loadRoot must resolve to an array");
        rootData.value = result;
        emit("root-load", result);
        return true;
      } catch (error) {
        if (!controller.signal.aborted && epoch === rootEpoch) {
          rootError.value = error;
          emit("root-load-error", error);
        }
        return false;
      } finally {
        controller.signal.removeEventListener("abort", onAbort);
        if (epoch === rootEpoch) {
          rootPending.value = false;
          rootController = undefined;
          rootPromise = undefined;
        }
      }
    })();
    rootPromise = Promise.race([work, aborted]);
    return rootPromise;
  }
  watch(
    [active, blocked, () => props.options, () => props.loadRoot],
    () => {
      if (
        active.value &&
        !blocked.value &&
        !props.options.length &&
        props.loadRoot
      )
        void reloadRoot(false);
    },
    { immediate: true },
  );
  watch(
    [() => props.options, () => props.loadRoot],
    ([options, method], [previous, oldMethod]) => {
      if (!options.length && !previous.length && method === oldMethod) return;
      cancelRoot();
      rootData.value = undefined;
      rootError.value = undefined;
    },
    { flush: "sync" },
  );
  watch(
    [active, blocked],
    () => {
      if (!active.value || blocked.value) {
        actionEpoch++;
        checking.value = false;
        cancelRoot();
        cancelSearch();
      }
    },
    { flush: "sync" },
  );
  function stop() {
    live.value = false;
    actionEpoch++;
    cancelRoot();
    cancelSearch();
    checking.value = false;
  }
  onBeforeUnmount(stop);
  onDeactivated(stop);
  onActivated(() => (live.value = true));
  return {
    engine,
    entries,
    current,
    multiple,
    items,
    columns,
    browsing,
    anyLevel,
    blocked,
    words,
    checking,
    selectedPaths,
    modelKeys,
    rootPending,
    rootError,
    filterPending,
    filterError,
    searchResults,
    item,
    pick,
    expandPath,
    removeTag,
    setValue,
    clear: engine.clear,
    filter: engine.filter,
    reloadRoot,
    retrySearch: () => searchNow(true),
    reloadNode: (path: HysCascaderPath) =>
      engine.tree.reloadNode(cascaderToken(path)),
    getCheckedNodes: (leafOnly = false) =>
      multiple.value
        ? engine.tree.getCheckedNodes(leafOnly).map((entry) => entry.raw)
        : modelKeys.value.flatMap((key) => {
            const row = engine.tree.index.value.map.get(key);
            return row && (!leafOnly || !row.hasChildren) ? [row.node.raw] : [];
          }),
  };
}
export type HysCascaderStore<N extends object> = ReturnType<
  typeof useCascader<N>
>;
