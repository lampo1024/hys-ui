import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type ComputedRef,
} from "vue";
import {
  transferRows,
  transferLabel,
  transferWords,
  type HysTransferProps,
  type HysTransferKey,
  type HysTransferSide,
} from "./transfer";
const sides = ["left", "right"] as const;
const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const unique = <K extends HysTransferKey>(keys: readonly K[]) => [
  ...new Set(
    keys.filter(
      (key) =>
        typeof key === "string" ||
        (typeof key === "number" && Number.isFinite(key)),
    ),
  ),
];
const positive = (n: number | undefined, fallback: number) =>
  Number.isFinite(n) && n! > 0 ? Math.max(1, Math.floor(n!)) : fallback;
export function useTransfer<T extends object, K extends HysTransferKey>(
  props: HysTransferProps<T, K>,
  disabled: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
) {
  const initialTargets = new Set(props.modelValue ?? props.defaultValue ?? []);
  const live = ref(true),
    local = ref<K[]>([...(props.defaultValue ?? [])]) as { value: K[] },
    ownChecked = ref<K[]>([
      ...(props.defaultCheckedKeys ?? []),
      ...(props.leftDefaultChecked ?? []).filter(
        (key) => !initialTargets.has(key),
      ),
      ...(props.rightDefaultChecked ?? []).filter((key) =>
        initialTargets.has(key),
      ),
    ]) as { value: K[] };
  const initialSize = positive(
    typeof props.pagination === "object"
      ? props.pagination.pageSize
      : undefined,
    10,
  );
  const queries = ref({ left: "", right: "" }),
    localPages = ref({ left: 1, right: 1 }),
    localSizes = ref({ left: initialSize, right: initialSize }),
    pending = ref(false),
    announcement = ref("");
  let moveTicket = 0,
    checkTicket = 0;
  const data = computed(() => transferRows(props)),
    keys = computed(() => unique(props.modelValue ?? local.value)),
    targetSet = computed(() => new Set(keys.value));
  const words = computed(() => transferWords(props.locale));
  const busy = computed(
    () => !live.value || disabled.value || !!props.loading || pending.value,
  );
  const checked = computed(() =>
      unique(props.checkedKeys ?? ownChecked.value).filter((key) => {
        const row = data.value.map.get(key);
        return (
          row && !row.disabled && !(props.oneWay && targetSet.value.has(key))
        );
      }),
    ),
    checkedSet = computed(() => new Set(checked.value));
  const all = computed(() => {
    const left = data.value.rows.filter((row) => !targetSet.value.has(row.key)),
      right =
        props.targetOrder && props.targetOrder !== "original"
          ? keys.value.flatMap((key) => {
              const row = data.value.map.get(key);
              return row ? [row] : [];
            })
          : data.value.rows.filter((row) => targetSet.value.has(row.key));
    return { left, right };
  });
  const searchValues = computed(() => ({
    left: props.searchValues?.left ?? queries.value.left,
    right: props.searchValues?.right ?? queries.value.right,
  }));
  const filtered = computed(
    () =>
      Object.fromEntries(
        sides.map((side) => {
          const query = searchValues.value[side].trim(),
            q = query.toLocaleLowerCase();
          return [
            side,
            query
              ? all.value[side].filter((row) =>
                  props.filterMethod
                    ? props.filterMethod(query, row.option, side)
                    : row.label.toLocaleLowerCase().includes(q),
                )
              : all.value[side],
          ];
        }),
      ) as typeof all.value,
  );
  const pagination = computed(() =>
    typeof props.pagination === "object" ? props.pagination : {},
  );
  const pageSizes = computed(() => ({
    left: positive(props.pageSizes?.left, localSizes.value.left),
    right: positive(props.pageSizes?.right, localSizes.value.right),
  }));
  watch(
    () => pagination.value.pageSize,
    (value) => {
      localSizes.value = {
        left: positive(value, 10),
        right: positive(value, 10),
      };
    },
  );
  const pageCounts = computed(() => ({
    left: Math.max(
      1,
      Math.ceil(filtered.value.left.length / pageSizes.value.left),
    ),
    right: Math.max(
      1,
      Math.ceil(filtered.value.right.length / pageSizes.value.right),
    ),
  }));
  const pages = computed(() => ({
    left: Math.min(
      pageCounts.value.left,
      positive(props.pages?.left, localPages.value.left),
    ),
    right: Math.min(
      pageCounts.value.right,
      positive(props.pages?.right, localPages.value.right),
    ),
  }));
  const visible = computed(() => ({
    left: props.pagination
      ? filtered.value.left.slice(
          (pages.value.left - 1) * pageSizes.value.left,
          pages.value.left * pageSizes.value.left,
        )
      : filtered.value.left,
    right: props.pagination
      ? filtered.value.right.slice(
          (pages.value.right - 1) * pageSizes.value.right,
          pages.value.right * pageSizes.value.right,
        )
      : filtered.value.right,
  }));
  function getCheckedKeys(side?: HysTransferSide) {
    return side
      ? checked.value.filter(
          (key) => targetSet.value.has(key) === (side === "right"),
        )
      : [...checked.value];
  }
  async function setCheckedKeys(next: readonly K[]) {
    if (busy.value) return false;
    const values = unique(next).filter((key) => {
        const row = data.value.map.get(key);
        return (
          row && !row.disabled && !(props.oneWay && targetSet.value.has(key))
        );
      }),
      before = [...checked.value];
    if (
      same(values, before) &&
      same(values, unique(props.checkedKeys ?? ownChecked.value))
    )
      return false;
    const ticket = ++checkTicket;
    const parts = sides.map((side) => ({
      side,
      before: before.filter(
        (key) => targetSet.value.has(key) === (side === "right"),
      ),
      next: values.filter(
        (key) => targetSet.value.has(key) === (side === "right"),
      ),
    }));
    ownChecked.value = values;
    emit("update:checkedKeys", [...values]);
    if (live.value) {
      for (const part of parts)
        if (!same(part.before, part.next))
          emit("checkChange", part.side, [...part.next]);
      emit("selectChange", [...parts[0].next], [...parts[1].next]);
    }
    await nextTick();
    if (
      !live.value ||
      disabled.value ||
      props.loading ||
      ticket !== checkTicket ||
      !same(values, checked.value)
    )
      return false;
    return true;
  }
  function check(key: K, value?: boolean) {
    const row = data.value.map.get(key);
    if (!row || row.disabled || (props.oneWay && targetSet.value.has(key)))
      return Promise.resolve(false);
    const next = new Set(checked.value);
    if (value ?? !next.has(key)) next.add(key);
    else next.delete(key);
    return setCheckedKeys([...next]);
  }
  function selectionScope(
    side: HysTransferSide,
    scope: "page" | "filtered" | "all" = "page",
  ) {
    return (
      scope === "all"
        ? all.value[side]
        : scope === "filtered"
          ? filtered.value[side]
          : visible.value[side]
    ).filter((row) => !row.disabled && !(props.oneWay && side === "right"));
  }
  function checkAll(
    side: HysTransferSide,
    value = true,
    scope: "page" | "filtered" | "all" = "page",
  ) {
    const next = new Set(checked.value);
    for (const row of selectionScope(side, scope))
      value ? next.add(row.key) : next.delete(row.key);
    return setCheckedKeys([...next]);
  }
  function invertSelection(
    side: HysTransferSide,
    scope: "page" | "filtered" | "all" = "page",
  ) {
    const next = new Set(checked.value);
    for (const row of selectionScope(side, scope))
      next.has(row.key) ? next.delete(row.key) : next.add(row.key);
    return setCheckedKeys([...next]);
  }
  function clearChecked(side?: HysTransferSide) {
    return setCheckedKeys(
      side
        ? checked.value.filter(
            (key) => targetSet.value.has(key) !== (side === "right"),
          )
        : [],
    );
  }
  async function move(
    direction: HysTransferSide,
    requested: readonly K[] = getCheckedKeys(
      direction === "right" ? "left" : "right",
    ),
  ) {
    if (busy.value) return false;
    const right = direction === "right",
      before = [...keys.value],
      known = new Set(before),
      moved = unique(requested).filter((key) => {
        const row = data.value.map.get(key);
        return row && !row.disabled && known.has(key) !== right;
      });
    if (!moved.length) return false;
    const set = new Set(moved),
      next = right
        ? props.targetOrder === "unshift"
          ? [...moved, ...before]
          : [...before, ...moved]
        : before.filter((key) => !set.has(key)),
      ticket = ++moveTicket;
    pending.value = true;
    local.value = next;
    emit("update:modelValue", [...next]);
    if (live.value) emit("change", [...next], direction, [...moved]);
    await nextTick();
    if (ticket !== moveTicket) return false;
    pending.value = false;
    if (
      !live.value ||
      disabled.value ||
      props.loading ||
      !same(next, keys.value)
    )
      return false;
    void setCheckedKeys(checked.value.filter((key) => !set.has(key)));
    announcement.value = transferLabel(words.value.moved, {
      direction: right ? words.value.added : words.value.removed,
      count: moved.length,
    });
    if (props.validateEvent !== false) validate();
    return true;
  }
  function setPage(side: HysTransferSide, value: number) {
    if (busy.value || !Number.isFinite(value)) return;
    const next = Math.max(
      1,
      Math.min(pageCounts.value[side], Math.floor(value)),
    );
    if (next === (numberDrafts.pages ?? pages.value)[side]) return;
    localPages.value[side] = next;
    requestNumbers("pages", side, next);
    emit("pageChange", side, next, pageSizes.value[side]);
  }
  function setPageSize(side: HysTransferSide, value: number) {
    if (busy.value || !Number.isFinite(value) || value < 1) return;
    const next = Math.floor(value);
    if (next === (numberDrafts.pageSizes ?? pageSizes.value)[side]) return;
    localSizes.value[side] = next;
    localPages.value[side] = 1;
    requestNumbers("pageSizes", side, next);
    requestNumbers("pages", side, 1);
    emit("pageSizeChange", side, next);
    emit("pageChange", side, 1, next);
  }
  function setSearch(side: HysTransferSide, value: string) {
    if (busy.value || (queryDraft ?? searchValues.value)[side] === value)
      return;
    const previous = pages.value[side];
    queries.value[side] = value;
    localPages.value[side] = 1;
    const snapshot = { ...(queryDraft ?? searchValues.value), [side]: value };
    queryDraft = snapshot;
    emit("update:searchValues", snapshot);
    void nextTick(() => {
      if (queryDraft === snapshot) queryDraft = undefined;
    });
    if (previous !== 1) requestNumbers("pages", side, 1);
    emit("search", side, value);
  }
  function clearSearch(side?: HysTransferSide) {
    for (const direction of side ? [side] : sides) setSearch(direction, "");
  }
  let queryDraft: Record<HysTransferSide, string> | undefined;
  const numberDrafts: Partial<
    Record<"pages" | "pageSizes", Record<HysTransferSide, number>>
  > = {};
  function requestNumbers(
    name: "pages" | "pageSizes",
    side: HysTransferSide,
    value: number,
  ) {
    const snapshot = {
      ...(numberDrafts[name] ??
        (name === "pages" ? pages.value : pageSizes.value)),
      [side]: value,
    };
    numberDrafts[name] = snapshot;
    emit("update:" + name, snapshot);
    void nextTick(() => {
      if (numberDrafts[name] === snapshot) delete numberDrafts[name];
    });
  }
  function stop() {
    live.value = false;
    moveTicket++;
    checkTicket++;
    pending.value = false;
    queryDraft = undefined;
    delete numberDrafts.pages;
    delete numberDrafts.pageSizes;
  }
  onDeactivated(stop);
  onBeforeUnmount(stop);
  onActivated(() => (live.value = true));
  watch(
    () => [disabled.value, props.loading],
    () => {
      if (disabled.value || props.loading) {
        moveTicket++;
        checkTicket++;
        pending.value = false;
      }
    },
  );
  return {
    live,
    busy,
    pending,
    data,
    keys,
    targetSet,
    checked,
    checkedSet,
    words,
    all,
    filtered,
    visible,
    searchValues,
    pageSizes,
    pages,
    pageCounts,
    pagination,
    announcement,
    getCheckedKeys,
    setCheckedKeys,
    check,
    checkAll,
    invertSelection,
    clearChecked,
    move,
    setPage,
    setPageSize,
    setSearch,
    clearSearch,
    selectionScope,
  };
}
