export interface MentionSelection {
  start: number;
  end: number;
}

export function isNativeMentionInput(
  element: HTMLElement,
): element is HTMLInputElement | HTMLTextAreaElement {
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA";
}

export function readMentionSelection(
  element: HTMLElement,
  fallback: number,
): MentionSelection {
  if (isNativeMentionInput(element))
    return {
      start: element.selectionStart ?? fallback,
      end: element.selectionEnd ?? fallback,
    };
  const selection = element.ownerDocument.defaultView?.getSelection();
  if (!selection?.rangeCount) return { start: fallback, end: fallback };
  const range = selection.getRangeAt(0);
  if (
    !element.contains(range.startContainer) ||
    !element.contains(range.endContainer)
  )
    return { start: fallback, end: fallback };
  const before = element.ownerDocument.createRange();
  before.selectNodeContents(element);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length };
}

export function writeMentionSelection(
  element: HTMLElement,
  selection: MentionSelection,
) {
  if (isNativeMentionInput(element)) {
    element.setSelectionRange(selection.start, selection.end);
    return;
  }
  const doc = element.ownerDocument;
  const domSelection = doc.defaultView?.getSelection();
  if (!domSelection) return;
  function position(offset: number): [Node, number] {
    const walker = doc.createTreeWalker(element, 4);
    let remaining = offset;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const length = node.textContent?.length ?? 0;
      if (remaining <= length) {
        const entity = node.parentElement?.closest<HTMLElement>(
          "[data-mention-entity]",
        );
        if (entity?.parentNode) {
          const index = Array.from(entity.parentNode.childNodes).indexOf(
            entity,
          );
          return [entity.parentNode, index + (remaining > 0 ? 1 : 0)];
        }
        return [node, Math.max(0, remaining)];
      }
      remaining -= length;
    }
    return [element, element.childNodes.length];
  }
  const [startNode, start] = position(selection.start);
  const [endNode, end] = position(selection.end);
  const range = doc.createRange();
  range.setStart(startNode, start);
  range.setEnd(endNode, end);
  domSelection.removeAllRanges();
  domSelection.addRange(range);
}
