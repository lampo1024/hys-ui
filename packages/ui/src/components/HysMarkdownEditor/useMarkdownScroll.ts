import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";
import { EditorView } from "@codemirror/view";

export function useMarkdownScroll(
  editor: Ref<EditorView | undefined>, preview: Ref<HTMLElement | undefined>,
  enabled: Readonly<Ref<boolean>>, revision: Readonly<Ref<unknown>>,
) {
  let points: { line: number; top: number }[] = [];
  let receiver: HTMLElement | undefined;
  let frame = 0;
  let observer: ResizeObserver | undefined;

  function measure() {
    const panel = preview.value;
    if (!panel || !panel.clientHeight) { points = []; return; }
    const top = panel.getBoundingClientRect().top - panel.scrollTop;
    points = [];
    for (const element of panel.querySelectorAll<HTMLElement>("[data-md-line]")) {
      const point = { line: Number(element.dataset.mdLine), top: element.getBoundingClientRect().top - top };
      const previous = points.at(-1);
      if (!previous || point.line > previous.line && point.top > previous.top) points.push(point);
    }
  }
  function setTop(target: HTMLElement, top: number) {
    const next = Math.max(0, Math.min(top, target.scrollHeight - target.clientHeight));
    if (Math.abs(target.scrollTop - next) < 1) return;
    receiver = target;
    if (frame) cancelAnimationFrame(frame);
    target.scrollTop = next;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { frame = 0; receiver = undefined; });
    });
  }
  function interpolate(value: number, by: "line" | "top", output: "line" | "top") {
    const i = points.findIndex(point => point[by] > value);
    if (i < 0) return points.at(-1)?.[output];
    if (!i) return points[0]?.[output];
    const first = points[i - 1];
    const next = points[i];
    return first[output] + (next[output] - first[output]) * (value - first[by]) / (next[by] - first[by]);
  }
  function fromSource(event: Event) {
    const view = editor.value, panel = preview.value;
    const scroll = event.currentTarget as HTMLElement;
    if (!enabled.value || !view || !panel || receiver === scroll || scroll.scrollHeight - scroll.clientHeight <= 1) return;
    const y = scroll.scrollTop;
    if (y <= 1) { setTop(panel, 0); return; }
    if (y >= scroll.scrollHeight - scroll.clientHeight - 1) { setTop(panel, panel.scrollHeight); return; }
    const block = view.lineBlockAtHeight(Math.max(0, scroll.getBoundingClientRect().top - view.documentTop));
    const line = view.state.doc.lineAt(block.from).number;
    const top = interpolate(line, "line", "top");
    if (top != null) setTop(panel, top);
  }
  function fromPreview() {
    const view = editor.value, panel = preview.value;
    if (!enabled.value || !view || !panel || receiver === panel || panel.scrollHeight - panel.clientHeight <= 1) return;
    const y = panel.scrollTop;
    if (y <= 1) { setTop(view.scrollDOM, 0); return; }
    if (y >= panel.scrollHeight - panel.clientHeight - 1) { setTop(view.scrollDOM, view.scrollDOM.scrollHeight); return; }
    const location = interpolate(y, "top", "line");
    if (location == null) return;
    const line = Math.max(1, Math.min(view.state.doc.lines, Math.round(location)));
    const scroll = view.scrollDOM;
    setTop(scroll, view.lineBlockAt(view.state.doc.line(line).from).top + view.documentTop - scroll.getBoundingClientRect().top + scroll.scrollTop);
  }
  watch(() => editor.value?.scrollDOM, (node, old, cleanup) => {
    node?.addEventListener("scroll", fromSource, { passive: true });
    cleanup(() => node?.removeEventListener("scroll", fromSource));
  });
  watch([preview, revision, enabled], () => {
    void nextTick(() => {
      const panel = preview.value;
      observer?.disconnect();
      if (panel && enabled.value && typeof ResizeObserver !== "undefined") {
        observer ??= new ResizeObserver(measure);
        observer.observe(panel);
        if (panel.firstElementChild) observer.observe(panel.firstElementChild);
      }
      measure();
    });
  }, { flush: "post" });
  onBeforeUnmount(() => {
    observer?.disconnect();
    if (frame) cancelAnimationFrame(frame);
  });
  return { fromPreview };
}
