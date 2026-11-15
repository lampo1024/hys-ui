import { redo, redoDepth, undo, undoDepth, history, historyKeymap, defaultKeymap, insertNewline, isolateHistory } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { bracketMatching, foldGutter, foldKeymap, HighlightStyle, indentUnit, syntaxHighlighting, unfoldEffect, foldedRanges } from "@codemirror/language";
import { Compartment, EditorState, StateEffect, StateField, Transaction, type Extension } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, highlightSpecialChars, keymap, lineNumbers, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, watch, type Ref } from "vue";
import type { JsonEdit, JsonRange } from "./jsonDocument";

const highlights = HighlightStyle.define([
  { tag: tags.propertyName, class: "hys-json-key" },
  { tag: tags.string, class: "hys-json-string" },
  { tag: tags.number, class: "hys-json-number" },
  { tag: tags.bool, class: "hys-json-boolean" },
  { tag: tags.null, class: "hys-json-null" },
]);
const markDiagnostics = StateEffect.define<DecorationSet>();
const diagnostics = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, tr) {
    for (const effect of tr.effects) if (effect.is(markDiagnostics)) return effect.value;
    return marks.map(tr.changes);
  },
  provide: field => EditorView.decorations.from(field),
});

export function useJsonCode(
  host: Ref<HTMLElement | undefined>,
  source: Ref<string>,
  disabled: Readonly<Ref<boolean>>,
  readonly: Readonly<Ref<boolean>>,
  spaces: Readonly<Ref<number>>,
  options: {
    describedBy: string;
    autoIndent: () => boolean | undefined;
    change: (text: string) => void;
    find: () => boolean;
  },
) {
  const editor = shallowRef<EditorView>();
  const selection = shallowRef<JsonRange>({ from: 0, to: 0 });
  const historyState = shallowRef({ undo: false, redo: false });
  const access = new Compartment();
  const indent = new Compartment();
  let active = true;
  let composing = false;
  let pending: string | undefined;

  function mode(): Extension {
    const locked = disabled.value || readonly.value;
    return [
      EditorState.readOnly.of(locked),
      EditorView.editable.of(!locked),
      EditorView.contentAttributes.of({
        "aria-label": "JSON 源码", "aria-describedby": options.describedBy,
        "aria-readonly": String(locked),
        tabindex: disabled.value ? "-1" : "0",
      }),
    ];
  }

  function update(change: ViewUpdate) {
    const { from, to } = change.state.selection.main;
    if (selection.value.from !== from || selection.value.to !== to) selection.value = { from, to };
    historyState.value = { undo: undoDepth(change.state) > 0, redo: redoDepth(change.state) > 0 };
    if (change.docChanged && active && !composing && !change.view.composing && !disabled.value && !readonly.value) {
      publish(change.state.doc.toString());
    }
  }

  function publish(text: string) {
    options.change(text);
    void nextTick(() => {
      if (active && editor.value?.state.doc.toString() === text && source.value !== text) sync(source.value);
    });
  }

  function state(doc: string, range: JsonRange) {
    return EditorState.create({
      doc,
      selection: { anchor: Math.min(range.from, doc.length), head: Math.min(range.to, doc.length) },
      extensions: [
        // LF is the editor delimiter. Keeping CR in the document preserves imported source and offsets.
        EditorState.lineSeparator.of("\n"), access.of(mode()), indent.of(indentUnit.of(" ".repeat(spaces.value || 1))),
        json(), syntaxHighlighting(highlights), history(), drawSelection(), bracketMatching(), lineNumbers(),
        foldGutter({ openText: "⌄", closedText: "›" }), diagnostics,
        highlightSpecialChars({
          addSpecialChars: /\r/g,
          render(code, description, placeholder) {
            const span = document.createElement("span");
            if (code === 13) span.setAttribute("aria-hidden", "true");
            else {
              span.className = "cm-specialChar";
              span.textContent = placeholder;
              if (description) span.setAttribute("aria-label", description);
            }
            return span;
          },
        }),
        keymap.of([
          { key: "Mod-f", run: () => !composing && options.find() },
          { key: "Enter", run: view => {
            if (composing || view.composing || view.state.readOnly) return false;
            if (!options.autoIndent()) return insertNewline(view);
            const { from, to } = view.state.selection.main;
            const line = view.state.sliceDoc(view.state.doc.lineAt(from).from, from);
            const leading = /^[\t ]*/.exec(line)![0];
            const nested = /[\[{][\t ]*$/.test(line) ? " ".repeat(spaces.value) : "";
            const insert = "\n" + leading + nested;
            view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + insert.length },
              userEvent: "input", scrollIntoView: true });
            return true;
          } },
          ...defaultKeymap.filter(binding => binding.key !== "Enter"), ...historyKeymap, ...foldKeymap,
        ]),
        EditorView.updateListener.of(update),
        EditorView.domEventHandlers({
          compositionstart: () => { composing = true; },
          compositionend: () => {
            queueMicrotask(() => {
              if (!active || !composing || !editor.value) return;
              composing = false;
              if (pending !== undefined || disabled.value || readonly.value) {
                const value = pending ?? source.value;
                pending = undefined;
                sync(value, true);
              } else publish(editor.value.state.doc.toString());
            });
          },
        }),
      ],
    });
  }

  function sync(text: string, force = false) {
    const view = editor.value;
    if (!view || view.state.doc.toString() === text) return;
    if (!force && (composing || view.composing)) { pending = text; return; }
    const { scrollTop, scrollLeft } = view.scrollDOM;
    view.setState(state(text, selection.value));
    const { from, to } = view.state.selection.main;
    selection.value = { from, to };
    historyState.value = { undo: false, redo: false };
    view.scrollDOM.scrollTop = scrollTop;
    view.scrollDOM.scrollLeft = scrollLeft;
  }

  onMounted(() => {
    if (host.value) editor.value = new EditorView({ parent: host.value, state: state(source.value, selection.value) });
  });
  onActivated(() => { active = true; sync(source.value, true); editor.value?.requestMeasure(); });
  onDeactivated(() => { active = false; composing = false; pending = undefined; sync(source.value, true); });
  onBeforeUnmount(() => { active = false; editor.value?.destroy(); });
  watch(source, text => { if (active) sync(text); });
  watch([disabled, readonly], () => {
    editor.value?.dispatch({ effects: access.reconfigure(mode()) });
    if (disabled.value) editor.value?.contentDOM.blur();
  }, { flush: "sync" });
  watch(spaces, value => editor.value?.dispatch({ effects: indent.reconfigure(indentUnit.of(" ".repeat(value || 1))) }));

  function canEdit() {
    return !!editor.value && active && !disabled.value && !readonly.value && !composing && !editor.value.composing
      && editor.value.state.doc.toString() === source.value;
  }

  function change(edits: JsonEdit | JsonEdit[]) {
    if (!canEdit()) return false;
    editor.value!.dispatch({
      changes: edits, annotations: [isolateHistory.of("full"), Transaction.userEvent.of("input")],
    });
    return true;
  }

  function replace(text: string) {
    return change({ from: 0, to: source.value.length, insert: text });
  }

  function reveal(range: JsonRange, focus: boolean) {
    const view = editor.value;
    if (!view || disabled.value || view.state.doc.toString() !== source.value) return;
    const effects: StateEffect<unknown>[] = [];
    const end = Math.min(view.state.doc.length, Math.max(range.from + 1, range.to));
    foldedRanges(view.state).between(range.from, end, (from, to) => {
      if (range.from < to && end > from) effects.push(unfoldEffect.of({ from, to }));
    });
    effects.push(EditorView.scrollIntoView(range.from, { y: "center" }));
    view.dispatch({ selection: { anchor: range.from, head: range.to }, effects });
    if (focus) view.focus();
  }

  function mark(ranges: (JsonRange & { kind?: "warning" | "match" | "query" })[]) {
    const view = editor.value;
    if (!view || !active || composing || view.state.doc.toString() !== source.value) return;
    view.dispatch({ effects: markDiagnostics.of(Decoration.set(ranges.flatMap(({ from, to, kind = "error" }) => to > from
      ? [Decoration.mark({ class: "hys-json-" + kind + "-mark" }).range(from, to)]
      : []), true)) });
  }

  function stepHistory(direction: "undo" | "redo", focus: boolean) {
    if (!canEdit()) return;
    (direction === "undo" ? undo : redo)(editor.value!);
    if (focus) void nextTick(() => { if (!disabled.value) editor.value?.focus(); });
  }

  return { editor, selection, historyState, change, replace, reveal, mark, stepHistory };
}
