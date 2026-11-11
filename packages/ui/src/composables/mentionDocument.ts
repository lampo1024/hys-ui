import type {
  HysMentionContext,
  HysMentionDocument,
  HysMentionEntity,
  HysMentionProps,
  HysMentionTrigger,
} from "./mention";

export function mentionTriggers(props: HysMentionProps): HysMentionTrigger[] {
  const prefixes =
    typeof props.prefix === "string"
      ? [props.prefix]
      : (props.prefix ?? (props.triggers?.length ? [] : ["@"]));
  const rules = new Map<string, HysMentionTrigger>();
  for (const prefix of prefixes) if (prefix) rules.set(prefix, { prefix });
  for (const trigger of props.triggers ?? [])
    if (trigger.prefix) rules.set(trigger.prefix, trigger);
  return [...rules.values()].sort((a, b) => b.prefix.length - a.prefix.length);
}

export function matchMention(
  text: string,
  caret: number,
  rules: readonly HysMentionTrigger[],
  defaults: Pick<
    HysMentionProps,
    "boundary" | "allowSpaces" | "matchTrigger" | "split"
  >,
): HysMentionContext | undefined {
  const end = Math.max(0, Math.min(text.length, Math.trunc(caret) || 0));
  const before = text.slice(0, end);
  let best: HysMentionContext | undefined;
  for (const rule of rules) {
    const { prefix } = rule;
    const matcher = rule.match ?? defaults.matchTrigger;
    const custom = matcher?.({ text, caret: end, prefix });
    if (matcher && !custom) continue;
    const start = custom?.start ?? before.lastIndexOf(prefix);
    if (
      !Number.isInteger(start) ||
      start < 0 ||
      start + prefix.length > end ||
      !before.startsWith(prefix, start)
    )
      continue;
    if (best && start < best.start + best.prefix.length) continue;
    const boundary = rule.boundary ?? defaults.boundary;
    if (typeof boundary === "function" && !boundary(text, start)) continue;
    if (
      boundary === "word" &&
      /[\p{L}\p{N}\p{M}_]$/u.test(before.slice(0, start))
    )
      continue;
    const query = custom?.query ?? before.slice(start + prefix.length);
    const allowSpaces = rule.allowSpaces ?? defaults.allowSpaces;
    const split = rule.split ?? defaults.split;
    if (
      !matcher &&
      (/[\r\n]/.test(query) ||
        (!allowSpaces && /\s/.test(query)) ||
        (split &&
          (!allowSpaces || /\S/.test(split)) &&
          query.includes(split)) ||
        rules.some((other) => query.includes(other.prefix)))
    )
      continue;
    best = { prefix, query, start, end };
  }
  return best;
}

export function normalizeMentionEntities(
  text: string,
  input: readonly HysMentionEntity[],
): HysMentionEntity[] {
  const valid = input
    .filter(
      (entity) =>
        entity &&
        typeof entity.text === "string" &&
        entity.text.length > 0 &&
        (typeof entity.id === "string" || typeof entity.id === "number") &&
        (typeof entity.value === "string" ||
          typeof entity.value === "number") &&
        typeof entity.label === "string" &&
        typeof entity.type === "string" &&
        typeof entity.prefix === "string" &&
        Number.isInteger(entity.start) &&
        Number.isInteger(entity.end) &&
        entity.start >= 0 &&
        entity.end <= text.length &&
        entity.start < entity.end &&
        text.slice(entity.start, entity.end) === entity.text,
    )
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const result: HysMentionEntity[] = [];
  let boundary = 0;
  for (const entity of valid) {
    if (entity.start < boundary) continue;
    result.push({ ...entity });
    boundary = entity.end;
  }
  return result;
}

export function serializeMentionDocument(document: HysMentionDocument): string {
  return JSON.stringify({
    text: document.text,
    entities: normalizeMentionEntities(document.text, document.entities),
  });
}

export function deserializeMentionDocument(source: string): HysMentionDocument {
  const value: unknown = JSON.parse(source);
  if (
    !value ||
    typeof value !== "object" ||
    !("text" in value) ||
    typeof value.text !== "string" ||
    !("entities" in value) ||
    !Array.isArray(value.entities)
  )
    throw new TypeError("Invalid Mention document");
  return {
    text: value.text,
    entities: normalizeMentionEntities(value.text, value.entities),
  };
}

export function rebaseMentionEntities(
  before: HysMentionDocument,
  text: string,
  range?: { start: number; end: number },
): HysMentionEntity[] {
  if (!range && before.text === text) return before.entities;
  let start = range?.start ?? 0;
  let end = range?.end ?? before.text.length;
  if (!range) {
    const min = Math.min(before.text.length, text.length);
    while (start < min && before.text[start] === text[start]) start++;
    let nextEnd = text.length;
    while (
      end > start &&
      nextEnd > start &&
      before.text[end - 1] === text[nextEnd - 1]
    ) {
      end--;
      nextEnd--;
    }
  }
  const delta = text.length - before.text.length;
  return before.entities.flatMap((entity) => {
    if (entity.end <= start) return [entity];
    if (entity.start >= end)
      return [
        { ...entity, start: entity.start + delta, end: entity.end + delta },
      ];
    return [];
  });
}

export function mentionSegments(
  text: string,
  entities: readonly HysMentionEntity[],
) {
  const segments: { text: string; start: number; entity?: HysMentionEntity }[] =
    [];
  let offset = 0;
  for (const entity of entities) {
    if (offset < entity.start)
      segments.push({ text: text.slice(offset, entity.start), start: offset });
    segments.push({ text: entity.text, start: entity.start, entity });
    offset = entity.end;
  }
  if (offset < text.length || !segments.length)
    segments.push({ text: text.slice(offset), start: offset });
  return segments;
}
