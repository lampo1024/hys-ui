import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  toRaw,
  watch,
  type ComputedRef,
} from "vue";
import {
  treeIndex,
  treeKeys,
  treeKey,
  treeField,
  treeAssign,
  treeLocale,
  type HysTreeProps,
  type HysTreeKey,
  type HysTreeValue,
  type HysTreeRecord,
  type HysTreeCheckInfo,
} from "./tree";
const equal = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const sameKeys = (a: Set<HysTreeKey>, b: readonly HysTreeKey[]) =>
  a.size === b.length && b.every((k) => a.has(k));
export function useTree<N extends object>(
  props: HysTreeProps<N>,
  disabled: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
  options: { loadActive?: ComputedRef<boolean> } = {},
) {
  const live = ref(true),
    ownValue = shallowRef<HysTreeValue>(props.defaultValue ?? null),
    ownChecked = shallowRef<readonly HysTreeKey[]>(
      props.defaultCheckedKeys ?? [],
    ),
    ownExpanded = shallowRef<readonly HysTreeKey[]>(
      props.defaultExpandedKeys ?? [],
    ),
    ownLoaded = shallowRef<readonly HysTreeKey[]>([]),
    ownSearch = ref(props.defaultSearchValue ?? ""),
    asyncChildren = shallowRef(new Map<HysTreeKey, readonly N[]>()),
    loadingKeys = shallowRef(new Set<HysTreeKey>()),
    failures = shallowRef(new Map<HysTreeKey, unknown>());
  const index = computed(() =>
      treeIndex(props.nodes, props, asyncChildren.value),
    ),
    words = computed(() => ({ ...treeLocale, ...props.locale })),
    busy = computed(() => !live.value || disabled.value || !!props.loading),
    value = computed(() =>
      props.modelValue === undefined ? ownValue.value : props.modelValue,
    ),
    selected = computed(() =>
      treeKeys(
        Array.isArray(value.value)
          ? value.value
          : treeKey(value.value)
            ? [value.value]
            : [],
      ),
    ),
    selection = computed(() => new Set(selected.value)),
    multiple = computed(() => !!props.multiple || Array.isArray(value.value));
  const query = computed(() => props.searchValue ?? ownSearch.value),
    rawExpanded = computed(() =>
      treeKeys(props.expandedKeys ?? ownExpanded.value),
    ),
    loaded = computed(() => new Set(props.loadedKeys ?? ownLoaded.value));
  const ancestors = (key: HysTreeKey) => {
    const result: HysTreeKey[] = [];
    let row = index.value.map.get(key);
    while (row?.parent !== undefined) {
      result.push(row.parent);
      row = index.value.map.get(row.parent);
    }
    return result;
  };
  const expanded = computed(() => {
    const result = new Set(rawExpanded.value);
    if (props.autoExpandParent)
      for (let i = index.value.rows.length - 1; i >= 0; i--) {
        const row = index.value.rows[i];
        if (result.has(row.key) && row.parent !== undefined)
          result.add(row.parent);
      }
    return result;
  });
  const matches = computed(() => {
    const result = new Set<HysTreeKey>(),
      q = query.value.trim();
    if (!q) return result;
    for (const row of index.value.rows)
      if (
        props.filterNode
          ? props.filterNode(q, row.node)
          : row.label.toLocaleLowerCase().includes(q.toLocaleLowerCase())
      )
        result.add(row.key);
    return result;
  });
  const visible = computed(() => {
    const q = query.value.trim(),
      allowed = new Set(matches.value);
    if (q && props.filterMode !== "highlight") {
      for (let i = index.value.rows.length - 1; i >= 0; i--) {
        const row = index.value.rows[i];
        if (allowed.has(row.key) && row.parent !== undefined)
          allowed.add(row.parent);
      }
      if (props.showMatchedChildren) {
        const branches = new Set(matches.value);
        for (const row of index.value.rows)
          if (row.parent !== undefined && branches.has(row.parent)) {
            branches.add(row.key);
            allowed.add(row.key);
          }
      }
    }
    const visibleParents = new Set<HysTreeKey>();
    return index.value.rows.filter((row) => {
      const show =
        q && props.filterMode !== "highlight"
          ? allowed.has(row.key)
          : row.parent === undefined || visibleParents.has(row.parent);
      if (
        show &&
        ((q && props.filterMode !== "highlight") || expanded.value.has(row.key))
      )
        visibleParents.add(row.key);
      return show;
    });
  });
  const editable = (r: HysTreeRecord<N> | undefined) =>
    !!r && !r.checkboxDisabled && r.checkable;
  function descend(key: HysTreeKey, barriers = true) {
    const result: HysTreeKey[] = [],
      stack = [key];
    while (stack.length) {
      const row = index.value.map.get(stack.pop()!);
      if (!row || (barriers && !editable(row))) continue;
      result.push(row.key);
      for (let i = row.children.length - 1; i >= 0; i--)
        stack.push(row.children[i]);
    }
    return result;
  }
  function canonical(
    keys: readonly HysTreeKey[],
    conduct = !props.checkStrictly,
  ) {
    const full = new Set(treeKeys(keys)),
      half = new Set<HysTreeKey>();
    if (conduct) {
      const visited = new Set<HysTreeKey>(),
        stack = [...keys];
      while (stack.length) {
        const key = stack.pop()!,
          row = index.value.map.get(key);
        if (!row || visited.has(key) || !editable(row)) continue;
        visited.add(key);
        full.add(key);
        for (const child of row.children) stack.push(child);
      }
      for (let i = index.value.rows.length - 1; i >= 0; i--) {
        const row = index.value.rows[i];
        if (!editable(row)) continue;
        const children = row.children.filter((k) =>
          editable(index.value.map.get(k)),
        );
        if (children.length) {
          if (children.every((k) => full.has(k))) full.add(row.key);
          else {
            full.delete(row.key);
            if (children.some((k) => full.has(k) || half.has(k)))
              half.add(row.key);
          }
        }
      }
    } else
      for (const key of props.halfCheckedKeys ?? [])
        if (index.value.map.has(key) && !full.has(key)) half.add(key);
    return { full, half };
  }
  const checks = computed(() =>
      canonical(props.checkedKeys ?? ownChecked.value),
    ),
    checked = computed(() => checks.value.full),
    halfChecked = computed(() => checks.value.half);
  const knownKeys = (set: Set<HysTreeKey>, leafOnly = false) =>
      index.value.rows
        .filter((r) => set.has(r.key) && (!leafOnly || !r.hasChildren))
        .map((r) => r.key),
    getCheckedKeys = (leafOnly = false) => knownKeys(checked.value, leafOnly),
    getHalfCheckedKeys = () => knownKeys(halfChecked.value),
    getCheckedNodes = (leafOnly = false, includeHalf = false) =>
      index.value.rows
        .filter(
          (r) =>
            (checked.value.has(r.key) ||
              (includeHalf && halfChecked.value.has(r.key))) &&
            (!leafOnly || !r.hasChildren),
        )
        .map((r) => r.node);
  const keyFor = (key: HysTreeKey | N) =>
    treeKey(key)
      ? key
      : typeof props.nodeKey === "function"
        ? props.nodeKey(key)
        : (treeField(
            key,
            typeof props.nodeKey === "string"
              ? props.nodeKey
              : index.value.fields.id,
          ) as HysTreeKey);
  const getNodeInfo = (key: HysTreeKey | N) => index.value.map.get(keyFor(key)),
    getNode = (key: HysTreeKey | N) => getNodeInfo(key)?.node;
  let lifetime = 0,
    checkTicket = 0,
    selectTicket = 0;
  function checkInfo(
    node?: N,
    on?: boolean,
    event?: Event,
  ): HysTreeCheckInfo<N> {
    return {
      node,
      checked: on,
      checkedKeys: getCheckedKeys(),
      checkedNodes: getCheckedNodes(),
      halfCheckedKeys: getHalfCheckedKeys(),
      halfCheckedNodes: index.value.rows
        .filter((r) => halfChecked.value.has(r.key))
        .map((r) => r.node),
      event,
    };
  }
  async function requestChecked(
    next: readonly HysTreeKey[],
    node?: N,
    on?: boolean,
    event?: Event,
  ) {
    if (busy.value) return false;
    const normalized = canonical(next),
      keys = [...normalized.full],
      ticket = ++checkTicket,
      epoch = lifetime;
    if (sameKeys(checked.value, keys)) return false;
    if (props.checkedKeys === undefined) ownChecked.value = keys;
    emit("update:checkedKeys", keys);
    emit("check", keys, {
      ...checkInfo(node, on, event),
      checkedKeys: knownKeys(normalized.full),
      checkedNodes: index.value.rows
        .filter((r) => normalized.full.has(r.key))
        .map((r) => r.node),
      halfCheckedKeys: knownKeys(normalized.half),
      halfCheckedNodes: index.value.rows
        .filter((r) => normalized.half.has(r.key))
        .map((r) => r.node),
    });
    await nextTick();
    if (
      !live.value ||
      lifetime !== epoch ||
      ticket !== checkTicket ||
      !sameKeys(checked.value, keys)
    )
      return false;
    emit("check-change", checkInfo(node, on, event));
    validate();
    return true;
  }
  function setCheckedKeys(keys: readonly HysTreeKey[], leafOnly = false) {
    const next = treeKeys(keys).filter((k) => {
      const row = index.value.map.get(k);
      return !row || (editable(row) && (!leafOnly || !row.hasChildren));
    });
    for (const key of checked.value)
      if (index.value.map.has(key) && !editable(index.value.map.get(key)))
        next.push(key);
    return requestChecked(next);
  }
  function setChecked(
    key: HysTreeKey | N,
    on: boolean,
    deep = !props.checkStrictly,
    event?: Event,
  ) {
    const row = getNodeInfo(key);
    if (!editable(row) || !row) return Promise.resolve(false);
    const next = new Set(checked.value),
      keys = deep ? descend(row.key) : [row.key];
    for (const k of keys) on ? next.add(k) : next.delete(k);
    if (!on && !props.checkStrictly)
      for (const k of ancestors(row.key)) next.delete(k);
    return requestChecked([...next], row.node, on, event);
  }
  async function requestSelected(
    keys: readonly HysTreeKey[],
    node: N | null = null,
    event?: Event,
  ) {
    if (busy.value || props.selectable === false) return false;
    const next = treeKeys(keys).filter((k) => {
      const r = index.value.map.get(k);
      return !r || (!r.disabled && r.selectable);
    });
    if (!multiple.value) next.splice(1);
    if (equal(next, selected.value)) return false;
    const nextValue = multiple.value ? next : (next[0] ?? null),
      epoch = lifetime,
      ticket = ++selectTicket;
    if (props.modelValue === undefined) ownValue.value = nextValue;
    emit("update:modelValue", nextValue);
    if (node)
      emit("select", node, {
        node,
        selected: next.includes(keyFor(node)),
        selectedKeys: next,
        selectedNodes: next.flatMap((k) => getNode(k) ?? []),
        event,
      });
    await nextTick();
    if (
      !live.value ||
      lifetime !== epoch ||
      ticket !== selectTicket ||
      !equal(next, selected.value)
    )
      return false;
    emit("selection-change", {
      node,
      selected: node ? next.includes(keyFor(node)) : false,
      selectedKeys: next,
      selectedNodes: next.flatMap((k) => getNode(k) ?? []),
      event,
    });
    validate();
    return true;
  }
  function selectNode(row: HysTreeRecord<N>, event?: Event) {
    if (
      busy.value ||
      row.disabled ||
      !row.selectable ||
      props.selectable === false
    )
      return Promise.resolve(false);
    const next = selection.value.has(row.key)
      ? multiple.value || props.allowDeselect
        ? selected.value.filter((k) => k !== row.key)
        : selected.value
      : multiple.value
        ? [...selected.value, row.key]
        : [row.key];
    return requestSelected(next, row.node, event);
  }
  async function setExpandedKeys(keys: readonly HysTreeKey[]) {
    if (busy.value) return false;
    const next = treeKeys(keys),
      epoch = lifetime;
    if (equal(next, rawExpanded.value)) return false;
    if (props.expandedKeys === undefined) ownExpanded.value = next;
    emit("update:expandedKeys", next);
    await nextTick();
    return live.value && lifetime === epoch && equal(next, rawExpanded.value);
  }
  const requests = new Map<
    HysTreeKey,
    { controller: AbortController; promise: Promise<boolean> }
  >();
  function cancelLoads() {
    for (const request of requests.values()) request.controller.abort();
    requests.clear();
    loadingKeys.value = new Set();
  }
  function load(key: HysTreeKey, force = false): Promise<boolean> {
    const row = index.value.map.get(key);
    if (
      !row ||
      busy.value ||
      options.loadActive?.value === false ||
      !props.loadChildren ||
      row.leaf
    )
      return Promise.resolve(false);
    if (!force && (loaded.value.has(key) || row.children.length))
      return Promise.resolve(true);
    if (requests.has(key)) return requests.get(key)!.promise;
    const controller = new AbortController(),
      epoch = lifetime,
      source = props.nodes,
      loader = props.loadChildren;
    let resolve!: (value: boolean) => void;
    const promise = new Promise<boolean>((r) => (resolve = r));
    requests.set(key, { controller, promise });
    controller.signal.addEventListener("abort", () => resolve(false), {
      once: true,
    });
    loadingKeys.value = new Set([...loadingKeys.value, key]);
    const errorMap = new Map(failures.value);
    errorMap.delete(key);
    failures.value = errorMap;
    void (async () => {
      try {
        const children = await loader(row.node, {
          signal: controller.signal,
          key,
        });
        if (
          controller.signal.aborted ||
          !live.value ||
          epoch !== lifetime ||
          source !== props.nodes ||
          index.value.map.get(key)?.node !== row.node ||
          loader !== props.loadChildren
        )
          return false;
        if (!Array.isArray(children))
          throw new TypeError("loadChildren must resolve to an array");
        const next = treeKeys([...(props.loadedKeys ?? ownLoaded.value), key]);
        if (props.loadedKeys === undefined) ownLoaded.value = next;
        emit("update:loadedKeys", next);
        await nextTick();
        if (
          controller.signal.aborted ||
          !live.value ||
          epoch !== lifetime ||
          !loaded.value.has(key)
        )
          return false;
        const copy = new Map(asyncChildren.value);
        copy.set(key, children);
        asyncChildren.value = copy;
        emit("children-loaded", { node: row.node, children });
        emit("load", { node: row.node, children, loadedKeys: next });
        return true;
      } catch (error) {
        if (controller.signal.aborted || !live.value || epoch !== lifetime)
          return false;
        failures.value = new Map([...failures.value, [key, error]]);
        emit("load-error", { node: row.node, error });
        return false;
      } finally {
        if (requests.get(key)?.controller === controller) {
          requests.delete(key);
          const keys = new Set(loadingKeys.value);
          keys.delete(key);
          loadingKeys.value = keys;
        }
      }
    })().then(resolve, () => resolve(false));
    return promise;
  }
  async function expandNode(key: HysTreeKey, on = true) {
    const row = index.value.map.get(key);
    if (!row || row.disabled || !row.hasChildren || busy.value) return false;
    const wasFailed = failures.value.has(key);
    let next = rawExpanded.value.filter((k) => k !== key);
    if (!on && props.autoExpandParent)
      next = next.filter((k) => !ancestors(k).includes(key));
    if (on) {
      if (props.accordion)
        next = next.filter((k) => {
          let branch = index.value.map.get(k);
          while (branch && branch.depth > row.depth)
            branch =
              branch.parent === undefined
                ? undefined
                : index.value.map.get(branch.parent);
          return !branch || branch.parent !== row.parent || branch.key === key;
        });
      next.push(key);
    }
    const changed = await setExpandedKeys(next);
    if (changed)
      emit(on ? "node-expand" : "node-collapse", row.node, {
        key,
        expanded: on,
        expandedKeys: [...expanded.value],
      });
    if (
      on &&
      expanded.value.has(key) &&
      (!failures.value.has(key) || wasFailed)
    )
      await load(key);
    return changed;
  }
  function filter(q: string) {
    if (busy.value) return;
    if (props.searchValue === undefined) ownSearch.value = q;
    emit("update:searchValue", q);
    emit("search", q);
  }
  async function setCurrentKey(key: HysTreeKey | null, expandParents = true) {
    if (key !== null) {
      const row = index.value.map.get(key);
      if (!row || row.disabled || !row.selectable) return false;
    }
    if (key !== null && expandParents)
      await setExpandedKeys(
        treeKeys([...rawExpanded.value, ...ancestors(key)]),
      );
    return requestSelected(
      key === null ? [] : [key],
      key === null ? null : (getNode(key) ?? null),
    );
  }
  function updateChildrenNodes(key: HysTreeKey, children: readonly N[]) {
    const row = index.value.map.get(key);
    if (!row) return;
    let changed = treeAssign(row.node, index.value.fields.children, [
        ...children,
      ]),
      at = row;
    while (at.parent !== undefined) {
      const parent = index.value.map.get(at.parent)!;
      changed = treeAssign(
        parent.node,
        index.value.fields.children,
        parent.children.map((k) => (k === at.key ? changed : getNode(k)!)),
      );
      at = parent;
    }
    return index.value.roots.map((k) => (k === at.key ? changed : getNode(k)!));
  }
  async function commitNodes(
    next: readonly N[] | undefined,
    action: string,
    key?: HysTreeKey,
  ) {
    if (!next || busy.value) return false;
    const expected = treeIndex(next, props);
    if (expected.invalid) return false;
    emit("update:nodes", next);
    emit("data-change", { nodes: next, action, key });
    await nextTick();
    if (!live.value) return false;
    return (
      equal(
        index.value.rows.map((r) => r.key),
        expected.rows.map((r) => r.key),
      ) &&
      index.value.rows.every(
        (row, i) =>
          row.parent === expected.rows[i].parent &&
          toRaw(row.node) === toRaw(expected.rows[i].node),
      )
    );
  }
  function parentList(row: HysTreeRecord<N>) {
    return (
      row.parent === undefined
        ? index.value.roots
        : index.value.map.get(row.parent)!.children
    ).map((k) => getNode(k)!);
  }
  function insert(node: N, reference: HysTreeKey | N, after: boolean) {
    const row = getNodeInfo(reference),
      key = keyFor(node);
    if (!row || row.disabled || !treeKey(key) || index.value.map.has(key))
      return Promise.resolve(false);
    const list = parentList(row),
      at = list.indexOf(row.node);
    list.splice(at + (after ? 1 : 0), 0, node);
    return commitNodes(
      row.parent === undefined ? list : updateChildrenNodes(row.parent, list),
      after ? "insertAfter" : "insertBefore",
      key,
    );
  }
  const append = (node: N, parent?: HysTreeKey | N) => {
    const key = keyFor(node),
      row = parent === undefined ? undefined : getNodeInfo(parent);
    if (
      !treeKey(key) ||
      index.value.map.has(key) ||
      (parent !== undefined && (!row || row.disabled || row.leaf))
    )
      return Promise.resolve(false);
    return commitNodes(
      row
        ? updateChildrenNodes(row.key, [
            ...row.children.map((k) => getNode(k)!),
            node,
          ])
        : [...props.nodes, node],
      "append",
      key,
    );
  };
  function remove(key: HysTreeKey | N) {
    const row = getNodeInfo(key);
    if (!row || row.disabled) return Promise.resolve(false);
    const list = parentList(row).filter((n) => keyFor(n) !== row.key);
    return commitNodes(
      row.parent === undefined ? list : updateChildrenNodes(row.parent, list),
      "remove",
      row.key,
    );
  }
  async function reloadNode(key: HysTreeKey) {
    const row = index.value.map.get(key);
    if (!row || busy.value) return false;
    requests.get(key)?.controller.abort();
    requests.delete(key);
    return load(key, true);
  }
  watch(
    () =>
      [
        props.nodes,
        props.loadChildren,
        props.nodeKey,
        props.fieldNames,
      ] as const,
    () => {
      lifetime++;
      cancelLoads();
      asyncChildren.value = new Map();
      ownLoaded.value = [];
      failures.value = new Map();
    },
    { flush: "sync" },
  );
  watch(
    () => [props.nodes, props.defaultExpandAll] as const,
    () => {
      if (props.defaultExpandAll && props.expandedKeys === undefined)
        ownExpanded.value = index.value.rows
          .filter((r) => r.hasChildren)
          .map((r) => r.key);
    },
    { immediate: true },
  );
  watch(
    () =>
      [
        ...expanded.value,
        live.value,
        busy.value,
        index.value,
        options.loadActive?.value,
      ] as const,
    () => {
      if (!busy.value && options.loadActive?.value !== false)
        for (const key of expanded.value) {
          const row = index.value.map.get(key);
          if (
            row?.hasChildren &&
            !row.children.length &&
            !loaded.value.has(key) &&
            !failures.value.has(key)
          )
            void load(key);
        }
    },
    { immediate: true },
  );
  watch(
    () => props.loadedKeys,
    (keys, old) => {
      if (keys && old) {
        const next = new Map(asyncChildren.value);
        for (const key of old) if (!keys.includes(key)) next.delete(key);
        asyncChildren.value = next;
      }
    },
    { flush: "sync" },
  );
  function stop() {
    live.value = false;
    lifetime++;
    cancelLoads();
  }
  if (options.loadActive)
    watch(
      options.loadActive,
      (value) => {
        if (!value) cancelLoads();
      },
      { flush: "sync" },
    );
  watch(
    busy,
    (v) => {
      if (v) cancelLoads();
    },
    { flush: "sync" },
  );
  onDeactivated(stop);
  onBeforeUnmount(stop);
  onActivated(() => (live.value = true));
  return {
    live,
    busy,
    index,
    words,
    query,
    expanded,
    rawExpanded,
    selected,
    selection,
    multiple,
    visible,
    matches,
    checked,
    halfChecked,
    loadingKeys,
    failures,
    ancestors,
    getNode,
    getNodeInfo,
    getCheckedKeys,
    getCheckedNodes,
    getHalfCheckedKeys,
    checkInfo,
    setCheckedKeys,
    setChecked,
    selectNode,
    setSelectedKeys: requestSelected,
    setCurrentKey,
    getCurrentKey: () => selected.value[0] ?? null,
    getCurrentNode: () =>
      selected.value.length ? (getNode(selected.value[0]) ?? null) : null,
    setExpandedKeys,
    expandNode,
    filter,
    reloadNode,
    load,
    append,
    remove,
    insertBefore: (node: N, key: HysTreeKey | N) => insert(node, key, false),
    insertAfter: (node: N, key: HysTreeKey | N) => insert(node, key, true),
    updateKeyChildren: (key: HysTreeKey, children: readonly N[]) =>
      index.value.map.get(key)?.disabled ||
      (index.value.map.get(key)?.leaf && children.length)
        ? Promise.resolve(false)
        : commitNodes(
            updateChildrenNodes(key, children),
            "updateKeyChildren",
            key,
          ),
  };
}
