import { readonly, shallowRef } from "vue";
import { hysBuiltinIcons } from "./iconBuiltins";
import { iconAssetUrl } from "./iconSafety";
import type {
  HysIconAsset,
  HysIconConflict,
  HysIconEntry,
  HysIconLibrary,
  HysIconRecord,
  HysIconRegistry,
  HysIconSearch,
  HysIconSource,
} from "./iconTypes";

interface Stored {
  entry: HysIconEntry;
  record: HysIconRecord;
  identifiers: string[];
  searchFields: string[];
}
const keyPattern = /^[a-z0-9][a-z0-9._-]{0,95}$/;
function key(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!keyPattern.test(normalized))
    throw new Error("Invalid icon identifier: " + value);
  return normalized;
}
function fullName(name: string) {
  const value = name.trim().toLowerCase();
  return value.includes(":") ? value : "core:" + value;
}
function isSource(value: unknown): value is HysIconSource {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  return ["svg", "sprite", "image", "font", "text", "component"].includes(
    String(value.type),
  );
}
function isSubsequence(text: string, word: string) {
  let index = 0;
  for (const letter of text)
    if (letter === word[index] && ++index === word.length) return true;
  return false;
}
function matchRank(fields: readonly string[], word: string, fuzzy: boolean) {
  if (fields.includes(word)) return 0;
  if (fields.some((field) => field.startsWith(word))) return 1;
  if (fields.some((field) => field.includes(word))) return 2;
  return fuzzy && fields.some((field) => isSubsequence(field, word))
    ? 3
    : Infinity;
}

