import { Compartment, EditorSelection, EditorState, Transaction, type ChangeSpec } from "@codemirror/state";
import { EditorView, drawSelection, keymap, placeholder as codePlaceholder, type ViewUpdate } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, isolateHistory, redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { insertNewlineContinueMarkupCommand, markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch, type Ref } from "vue";
import type { MarkdownEdit, MarkdownRange } from "./markdownSource";

export function useMarkdownCode(
  mount: Ref<HTMLElement | undefined>,
  source: Ref<string>,
  disabled: Readonly<Ref<boolean>>,
  readonly: Readonly<Ref<boolean>>,
  hint: Readonly<Ref<string>>,
  options: {
    change: (text: string) => void;
    invalidate: () => void;
    shortcut: (key: "bold" | "italic" | "link" | "find") => boolean;
  },
) {
  const editor = shallowRef<EditorView>();
  const viewport = shallowRef<HTMLElement>();
  const ready = ref(false);
  const historyState = ref({ undo: false, redo: false });
  const selection = shallowRef<MarkdownRange>({ from: 0, to: 0 });
  const lock = new Compartment();
  const placeholder = new Compartment();
  const normalize = (value: string) => value.replace(/\r\n?/g, "\n");
  let suspended = false;
  let replacing = false;
  let armed = false;
  let pendingExternal: string | undefined;

  function update(update: ViewUpdate) {
    historyState.value = { undo: undoDepth(update.state) > 0, redo: redoDepth(update.state) > 0 };
    selection.value = { from: update.state.selection.main.from, to: update.state.selection.main.to };
    if (update.docChanged && !replacing && !suspended) {
      const text = update.state.doc.toString();
      if (armed || update.view.composing || update.transactions.some(tr => tr.isUserEvent("input.type.compose"))) {
        if (update.view.composing) armed = true;
        if (!armed) queueMicrotask(() => {
          if (!suspended && !disabled.value && !readonly.value && editor.value?.state.doc.toString() === text) options.change(text);
        });
        return;
      }
      options.change(text);
    }
  }

  const mode = () => [
    EditorState.readOnly.of(disabled.value || readonly.value),
    EditorView.editable.of(!disabled.value && !readonly.value),
    EditorView.contentAttributes.of({
      "aria-label": "Markdown 源码", "aria-readonly": String(readonly.value || disabled.value),
      ...(disabled.value ? { tabindex: "-1", "aria-disabled": "true" } : { tabindex: "0" }),
    }),
  ];
  const shortcuts = (["bold", "italic", "link", "find"] as const).map((action, i) => ({
    key: ["Mod-b", "Mod-i", "Mod-k", "Mod-f"][i],
    run: () => !armed && options.shortcut(action),
  }));
  const continueMarkup = insertNewlineContinueMarkupCommand({ nonTightLists: false });
  function createState(doc: string, range?: MarkdownRange) {
    const length = normalize(doc).length;
    return EditorState.create({
      doc,
      selection: range ? EditorSelection.single(Math.min(range.from, length), Math.min(range.to, length)) : undefined,
      extensions: [
        lock.of(mode()), placeholder.of(codePlaceholder(hint.value)), history(),
        markdown({ extensions: GFM, completeHTMLTags: false, pasteURLAsLink: false, addKeymap: false }), syntaxHighlighting(defaultHighlightStyle),
        drawSelection(), EditorView.lineWrapping, EditorView.updateListener.of(update),
        keymap.of([...shortcuts, { key: "Enter", run: view => !armed && !view.composing && !view.state.readOnly && continueMarkup(view) },
          ...markdownKeymap.filter(binding => binding.key !== "Enter"), ...defaultKeymap, ...historyKeymap]),
        EditorView.domEventHandlers({
          compositionstart: () => { armed = true; return false; },
          compositionend: () => {
            queueMicrotask(() => {
              if (!armed || !editor.value || suspended) return;
              armed = false;
              if (pendingExternal !== undefined) {
                const value = pendingExternal;
                pendingExternal = undefined;
                replaceExternal(value, true);
              } else if (!disabled.value && !readonly.value) options.change(editor.value.state.doc.toString());
              else replaceExternal(source.value, true);
            });
            return false;
          },
        }),
      ],
    });
  }
  function replaceExternal(value: string, force = false) {
    const view = editor.value;
    if (!view) return;
    if (!force && (armed || view.composing)) { pendingExternal = value; return; }
    options.invalidate();
    if (view.state.doc.toString() === normalize(value)) return;
    const top = view.scrollDOM.scrollTop;
    const left = view.scrollDOM.scrollLeft;
    replacing = true;
    const state = createState(value, selection.value);
    view.setState(state);
    historyState.value = { undo: false, redo: false };
    const next = state.selection.main;
    selection.value = { from: next.from, to: next.to };
    view.scrollDOM.scrollTop = top;
    view.scrollDOM.scrollLeft = left;
    replacing = false;
  }

  onMounted(() => {
    if (!mount.value) return;
    const view = new EditorView({ parent: mount.value, state: createState(source.value) });
    editor.value = view;
    viewport.value = view.scrollDOM;
    ready.value = true;
  });
  onActivated(() => { suspended = false; replaceExternal(source.value, true); editor.value?.requestMeasure(); });
  onDeactivated(() => {
    suspended = true;
    armed = false;
    pendingExternal = undefined;
    replaceExternal(source.value, true);
  });
  onBeforeUnmount(() => { suspended = true; editor.value?.destroy(); });
  watch([disabled, readonly], () => {
    editor.value?.dispatch({ effects: lock.reconfigure(mode()) });
    if (disabled.value) blur();
  }, { flush: "sync" });
  watch(hint, value => editor.value?.dispatch({ effects: placeholder.reconfigure(codePlaceholder(value)) }));

  function focus() {
    if (!disabled.value) editor.value?.focus();
  }
  function blur() {
    editor.value?.contentDOM.blur();
  }
  function transact(changes: ChangeSpec, range?: MarkdownRange, moveFocus = true) {
    const view = editor.value;
    if (!view || disabled.value || readonly.value || armed || view.composing) return false;
    view.dispatch({
      changes, selection: range ? EditorSelection.single(range.from, range.to) : undefined,
      annotations: [isolateHistory.of("full"), Transaction.userEvent.of("input")], scrollIntoView: moveFocus,
    });
    if (moveFocus) void nextTick(focus);
    return true;
  }
  function apply(edit: MarkdownEdit, moveFocus = true) {
    return transact(edit.changes, edit.selection, moveFocus);
  }
  function reveal(range: MarkdownRange, moveFocus = false) {
    const view = editor.value;
    if (!view || disabled.value) return;
    const length = view.state.doc.length;
    view.dispatch({
      selection: EditorSelection.single(Math.min(length, range.from), Math.min(length, range.to)),
      effects: EditorView.scrollIntoView(Math.min(length, range.from), { y: "center" }),
    });
    if (moveFocus) focus();
  }
  function stepHistory(direction: "undo" | "redo") {
    const view = editor.value;
    if (!view || disabled.value || readonly.value || armed || view.composing) return;
    (direction === "undo" ? undo : redo)(view);
    void nextTick(focus);
  }
  return { editor, viewport, ready, selection, historyState, focus, blur, transact, apply, reveal, replaceExternal, stepHistory };
}
