import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import type {
  HysMentionContext,
  HysMentionDataOption,
  HysMentionFieldNames,
  HysMentionLoader,
  HysMentionOption,
  HysMentionPage,
  HysMentionProps,
  HysMentionSearchMode,
  HysMentionTrigger,
  HysMentionUser,
} from "./mention";

export interface MentionEntry {
  key: string;
  option: HysMentionOption;
  user: HysMentionUser;
  created?: boolean;
  remote?: boolean;
}
interface Source {
  key: string;
  loader?: HysMentionLoader;
  options?: readonly HysMentionDataOption[];
  group?: string;
  fields?: HysMentionFieldNames;
}
interface PageState {
  page: number;
  cursor?: string | number;
  hasMore: boolean;
  items: readonly HysMentionDataOption[];
  failed?: boolean;
}
interface HistoryRecord {
  option: HysMentionOption;
  prefix: string;
  count: number;
}

function optionEntry(
  option: HysMentionOption,
  legacy?: HysMentionUser,
): MentionEntry {
  const id = option.id ?? legacy?.id ?? option.value;
  return {
    option,
    key: (option.type ?? option.prefix ?? "") + ":" + typeof id + ":" + id,
    user: legacy ?? {
      id: String(id),
      name:
        typeof option.label === "string" ? option.label : String(option.value),
      disabled: option.disabled,
    },
  };
}
function toOption(
  source: HysMentionDataOption,
  fields?: HysMentionFieldNames,
  group?: string,
) {
  const raw = source as Record<string, unknown>;
  const value = raw[fields?.value ?? "value"];
  if (typeof value !== "string" && typeof value !== "number") return;
  const option: HysMentionOption = { ...(source as HysMentionOption), value };
  if (fields) {
    const label = raw[fields.label ?? "label"];
    const id = raw[fields.id ?? "id"];
    option.label =
      typeof label === "string" || typeof label === "function"
        ? (label as HysMentionOption["label"])
        : undefined;
    option.id =
      typeof id === "string" || typeof id === "number" ? id : undefined;
    option.disabled = !!raw[fields.disabled ?? "disabled"];
    for (const name of ["group", "avatar", "description", "type"] as const) {
      const field = raw[fields[name] ?? name];
      option[name] = typeof field === "string" ? field : undefined;
    }
    option.payload = raw.payload ?? source;
  }
  option.group ??= group;
  return option;
}