export function createHysIconRegistry(
  options: { builtins?: boolean } = {},
): HysIconRegistry {
  let entries = new Map<string, Stored>();
  let aliases = new Map<string, string>();
  const revision = shallowRef(0);
  const cache = new WeakMap<Function, HysIconSource>();
  const pending = new WeakMap<Function, Promise<HysIconSource>>();
  const imageCache = new Map<string, Promise<void>>();
  function stored(name: string) {
    const normalized = fullName(name);
    return (
      entries.get(normalized) ?? entries.get(aliases.get(normalized) ?? "")
    );
  }
  function reindex(next: Map<string, Stored>, conflict: HysIconConflict) {
    const mapped = new Map<string, string>();
    for (const { record } of next.values())
      for (const alias of record.aliases) {
        const taken = next.has(alias) || mapped.has(alias);
        if (taken && conflict === "error")
          throw new Error("Duplicate icon alias: " + alias);
        if (!next.has(alias) && (!taken || conflict === "replace"))
          mapped.set(alias, record.name);
      }
    entries = next;
    aliases = mapped;
    revision.value++;
  }
  function register(
    library: HysIconLibrary,
    conflict: HysIconConflict = "error",
  ) {
    const namespace = key(library.namespace);
    const next = new Map(entries);
    for (const [raw, value] of Object.entries(library.icons)) {
      const short = key(raw),
        name = namespace + ":" + short;
      if (next.has(name)) {
        if (conflict === "error")
          throw new Error("Duplicate icon name: " + name);
        if (conflict === "keep") continue;
        next.delete(name);
      }
      const entry: HysIconEntry =
        typeof value === "function" || isSource(value)
          ? { source: value }
          : value;
      if (!entry.source && !Object.keys(entry.variants ?? {}).length)
        throw new Error("Icon requires a source: " + name);
      const record: HysIconRecord = {
        name,
        namespace,
        version: library.version,
        label: entry.label ?? short,
        category: entry.category ?? "其他",
        keywords: entry.keywords ?? [],
        aliases: [
          ...new Set(
            (entry.aliases ?? []).map((alias) => namespace + ":" + key(alias)),
          ),
        ],
        variants: [
          ...new Set([
            ...(entry.source ? ["outline"] : []),
            ...(typeof entry.source === "object" && entry.source.type === "svg"
              ? ["round", "sharp", "bold", "thin"]
              : []),
            ...Object.keys(entry.variants ?? {}),
          ]),
        ],
        directional: entry.directional === true,
      };
      const identifiers = [name, short, ...record.aliases];
      identifiers.push(
        ...record.aliases.map((alias) => alias.slice(namespace.length + 1)),
      );
      next.set(name, {
        entry,
        record,
        identifiers,
        searchFields: [...identifiers, record.label, ...record.keywords].map(
          (field) => field.toLowerCase(),
        ),
      });
    }
    reindex(next, conflict);
  }
  function unregister(namespace: string) {
    const normalized = key(namespace);
    reindex(
      new Map(
        [...entries].filter(([, item]) => item.record.namespace !== normalized),
      ),
      "keep",
    );
  }
  function asset(name: string, variant = "outline"): HysIconAsset | undefined {
    const entry = stored(name)?.entry;
    return (
      entry &&
      ((entry.variants && Object.hasOwn(entry.variants, variant)
        ? entry.variants[variant]
        : undefined) ??
        entry.source ??
        entry.variants?.outline ??
        Object.values(entry.variants ?? {})[0])
    );
  }
  function get(name: string, variant?: string) {
    const value = asset(name, variant);
    return typeof value === "function" ? cache.get(value) : value;
  }
  async function load(name: string, variant?: string) {
    const value = asset(name, variant);
    if (!value) throw new Error("Icon not found: " + name);
    if (typeof value !== "function") return value;
    const existing = cache.get(value);
    if (existing) return existing;
    const inflight = pending.get(value);
    if (inflight) return inflight;
    const request = Promise.resolve()
      .then(value)
      .then((result) => {
        const source = result && "default" in result ? result.default : result;
        if (!isSource(source)) throw new Error("Invalid icon source: " + name);
        cache.set(value, source);
        return source;
      })
      .finally(() => pending.delete(value));
    pending.set(value, request);
    return request;
  }
  async function warmImage(
    source: HysIconSource,
    allowedOrigins?: readonly string[],
  ) {
    if (
      source.type === "sprite" &&
      !iconAssetUrl(source.href, allowedOrigins, true)
    )
      throw new Error("Invalid icon sprite URL");
    if (source.type !== "image") return source;
    const url = iconAssetUrl(source.src, allowedOrigins);
    if (!url) throw new Error("Invalid icon image URL");
    if (typeof Image === "undefined") return source;
    let inflight = imageCache.get(url);
    if (!inflight) {
      inflight = new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.referrerPolicy = "no-referrer";
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to preload icon image"));
        image.src = url;
      }).catch((error) => {
        imageCache.delete(url);
        throw error;
      });
      imageCache.set(url, inflight);
      if (imageCache.size > 150)
        imageCache.delete(imageCache.keys().next().value!);
    }
    await inflight;
    return source;
  }
  function list() {
    return [...entries.values()].map(({ record }) => record);
  }
  function search(query: string, filter: HysIconSearch = {}) {
    const normalized = query.trim().toLowerCase();
    const words = normalized ? normalized.split(/\s+/) : [];
    const results: { record: HysIconRecord; rank: number }[] = [];
    for (const { record, identifiers, searchFields } of entries.values()) {
      if (
        (filter.namespace && record.namespace !== filter.namespace) ||
        (filter.category && record.category !== filter.category) ||
        (filter.variant && !record.variants.includes(filter.variant))
      )
        continue;
      const rank = identifiers.includes(normalized)
        ? -1
        : words.reduce(
            (total, word) =>
              total + matchRank(searchFields, word, filter.fuzzy !== false),
            0,
          );
      if (Number.isFinite(rank)) results.push({ record, rank });
    }
    if (words.length) results.sort((a, b) => a.rank - b.rank);
    return results.map(({ record }) => record);
  }
  if (options.builtins !== false) register(hysBuiltinIcons);
  return {
    revision: readonly(revision),
    register,
    unregister,
    resolve: (name) => stored(name)?.record,
    get,
    load,
    list,
    search,
    preload: (names, variant, allowedOrigins) =>
      Promise.allSettled(
        names.map((name) =>
          load(name, variant).then((source) =>
            warmImage(source, allowedOrigins),
          ),
        ),
      ),
  };
}
export const hysIconRegistry = createHysIconRegistry();
