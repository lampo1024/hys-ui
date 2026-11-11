import { computed, nextTick, ref, shallowRef, watch } from "vue";
import type {
  HysMentionDocument,
  HysMentionEntity,
  HysMentionProps,
} from "./mention";
import {
  normalizeMentionEntities,
  rebaseMentionEntities,
} from "./mentionDocument";
import type { MentionSelection } from "./mentionEditor";

interface Snapshot extends HysMentionDocument {
  selection: MentionSelection;
}
export function mentionEntityKey(entity: HysMentionEntity) {
  return JSON.stringify([
    typeof entity.id,
    entity.id,
    entity.type,
    entity.prefix,
    entity.text,
  ]);
}
export function diffMentionEntities(
  previous: HysMentionEntity[],
  next: HysMentionEntity[],
) {
  function remaining(from: HysMentionEntity[], to: HysMentionEntity[]) {
    const counts = new Map<string, number>();
    for (const entity of to) {
      const key = mentionEntityKey(entity);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return from.filter((entity) => {
      const key = mentionEntityKey(entity);
      const count = counts.get(key) ?? 0;
      if (!count) return true;
      counts.set(key, count - 1);
      return false;
    });
  }
  return {
    added: remaining(next, previous),
    removed: remaining(previous, next),
  };
}
function equalEntities(left: HysMentionEntity[], right: HysMentionEntity[]) {
  return (
    left.length === right.length &&
    left.every(
      (entity, index) =>
        entity.start === right[index].start &&
        entity.end === right[index].end &&
        mentionEntityKey(entity) === mentionEntityKey(right[index]) &&
        entity.label === right[index].label &&
        entity.value === right[index].value &&
        entity.payload === right[index].payload,
    )
  );
}

export function useMentionModel(
  props: HysMentionProps,
  publish: (
    next: HysMentionDocument,
    previous: HysMentionDocument,
    changedText: boolean,
  ) => void,
  accepted: (next: HysMentionDocument, previous: HysMentionDocument) => void,
) {
  const localText = ref(props.defaultValue ?? "");
  const value = computed(() => props.modelValue ?? localText.value);
  const seed =
    props.defaultEntities ?? props.parseEntities?.(value.value) ?? [];
  const local = shallowRef<HysMentionDocument>({
    text: value.value,
    entities: normalizeMentionEntities(value.value, seed),
  });
  const entities = computed(() => {
    const text = value.value;
    const source =
      props.entities ??
      (local.value.text === text
        ? local.value.entities
        : rebaseMentionEntities(local.value, text));
    const normalized = normalizeMentionEntities(text, source);
    return props.invalidEntity === "text" && props.validateEntity
      ? normalized.filter(props.validateEntity)
      : normalized;
  });
  const document = computed<HysMentionDocument>(() => ({
    text: value.value,
    entities: entities.value,
  }));
  let pending: HysMentionDocument | undefined;
  let revision = 0;
  const past: Snapshot[] = [];
  const future: Snapshot[] = [];
  watch(
    value,
    (text) => {
      if (props.entities !== undefined || pending?.text === text) return;
      local.value = {
        text,
        entities: normalizeMentionEntities(text, [
          ...rebaseMentionEntities(local.value, text),
          ...(props.parseEntities?.(text) ?? []),
        ]),
      };
    },
    { flush: "sync" },
  );
  async function commit(
    next: HysMentionDocument,
    selection: MentionSelection,
    notify?: () => void,
    record = true,
    force = false,
  ) {
    const previous = document.value;
    const nextEntities = normalizeMentionEntities(next.text, next.entities);
    const changedText = next.text !== previous.text;
    if (!changedText && equalEntities(previous.entities, nextEntities))
      return false;
    if (
      !force &&
      props.beforeRemove &&
      diffMentionEntities(previous.entities, nextEntities).removed.some(
        (entity) => props.beforeRemove?.(entity) === false,
      )
    )
      return false;
    if (
      pending?.text === next.text &&
      equalEntities(pending.entities, nextEntities)
    )
      return false;
    const requested = { text: next.text, entities: nextEntities };
    const version = ++revision;
    pending = requested;
    if (changedText && props.modelValue === undefined) localText.value = next.text;
    notify?.();
    publish(requested, previous, changedText);
    await nextTick();
    if (version !== revision) return false;
    pending = undefined;
    if (value.value !== next.text) return false;
    if (props.entities === undefined) local.value = requested;
    const result = document.value;
    if (!changedText && equalEntities(result.entities, previous.entities))
      return false;
    if (record) {
      past.push({ ...previous, selection });
      if (past.length > 100) past.shift();
      future.length = 0;
    }
    accepted(result, previous);
    return true;
  }
  async function history(
    direction: "undo" | "redo",
    selection: MentionSelection,
  ) {
    const from = direction === "undo" ? past : future;
    const to = direction === "undo" ? future : past;
    const target = from.at(-1);
    if (!target) return;
    const previous = document.value;
    if (!(await commit(target, selection, undefined, false))) return;
    from.pop();
    to.push({ ...previous, selection });
    return target.selection;
  }
  return { value, entities, document, commit, history };
}