const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase();
const compactPinyin = (text: string) =>
  normalize(text)
    .replace(/ü/g, "v")
    .replace(/[\s'’-]/g, "");
function fuzzy(query: string, text: string) {
  let start = 0;
  for (const letter of query) {
    const index = text.indexOf(letter, start);
    if (index < 0) return false;
    start = index + letter.length;
  }
  return true;
}
function fieldValue(option: HysMentionOption, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      option,
    );
}
function searchText(value: unknown): string {
  if (Array.isArray(value))
    return value.map(searchText).filter(Boolean).join(" ");
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
function positive(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}
function readPage(
  result: Awaited<ReturnType<HysMentionLoader>>,
): HysMentionPage {
  return Array.isArray(result)
    ? { items: result, hasMore: false }
    : (result as HysMentionPage);
}

export function useMentionOptions(
  props: HysMentionProps,
  context: Readonly<Ref<HysMentionContext | undefined>>,
  trigger: Readonly<Ref<HysMentionTrigger | undefined>>,
  dismissed: Readonly<Ref<boolean>>,
  text: Readonly<Ref<string>>,
  onError: (error: unknown, context: HysMentionContext) => void,
) {
  const sources = computed<Source[]>(() => {
    const rule = trigger.value;
    const legacyOptions = rule?.options ?? props.options;
    const defaultLoader = rule?.loadOptions ?? props.loadOptions;
    return [
      {
        key: "$default",
        options: legacyOptions,
        loader: defaultLoader,
        fields: props.fieldNames,
      },
      ...(props.sources ?? [])
        .filter(
          (source) =>
            !source.prefixes ||
            source.prefixes.includes(context.value?.prefix ?? ""),
        )
        .map((source) => ({
          key: "source:" + source.key,
          loader: source.loadOptions,
          options: source.options,
          fields: source.fieldNames ?? props.fieldNames,
          group: source.group,
        })),
    ];
  });
  const remoteSources = computed(() =>
    sources.value.filter((source) => source.loader),
  );
  const sourceIds = new WeakMap<HysMentionLoader, number>();
  let nextLoaderId = 0;
  const signature = computed(() =>
    JSON.stringify(
      remoteSources.value.map(({ key, loader }) => {
        if (!sourceIds.has(loader!)) sourceIds.set(loader!, ++nextLoaderId);
        return [key, sourceIds.get(loader!)];
      }),
    ),
  );
  const contextKey = computed(() => {
    const value = context.value;
    return value && !dismissed.value
      ? JSON.stringify([
          value.prefix,
          value.query,
          value.start,
          value.manual,
          signature.value,
          props.pageSize,
        ])
      : undefined;
  });
  const pages = shallowRef(new Map<string, PageState>());
  const remotePending = ref(false);
  const loadingMore = ref(false);
  const loadError = shallowRef<{ reason: unknown }>();
  const busy = computed(
    () => props.loading || (remotePending.value && !loadingMore.value),
  );
  const hasMore = computed(() =>
    remoteSources.value.some(({ key }) => pages.value.get(key)?.hasMore),
  );
  const cache = new Map<string, { expires: number; page: HysMentionPage }>();
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastStarted = -Infinity;
  function cancelLoad() {
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
    remotePending.value = false;
    loadingMore.value = false;
  }
  function cacheSettings() {
    if (!props.cache) return;
    const options = typeof props.cache === "object" ? props.cache : undefined;
    return {
      ttl: positive(options?.ttl, 30000),
      limit: positive(options?.maxEntries, 40),
    };
  }
  async function fetchPage(
    source: Source,
    query: HysMentionContext,
    page: number,
    cursor: string | number | undefined,
    signal: AbortSignal,
    retry: boolean,
  ) {
    const loader = source.loader!;
    const pageSize = Math.max(1, positive(props.pageSize, 20));
    const key = JSON.stringify([
      source.key,
      sourceIds.get(loader),
      query.prefix,
      query.query,
      pageSize,
      page,
      cursor,
    ]);
    const policy = cacheSettings();
    const cached = policy && !retry ? cache.get(key) : undefined;
    if (cached && cached.expires > Date.now()) {
      cache.delete(key);
      cache.set(key, cached);
      return cached.page;
    }
    cache.delete(key);
    const result = readPage(
      await loader({
        ...query,
        text: text.value,
        page,
        pageSize,
        cursor,
        signal,
      }),
    );
    if (!signal.aborted && policy?.limit && policy.ttl) {
      cache.set(key, { expires: Date.now() + policy.ttl, page: result });
      while (cache.size > policy.limit)
        cache.delete(cache.keys().next().value!);
    }
    return result;
  }
  async function run(
    mode: "initial" | "more" | "retry",
    signal: AbortSignal,
    key: string,
    query: HysMentionContext,
  ) {
    if (signal.aborted || contextKey.value !== key) return false;
    lastStarted = Date.now();
    const state = pages.value;
    const jobs = remoteSources.value.filter((source) => {
      const page = state.get(source.key);
      return (
        mode === "initial" ||
        (mode === "more" ? page?.hasMore && !page.failed : page?.failed)
      );
    });
    let changed = false;
    await Promise.all(
      jobs.map(async (source) => {
        const previous = state.get(source.key);
        const number = (previous?.page ?? 0) + 1;
        try {
          const page = await fetchPage(
            source,
            query,
            number,
            previous?.cursor,
            signal,
            mode === "retry",
          );
          if (signal.aborted || contextKey.value !== key) return;
          const items = [...(previous?.items ?? []), ...page.items];
          const hasMore =
            page.hasMore ??
            (page.nextCursor !== undefined
              ? page.nextCursor !== null
              : page.total !== undefined && items.length < page.total);
          const next = new Map(pages.value);
          next.set(source.key, {
            page: number,
            cursor: page.nextCursor ?? undefined,
            hasMore,
            items,
          });
          pages.value = next;
          changed = true;
        } catch (reason) {
          if (signal.aborted || contextKey.value !== key) return;
          const next = new Map(pages.value);
          next.set(source.key, {
            page: previous?.page ?? 0,
            cursor: previous?.cursor,
            hasMore: previous?.hasMore ?? false,
            items: previous?.items ?? [],
            failed: true,
          });
          pages.value = next;
          loadError.value = { reason };
          onError(reason, query);
        }
      }),
    );
    if (!signal.aborted && controller?.signal === signal) {
      controller = undefined;
      remotePending.value = false;
      loadingMore.value = false;
    }
    return changed;
  }
  function load(mode: "initial" | "more" | "retry") {
    if (mode !== "initial" && remotePending.value)
      return Promise.resolve(false);
    cancelLoad();
    if (mode === "initial") pages.value = new Map();
    if (mode !== "more") loadError.value = undefined;
    const query = context.value;
    const key = contextKey.value;
    if (!query || !key || !remoteSources.value.length)
      return Promise.resolve(false);
    const request = new AbortController();
    controller = request;
    remotePending.value = true;
    loadingMore.value =
      mode !== "initial" &&
      [...pages.value.values()].some(({ items }) => items.length);
    const delay =
      mode === "initial"
        ? Math.max(
            positive(props.debounce, 180),
            positive(props.throttle, 0) - (Date.now() - lastStarted),
          )
        : 0;
    if (delay) {
      timer = setTimeout(
        () => void run(mode, request.signal, key, query),
        delay,
      );
      return Promise.resolve(false);
    }
    return run(mode, request.signal, key, query);
  }
  watch(
    [contextKey, () => props.debounce, () => props.throttle],
    () => void load("initial"),
    { flush: "post" },
  );
  onBeforeUnmount(cancelLoad);
  onDeactivated(cancelLoad);
  const retry = () => {
    void load("retry");
  };
  const loadMore = () =>
    hasMore.value ? load("more") : Promise.resolve(false);

  const history = shallowRef<HistoryRecord[]>([]);
  function readHistory() {
    history.value = [];
    if (!props.historyKey || typeof window === "undefined") return;
    try {
      const data: unknown = JSON.parse(
        window.localStorage.getItem(props.historyKey) ?? "[]",
      );
      if (Array.isArray(data))
        history.value = data.filter(
          (item) =>
            item &&
            typeof item.prefix === "string" &&
            Number.isFinite(item.count) &&
            item.option &&
            ["number", "string"].includes(typeof item.option.value),
        );
    } catch {
      /* Browser storage may be disabled. */
    }
  }
  onMounted(readHistory);
  watch(() => props.historyKey, readHistory);
  function remember(option: HysMentionOption, prefix: string) {
    const key = optionEntry(option).key;
    const records = history.value.filter(
      (item) => item.prefix !== prefix || optionEntry(item.option).key !== key,
    );
    const previous = history.value.find(
      (item) => item.prefix === prefix && optionEntry(item.option).key === key,
    );
    history.value = [
      { option, prefix, count: (previous?.count ?? 0) + 1 },
      ...records,
    ].slice(0, positive(props.recentLimit, 8));
    if (!props.historyKey) return;
    try {
      window.localStorage.setItem(
        props.historyKey,
        JSON.stringify(
          history.value.map(({ prefix, count, option }) => ({
            prefix,
            count,
            option: {
              id: option.id,
              value: option.value,
              label: optionEntry(option).user.name,
              type: option.type,
              avatar: option.avatar,
            },
          })),
        ),
      );
    } catch {
      /* Keep in-memory history if persistence is unavailable. */
    }
  }

  const entries = computed<MentionEntry[]>(() => {
    const result: MentionEntry[] = [];
    if (
      !trigger.value?.options &&
      !props.options &&
      !props.loadOptions &&
      !trigger.value?.loadOptions
    )
      for (const user of props.users ?? [])
        result.push(
          optionEntry(
            {
              id: user.id,
              value: user.name,
              label: user.name,
              disabled: user.disabled,
            },
            user,
          ),
        );
    for (const source of sources.value) {
      const items = source.options ?? [];
      const remote = pages.value.get(source.key)?.items ?? [];
      for (const [index, item] of [...items, ...remote].entries()) {
        const option = toOption(item, source.fields, source.group);
        if (option)
          result.push({
            ...optionEntry(option),
            remote: index >= items.length,
          });
      }
    }
    return result;
  });

  const modes = computed<readonly HysMentionSearchMode[]>(() => {
    const value = trigger.value?.searchMode ?? props.searchMode ?? "includes";
    return typeof value === "string" ? [value] : value;
  });
  const pinyin = shallowRef<typeof import("pinyin-pro").pinyin>();
  let pinyinLoading = false;
  watch(
    () => modes.value.some((mode) => mode === "pinyin" || mode === "initials"),
    (enabled) => {
      if (!enabled || pinyin.value || pinyinLoading) return;
      pinyinLoading = true;
      void import("pinyin-pro")
        .then((module) => {
          pinyin.value = module.pinyin;
        })
        .catch(() => {})
        .finally(() => {
          pinyinLoading = false;
        });
    },
    { immediate: true },
  );
  const phonetics = new Map<string, { full: string; initials: string }>();
  function score(option: HysMentionOption, name: string, query: string) {
    if (!query) return 0;
    const fields = [
      name,
      String(option.value),
      ...(option.keywords ?? []),
      ...(props.searchFields ?? []).map((field) =>
        searchText(
          typeof field === "function"
            ? field(option)
            : fieldValue(option, field),
        ),
      ),
    ];
    const terms = fields.map(normalize);
    if (terms.some((term) => term === query)) return 5;
    if (terms.some((term) => term.startsWith(query))) return 4;
    if (
      terms.join(" ").includes(query) ||
      (query.includes(" ") &&
        query
          .split(/\s+/)
          .every((word) => terms.some((term) => term.includes(word))))
    )
      return 3;
    if (
      modes.value.includes("fuzzy") &&
      terms.some((term) => fuzzy(query, term))
    )
      return 1;
    if (
      !pinyin.value ||
      !modes.value.some((mode) => mode === "pinyin" || mode === "initials")
    )
      return -1;
    const needle = compactPinyin(query);
    for (const field of fields) {
      if (!/\p{Script=Han}/u.test(field)) continue;
      let phonetic = phonetics.get(field);
      if (!phonetic) {
        const parts = pinyin.value(field, {
          toneType: "none",
          type: "array",
          nonZh: "consecutive",
        });
        phonetic = {
          full: compactPinyin(parts.join("")),
          initials: compactPinyin(parts.map((part) => part[0]).join("")),
        };
        phonetics.set(field, phonetic);
      }
      if (
        (modes.value.includes("pinyin") && phonetic.full.includes(needle)) ||
        (modes.value.includes("initials") && phonetic.initials.includes(needle))
      )
        return 2;
    }
    return -1;
  }
  const choices = computed(() => {
    const query = context.value;
    if (!query || dismissed.value || busy.value) return [];
    const normalized = normalize(query.query.trim());
    const rule = trigger.value;
    const filter = rule?.filterOption ?? props.filterOption;
    const seen = new Set<string>();
    const candidates = entries.value.slice();
    if (!normalized) {
      const previous = history.value.filter(
        (item) => item.prefix === query.prefix,
      );
      const recentGroup = props.locale?.recent ?? "最近使用";
      const recommendedGroup = props.locale?.recommended ?? "常用推荐";
      const recommended = [
        ...(props.recommendations ?? []),
        ...candidates
          .filter(({ option }) => option.recommended)
          .map(({ option }) => option),
        ...previous
          .filter(({ count }) => count > 1)
          .sort((a, b) => b.count - a.count)
          .map(({ option }) => option),
      ];
      candidates.unshift(
        ...recommended.map((option) =>
          optionEntry({ ...option, group: recommendedGroup }),
        ),
        ...previous.map(({ option }) =>
          optionEntry({ ...option, group: recentGroup }),
        ),
      );
    }
    const ranked = candidates.flatMap((entry) => {
      const { option, user, key } = entry;
      if (
        seen.has(key) ||
        (option.prefix !== undefined && option.prefix !== query.prefix)
      )
        return [];
      const relevance = score(option, user.name, normalized);
      const accepted =
        typeof filter === "function"
          ? filter(query.query, option, query.prefix)
          : filter === false ||
            (filter !== true && entry.remote) ||
            relevance >= 0;
      if (!accepted) return [];
      seen.add(key);
      const group = props.groupBy?.(option, query) ?? option.group;
      const disabled =
        user.disabled || props.canSelect?.(option, query) === false;
      return [
        {
          entry: {
            ...entry,
            option: { ...option, group },
            user: disabled === user.disabled ? user : { ...user, disabled },
          },
          relevance,
        },
      ];
    });
    const sorter = props.sortOptions;
    if (sorter)
      ranked.sort((a, b) =>
        typeof sorter === "function"
          ? sorter(a.entry.option, b.entry.option, query)
          : b.relevance - a.relevance,
      );
    const max = positive(props.maxOptions, 8);
    const matches: MentionEntry[] = ranked
      .slice(0, max || undefined)
      .map(({ entry }) => entry);
    if (
      !loadError.value &&
      (rule?.allowCreate ?? props.allowCreate) &&
      normalized &&
      !candidates.some(
        ({ option }) =>
          (!option.prefix || option.prefix === query.prefix) &&
          normalize(String(option.value)) === normalized,
      )
    ) {
      const created = props.createOption?.(query) ?? {
        value: query.query,
        label: (props.locale?.create ?? "创建 {value}").replace(
          "{value}",
          query.query,
        ),
      };
      if (created && props.canSelect?.(created, query) !== false) {
        const entry = optionEntry(created);
        if (!seen.has(entry.key)) matches.push({ ...entry, created: true });
      }
    }
    return matches;
  });
  const enabled = computed(() =>
    choices.value.filter(({ user }) => !user.disabled),
  );
  return {
    entries,
    choices,
    enabled,
    busy,
    loadingMore,
    hasMore,
    loadError,
    retry,
    loadMore,
    cancelLoad,
    remember,
  };
}
