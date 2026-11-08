import { nextTick } from "vue";

const selector =
  '.example-stage input[type="password"], .example-stage input[data-hys-docs-password]';
const pending = new Map<HTMLInputElement, { value: string }>();

function fields(root: ParentNode = document) {
  const result = Array.from(root.querySelectorAll<HTMLInputElement>(selector));
  for (const field of result) {
    field.dataset.hysDocsPassword = "";
    if (field.autocomplete !== "off") field.autocomplete = "off";
    if (field.form) field.form.autocomplete = "off";
  }
  return result;
}

function clearFields(root: ParentNode = document) {
  const result = fields(root);
  for (const field of result) {
    const hadValue = !!field.value || !!pending.get(field)?.value;
    pending.delete(field);
    field.value = "";
    if (hadValue) field.dispatchEvent(new Event("input", { bubbles: true }));
    field.value = "";
  }
  return result;
}

// Only documentation previews use this policy; the published inputs retain
// the host application's autocomplete, values and native form behavior.
export async function clearExamplePasswords(root: ParentNode = document) {
  const result = clearFields(root);
  await nextTick();
  for (const field of result) if (field.isConnected) field.value = "";
}

export function installExamplePasswordGuard(root: ParentNode = document) {
  let active = true;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const scan = () => fields(root);
  const observer = new MutationObserver(scan);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["type"],
  });
  scan();

  function temporarilyMask(form: HTMLFormElement) {
    const controls = fields(root).filter((field) => field.form === form);
    if (!controls.some((field) => field.value || pending.has(field))) return;
    const snapshots = controls.map((field) => {
      const snapshot = pending.get(field) ?? { value: field.value };
      pending.set(field, snapshot);
      field.value = "";
      return { field, snapshot };
    });
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!active) return;
      for (const { field, snapshot } of snapshots) {
        if (pending.get(field) !== snapshot) continue;
        pending.delete(field);
        if (!field.isConnected || field.value) continue;
        // Vue keeps the bound value attribute in sync. A submit handler may
        // have reset the model, in which case the new empty value wins.
        field.value = field.hasAttribute("value")
          ? field.defaultValue
          : snapshot.value;
      }
    }, 0);
    timers.add(timer);
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : undefined;
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (
      link &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      link.target !== "_blank" &&
      !link.hasAttribute("download")
    ) {
      void clearExamplePasswords();
      return;
    }
    const button = target?.closest<HTMLButtonElement>("button");
    if (
      button?.type === "submit" &&
      button.closest(".example-stage") &&
      button.form
    )
      temporarilyMask(button.form);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing || event.key !== "Enter") return;
    const field =
      event.target instanceof HTMLInputElement ? event.target : undefined;
    if (field?.closest(".example-stage") && field.form)
      temporarilyMask(field.form);
  };
  const onSubmit = (event: Event) => {
    if (
      event.target instanceof HTMLFormElement &&
      event.target.closest(".example-stage")
    )
      temporarilyMask(event.target);
  };
  const onReset = (event: Event) => {
    if (
      event.target instanceof HTMLFormElement &&
      event.target.closest(".example-stage")
    )
      clearFields(event.target);
  };
  const onFocusOut = (event: FocusEvent) => {
    const target = event.target instanceof Element ? event.target : undefined;
    const stage = target?.closest<HTMLElement>(".example-stage");
    if (
      !stage ||
      (event.relatedTarget instanceof Node &&
        stage.contains(event.relatedTarget))
    )
      return;
    void clearExamplePasswords(stage);
  };
  const leaving = () => {
    void clearExamplePasswords();
  };
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keypress", onKey, true);
  document.addEventListener("submit", onSubmit, true);
  document.addEventListener("reset", onReset, true);
  document.addEventListener("focusout", onFocusOut, true);
  window.addEventListener("beforeunload", leaving);
  window.addEventListener("pagehide", leaving);
  window.addEventListener("popstate", leaving);
  window.addEventListener("blur", leaving);
  return () => {
    active = false;
    observer.disconnect();
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    pending.clear();
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("keypress", onKey, true);
    document.removeEventListener("submit", onSubmit, true);
    document.removeEventListener("reset", onReset, true);
    document.removeEventListener("focusout", onFocusOut, true);
    window.removeEventListener("beforeunload", leaving);
    window.removeEventListener("pagehide", leaving);
    window.removeEventListener("popstate", leaving);
    window.removeEventListener("blur", leaving);
  };
}
