import { computed, nextTick, ref, watch, type Ref } from "vue";
import { SearchQuery } from "@codemirror/search";
import { Text } from "@codemirror/state";
import type { MarkdownRange } from "./markdownSource";

export function useMarkdownSearch(
  source: Ref<string>,
  selection: Ref<MarkdownRange>,
  reveal: (range: MarkdownRange) => void,
  replace: (edits: (MarkdownRange & { insert: string })[]) => boolean,
) {
  const find = ref("");
  const replacement = ref("");
  const sensitive = ref(false);
  const index = ref(-1);
  const matches = computed(() => {
    if (!find.value) return [];
    const cursor = new SearchQuery({ search: find.value, caseSensitive: sensitive.value, literal: true })
      .getCursor(Text.of(source.value.split("\n")));
    const result: MarkdownRange[] = [];
    for (let next = cursor.next(); !next.done; next = cursor.next()) {
      result.push({ from: next.value.from, to: next.value.to });
    }
    return result;
  });
  function step(direction: 1 | -1) {
    if (!matches.value.length) return;
    let next = index.value + direction;
    if (index.value < 0) {
      next = direction === 1 ? matches.value.findIndex(match => match.from >= selection.value.from)
        : matches.value.reduce((last, match, i) => match.to <= selection.value.from ? i : last, -1);
      if (next < 0) next = direction === 1 ? 0 : matches.value.length - 1;
    }
    index.value = (next + matches.value.length) % matches.value.length;
    reveal(matches.value[index.value]);
  }
  watch([find, sensitive], () => {
    index.value = -1;
    step(1);
  });
  watch(source, () => { index.value = -1; }, { flush: "sync" });
  function replaceCurrent() {
    const match = matches.value[index.value];
    if (!match || !replace([{ ...match, insert: replacement.value }])) return;
    void nextTick(() => {
      if (!matches.value.length) return;
      const next = matches.value.findIndex(range => range.from >= match.from + replacement.value.length);
      index.value = next < 0 ? 0 : next;
      reveal(matches.value[index.value]);
    });
  }
  function replaceAll() {
    if (matches.value.length) replace(matches.value.map(range => ({ ...range, insert: replacement.value })));
  }
  return { find, replacement, sensitive, index, matches, step, replaceCurrent, replaceAll };
}
