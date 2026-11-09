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
import { useTree } from "./useTree";
import {
  treeField,
  treeKey,
  treeKeys,
  treeLocale,
  type HysTreeKey,
  type HysTreeProps,
  type HysTreeRecord,
} from "./tree";
import {
  treeSelectFields,
  treeSelectForest,
  selectTreeIndex,
  type HysTreeSelectProps,
  type HysTreeSelectValue,
  type HysTreeSelectLabelValue,
  type HysTreeSelectItem,
  type HysTreeSelectChange,
} from "./treeSelect";
const same = (a: readonly HysTreeKey[], b: readonly HysTreeKey[]) =>
  a.length === b.length && a.every((k, i) => k === b[i]);
export const treeSelectValueKeys = (value: HysTreeSelectValue | undefined) =>
  treeKeys(
    (Array.isArray(value) ? value : value == null ? [] : [value]).flatMap(
      (v) =>
        treeKey(v)
          ? v === ""
            ? []
            : [v]
          : v && typeof v === "object" && treeKey(v.value)
            ? [v.value]
            : [],
    ),
  );
export function useTreeSelect<N extends object>(
  props: HysTreeSelectProps<N>,
  disabled: ComputedRef<boolean>,
  active: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
) {
  const live = ref(true),
    own = shallowRef<HysTreeSelectValue>(props.defaultValue ?? null),
    localQuery = ref(props.defaultSearchValue ?? ""),
    remoteNodes = shallowRef<readonly N[]>(),
    remotePending = ref(false),
    remoteError = shallowRef<unknown>(),
    cache = shallowRef(new Map<HysTreeKey, HysTreeSelectItem<N>>());
  const current = computed(() =>
      props.modelValue === undefined ? own.value : props.modelValue,
    ),
    values = computed(() => treeSelectValueKeys(current.value)),
    multiple = computed(
      () =>
        !!props.multiple || !!props.checkable || Array.isArray(current.value),
    ),
    query = computed(() => props.searchValue ?? localQuery.value),
    blocked = computed(
      () =>
        !live.value || disabled.value || !!props.readonly || !!props.loading,
    ),
    fields = computed(() => treeSelectFields(props)),
    forest = computed(() =>
      treeSelectForest(remoteNodes.value ?? props.nodes, props),
    ),
    words = computed(() => ({
      ...treeLocale,
      ...props.locale,
      search: props.searchPlaceholder ?? props.locale?.search ?? "搜索节点",
      empty: props.emptyText ?? props.locale?.empty ?? "暂无节点",
      noMatch: props.noMatchText ?? props.locale?.noMatch ?? "无匹配节点",
      loading: props.loadingText ?? props.locale?.loading ?? "加载中",
    }));
  const keyOf = (node: N) =>
    typeof props.nodeKey === "function"
      ? props.nodeKey(node)
      : (treeField(
          node,
          typeof props.nodeKey === "string" ? props.nodeKey : fields.value.id!,
        ) as HysTreeKey);
  const rawNode = (node: N) => forest.value.raw.get(keyOf(node)) ?? node;
  const loader = computed(() => {
    const load = props.loadChildren;
    return load
      ? (node: N, ctx: Parameters<NonNullable<typeof load>>[1]) =>
          load(rawNode(node), ctx)
      : undefined;
  });
  const treeProps: HysTreeProps<N> = {
    get nodes() {
      return forest.value.nodes;
    },
    get modelValue() {
      return multiple.value ? values.value : (values.value[0] ?? null);
    },
    get checkedKeys() {
      return props.checkable ? values.value : [];
    },
    get multiple() {
      return multiple.value;
    },
    get checkable() {
      return props.checkable;
    },
    get checkStrictly() {
      return props.checkStrictly;
    },
    get fieldNames() {
      return fields.value;
    },
    get nodeKey() {
      return props.nodeKey;
    },
    inheritDisabled: true,
    get searchValue() {
      return query.value;
    },
    get filterNode() {
      return props.remote
        ? () => true
        : props.filterNode
          ? (q: string, n: N) => props.filterNode!(q, rawNode(n))
          : undefined;
    },
    get filterMode() {
      return props.filterMode;
    },
    get showMatchedChildren() {
      return props.showMatchedChildren;
    },
    get expandedKeys() {
      return props.expandedKeys;
    },
    get defaultExpandedKeys() {
      return props.defaultExpandedKeys;
    },
    get defaultExpandAll() {
      return props.defaultExpandAll ?? true;
    },
    get autoExpandParent() {
      return props.autoExpandParent;
    },
    get accordion() {
      return props.accordion;
    },
    get loadedKeys() {
      return props.loadedKeys;
    },
    get loadChildren() {
      return loader.value;
    },
    get locale() {
      return words.value;
    },
  };
  const engineDisabled = computed(() => blocked.value || remotePending.value);
  const tree = useTree(
    treeProps,
    engineDisabled,
    (name, ...args) => {
      if (name === "select") {
        const [node, info] = args;
        void request(
          info.selectedKeys,
          "select",
          rawNode(node),
          info.event,
        ).then((ok) => {
          if (ok)
            emit(
              info.selected ? "select" : "deselect",
              keyOf(node),
              rawNode(node),
              info,
            );
        });
      } else if (name === "check") {
        const [keys, info] = args;
        void request(
          project(keys),
          "check",
          info.node ? rawNode(info.node) : undefined,
          info.event,
          undefined,
          info.halfCheckedKeys,
        );
      } else if (name === "check-change")
        emit("check", {
          ...args[0],
          node: args[0].node ? rawNode(args[0].node) : undefined,
          checkedNodes: args[0].checkedNodes.map(rawNode),
          halfCheckedNodes: args[0].halfCheckedNodes.map(rawNode),
        });
      else if (name === "update:searchValue") filter(args[0]);
      else if (
        [
          "update:expandedKeys",
          "update:loadedKeys",
          "node-expand",
          "node-collapse",
          "load-error",
          "children-loaded",
          "load",
        ].includes(name)
      ) {
        if (
          name === "load-error" ||
          name === "children-loaded" ||
          name === "load"
        )
          emit(name, { ...args[0], node: rawNode(args[0].node) });
        else if (name === "node-expand" || name === "node-collapse")
          emit(name, rawNode(args[0]), args[1]);
        else emit(name, ...args);
      }
    },
    () => {},
    { loadActive: active },
  );
  const cacheIndex = computed(() =>
    selectTreeIndex(props.cacheData ?? [], props),
  );
  function labelsFor(value: HysTreeSelectValue | undefined) {
    const result = new Map<HysTreeKey, HysTreeSelectLabelValue>();
    for (const v of Array.isArray(value) ? value : [value])
      if (v && typeof v === "object" && !Array.isArray(v) && treeKey(v.value))
        result.set(v.value, v);
    return result;
  }
  const currentLabels = computed(() => labelsFor(current.value));
  const supplied = (key: HysTreeKey) => currentLabels.value.get(key);
  function item(key: HysTreeKey): HysTreeSelectItem<N> {
    const record =
        tree.index.value.map.get(key) ?? cacheIndex.value.map.get(key),
      previous = cache.value.get(key),
      labeled = supplied(key);
    return {
      value: key,
      label: labeled?.label ?? record?.label ?? previous?.label ?? String(key),
      node: record ? rawNode(record.node) : previous?.node,
      disabled: !!(
        record?.disabled ||
        (props.checkable &&
          record &&
          (record.checkboxDisabled || !record.checkable)) ||
        labeled?.disabled ||
        (labeled?.disabled === undefined && previous?.disabled && !record)
      ),
      missing: !tree.index.value.map.has(key),
    };
  }
  watch(
    [values, tree.index, cacheIndex],
    () => {
      const next = new Map<HysTreeKey, HysTreeSelectItem<N>>();
      for (const key of values.value) next.set(key, item(key));
      cache.value = next;
    },
    { immediate: true },
  );
  function project(keys: readonly HysTreeKey[]) {
    if (!props.checkable) return treeKeys(keys);
    const set = new Set(keys),
      strategy = props.leafOnly
        ? "child"
        : props.checkStrictly
          ? "all"
          : (props.showCheckedStrategy ?? "child");
    return treeKeys(keys).filter((key) => {
      const row = tree.index.value.map.get(key);
      if (!row || item(key).disabled) return true;
      if (strategy === "child") return !row.children.length;
      if (strategy === "parent") {
        let parent = row.parent;
        while (parent !== undefined) {
          const at = tree.index.value.map.get(parent);
          if (!at || at.checkboxDisabled || !at.checkable) break;
          if (set.has(parent)) return false;
          parent = at.parent;
        }
      }
      return true;
    });
  }
  const displayKeys = computed(() =>
      props.checkable ? project([...tree.checked.value]) : values.value,
    ),
    items = computed(() => displayKeys.value.map(item)),
    busy = computed(() => blocked.value || remotePending.value);
  let ticket = 0,
    epoch = 0;
  function output(keys: readonly HysTreeKey[], provided?: HysTreeSelectValue) {
    const labels =
      provided === undefined ? currentLabels.value : labelsFor(provided);
    const list = keys.map((key) =>
      props.labelInValue
        ? {
            value: key,
            label: labels.get(key)?.label ?? item(key).label,
          }
        : key,
    );
    return multiple.value
      ? list
      : (list[0] ??
          (props.clearValue !== undefined
            ? props.clearValue
            : props.labelInValue
              ? null
              : ""));
  }
  async function request(
    keys: readonly HysTreeKey[],
    reason: HysTreeSelectChange<N>["reason"],
    node?: N,
    event?: Event,
    provided?: HysTreeSelectValue,
    halfKeys?: HysTreeKey[],
  ) {
    if (blocked.value) return false;
    let next = treeKeys(keys);
    if (!multiple.value) next = next.slice(0, 1);
    const nextSet = new Set(next),
      previousSet = new Set(values.value);
    for (const key of multiple.value ? values.value : [])
      if (item(key).disabled && !nextSet.has(key)) {
        next.push(key);
        nextSet.add(key);
      }
    const limit = Number.isFinite(props.multipleLimit)
      ? Math.max(0, Math.floor(props.multipleLimit!))
      : 0;
    if (
      multiple.value &&
      limit &&
      next.length > limit &&
      next.some((key) => !previousSet.has(key))
    ) {
      emit("limit", limit);
      return false;
    }
    const result = output(next, provided),
      resultLabels = props.labelInValue ? labelsFor(result) : undefined,
      labelsChanged =
        !!props.labelInValue &&
        next.some(
          (key) => resultLabels?.get(key)?.label !== supplied(key)?.label,
        );
    if (same(next, values.value) && !labelsChanged) return false;
    const currentTicket = ++ticket,
      currentEpoch = epoch;
    if (props.modelValue === undefined) own.value = result;
    const info: HysTreeSelectChange<N> = {
      reason,
      node,
      values: next,
      items: next.map((key) => ({
        ...item(key),
        ...(resultLabels?.has(key)
          ? { label: resultLabels.get(key)!.label }
          : {}),
      })),
      halfCheckedKeys: halfKeys ?? tree.getHalfCheckedKeys(),
      event,
    };
    emit("update:modelValue", result);
    emit("change", result, info);
    await nextTick();
    if (
      !live.value ||
      blocked.value ||
      currentEpoch !== epoch ||
      currentTicket !== ticket ||
      !same(next, values.value) ||
      (props.labelInValue &&
        next.some(
          (key) =>
            toRaw(resultLabels?.get(key)?.label) !==
            toRaw(supplied(key)?.label),
        ))
    )
      return false;
    emit("value-change", result, {
      ...info,
      items: next.map(item),
      halfCheckedKeys: tree.getHalfCheckedKeys(),
    });
    if (props.validateEvent !== false) validate();
    return true;
  }
  function clear() {
    return request(
      values.value.filter((key) => item(key).disabled),
      "clear",
    ).then((ok) => {
      if (ok) emit("clear");
      return ok;
    });
  }
  function removeTag(key: HysTreeKey) {
    if (blocked.value || props.removable === false || item(key).disabled)
      return Promise.resolve(false);
    let next = values.value.filter((v) => v !== key);
    if (
      props.checkable &&
      !props.checkStrictly &&
      tree.index.value.map.has(key)
    ) {
      const remaining = new Set(tree.checked.value),
        stack = [key];
      while (stack.length) {
        const k = stack.pop()!,
          row = tree.index.value.map.get(k);
        if (!row || row.checkboxDisabled || !row.checkable) continue;
        remaining.delete(k);
        for (const child of row.children) stack.push(child);
      }
      for (const parent of tree.ancestors(key)) remaining.delete(parent);
      next = project([...remaining]);
    }
    return request(next, "remove", item(key).node).then((ok) => {
      if (ok) emit("remove-tag", key, item(key).node);
      return ok;
    });
  }
  function pick(row: HysTreeRecord<N>, event?: Event) {
    if (busy.value || row.disabled) return Promise.resolve(false);
    if (props.checkable) {
      if (!row.checkable || row.checkboxDisabled) return Promise.resolve(false);
      return tree.setChecked(
        row.key,
        !tree.checked.value.has(row.key),
        !props.checkStrictly,
        event,
      );
    }
    if (!row.selectable || (props.leafOnly && row.hasChildren)) {
      if (row.hasChildren)
        void tree.expandNode(row.key, !tree.expanded.value.has(row.key));
      return Promise.resolve(false);
    }
    return tree.selectNode(row, event);
  }
  function filter(text: string) {
    if (blocked.value) return;
    if (props.searchValue === undefined) localQuery.value = text;
    emit("update:searchValue", text);
    emit("search", text);
  }
  let remoteController: AbortController | undefined,
    remoteTimer: ReturnType<typeof setTimeout> | undefined,
    remoteTicket = 0;
  function cancelRemote() {
    remoteTicket++;
    clearTimeout(remoteTimer);
    remoteTimer = undefined;
    remoteController?.abort();
    remoteController = undefined;
    remotePending.value = false;
  }
  async function searchRemote(immediate = false) {
    cancelRemote();
    if (!active.value || blocked.value || !props.remote || !props.remoteMethod)
      return;
    const token = remoteTicket,
      controller = new AbortController(),
      method = props.remoteMethod,
      text = query.value;
    remoteController = controller;
    remoteError.value = undefined;
    remotePending.value = true;
    const run = async () => {
      remoteTimer = undefined;
      try {
        const result = await method(text, { signal: controller.signal });
        if (
          controller.signal.aborted ||
          !live.value ||
          token !== remoteTicket ||
          method !== props.remoteMethod ||
          !active.value
        )
          return;
        if (result !== undefined) {
          if (!Array.isArray(result))
            throw new TypeError(
              "remoteMethod must return an array or undefined",
            );
          remoteNodes.value = result;
        }
        emit("search-complete", text);
      } catch (error) {
        if (controller.signal.aborted || !live.value || token !== remoteTicket)
          return;
        remoteError.value = error;
        emit("search-error", error, text);
      } finally {
        if (token === remoteTicket) {
          remotePending.value = false;
          remoteController = undefined;
        }
      }
    };
    const delay = immediate
      ? 0
      : Number.isFinite(props.debounce)
        ? Math.min(5000, Math.max(0, props.debounce!))
        : 250;
    if (delay) remoteTimer = setTimeout(run, delay);
    else await run();
  }
  watch([query, () => props.remoteMethod, () => props.remote, active], () => {
    if (!props.remote) {
      cancelRemote();
      remoteNodes.value = undefined;
      remoteError.value = undefined;
    } else void searchRemote();
  });
  watch(
    blocked,
    (value) => {
      if (value) cancelRemote();
    },
    { flush: "sync" },
  );
  function stop() {
    live.value = false;
    epoch++;
    cancelRemote();
  }
  onDeactivated(stop);
  onBeforeUnmount(stop);
  onActivated(() => {
    live.value = true;
    if (active.value) void searchRemote();
  });
  return {
    tree,
    live,
    current,
    values,
    multiple,
    query,
    items,
    displayKeys,
    busy,
    blocked,
    words,
    remotePending,
    remoteError,
    rawNode,
    keyOf,
    item,
    pick,
    filter,
    clear,
    removeTag,
    request,
    project,
    retrySearch: () => searchRemote(true),
    setValue: (value: HysTreeSelectValue) =>
      request(treeSelectValueKeys(value), "api", undefined, undefined, value),
  };
}
export type HysTreeSelectStore<N extends object> = ReturnType<
  typeof useTreeSelect<N>
>;
