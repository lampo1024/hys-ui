type ReferenceListeners = {
  [Name in keyof HTMLElementEventMap]?: (
    event: HTMLElementEventMap[Name],
  ) => void;
};

export function createPopupReferenceBinding(
  kind: "tooltip" | "popover",
  id: string,
  events: ReferenceListeners,
) {
  let externalNode: HTMLElement | undefined;
  let externalAria: Record<string, string | null> | undefined;
  function syncAria(open: boolean) {
    if (!externalNode || !externalAria) return;
    if (kind === "tooltip") {
      const text = open
        ? [externalAria["aria-describedby"], id].filter(Boolean).join(" ")
        : externalAria["aria-describedby"];
      if (text) externalNode.setAttribute("aria-describedby", text);
      else externalNode.removeAttribute("aria-describedby");
    } else {
      externalNode.setAttribute(
        "aria-haspopup",
        externalAria["aria-haspopup"] ?? "dialog",
      );
      externalNode.setAttribute("aria-expanded", String(open));
      const target = open ? id : externalAria["aria-controls"];
      if (target) externalNode.setAttribute("aria-controls", target);
      else externalNode.removeAttribute("aria-controls");
    }
  }
  function detach() {
    if (externalNode)
      for (const [name, handler] of Object.entries(events))
        externalNode.removeEventListener(name, handler as EventListener, name === "pointerdown");
    if (externalNode && externalAria)
      for (const [key, value] of Object.entries(externalAria)) {
        if (value === null) externalNode.removeAttribute(key);
        else externalNode.setAttribute(key, value);
      }
    externalAria = undefined;
    externalNode = undefined;
  }
  function attach(node: HTMLElement | undefined, open: boolean) {
    detach();
    if (!node) return;
    externalNode = node;
    externalAria = Object.fromEntries(
      ["aria-describedby", "aria-controls", "aria-expanded", "aria-haspopup"].map(
        (key) => [key, node.getAttribute(key)],
      ),
    );
    syncAria(open);
    for (const [name, handler] of Object.entries(events))
      node.addEventListener(name, handler as EventListener, name === "pointerdown");
  }
  return { attach, detach, syncAria };
}
