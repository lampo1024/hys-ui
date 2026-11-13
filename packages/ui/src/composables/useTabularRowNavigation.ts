import { computed, ref } from "vue";

export function useTabularRowNavigation(options: {
  enabled: () => boolean;
  table: () => HTMLElement | null | undefined;
  tokens: () => readonly string[];
  attribute: string;
  toggle: (token: string) => boolean;
}) {
  const focused = ref<string>();
  const tabStop = computed(() => {
    const tokens = options.tokens();
    return focused.value !== undefined && tokens.includes(focused.value)
      ? focused.value
      : tokens[0];
  });
  function focusRow(token: string) {
    if (!options.enabled() || !options.tokens().includes(token)) return false;
    const row = Array.from(
      options
        .table()
        ?.querySelectorAll<HTMLElement>(
          `:scope > tbody > tr[${options.attribute}]`,
        ) ?? [],
    ).find((element) => element.getAttribute(options.attribute) === token);
    if (!row) return false;
    row.focus();
    return true;
  }
  function keydown(event: KeyboardEvent, token: string) {
    if (
      event.target !== event.currentTarget ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !options.enabled()
    )
      return;
    const tokens = options.tokens();
    const index = tokens.indexOf(token);
    if (index < 0) return;
    if (event.key === " " && options.toggle(token)) {
      event.preventDefault();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
      return;
    }
    const target =
      event.key === "ArrowDown"
        ? Math.min(index + 1, tokens.length - 1)
        : event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tokens.length - 1
              : -1;
    if (target >= 0) {
      event.preventDefault();
      focusRow(tokens[target]);
    }
  }
  function rowNavigationAttrs(token: string) {
    return options.enabled()
      ? {
          tabindex: tabStop.value === token ? 0 : -1,
          onFocus: () => {
            focused.value = token;
          },
          onKeydown: (event: KeyboardEvent) => keydown(event, token),
        }
      : {};
  }
  return { focusRow, rowNavigationAttrs };
}
