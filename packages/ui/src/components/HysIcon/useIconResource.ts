import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  shallowRef,
  watch,
} from "vue";
import { iconAssetUrl } from "./iconSafety";
import type {
  HysIconReference,
  HysIconRegistry,
  HysIconSource,
} from "./iconTypes";

export function useIconResource(options: {
  reference(): HysIconReference | undefined;
  registry(): HysIconRegistry;
  variant(): string;
  allowedOrigins?(): readonly string[] | undefined;
}) {
  const source = shallowRef<HysIconSource>();
  const error = shallowRef<unknown>();
  const loading = shallowRef(false);
  let active = false,
    generation = 0;
  const record = computed(() => {
    const registry = options.registry();
    void registry.revision.value;
    const reference = options.reference();
    return typeof reference === "string"
      ? registry.resolve(reference)
      : undefined;
  });
  function accept(value: HysIconSource) {
    const origins = options.allowedOrigins?.();
    if (
      (value.type === "image" && !iconAssetUrl(value.src, origins)) ||
      (value.type === "sprite" && !iconAssetUrl(value.href, origins, true))
    )
      throw new Error("Icon URL is not allowed");
    source.value = value;
  }
  function fail(reason: unknown) {
    source.value = undefined;
    error.value = reason ?? new Error("Icon failed to load");
    loading.value = false;
  }
  function refresh() {
    const token = ++generation;
    error.value = undefined;
    loading.value = false;
    const reference = options.reference();
    if (!reference) {
      source.value = undefined;
      return;
    }
    const registry = options.registry();
    const variant = options.variant();
    try {
      const existing =
        typeof reference === "string"
          ? registry.get(reference, variant)
          : reference;
      if (existing) {
        accept(existing);
        return;
      }
      source.value = undefined;
      if (typeof reference !== "string" || !registry.resolve(reference)) {
        fail(new Error("Icon not found: " + reference));
        return;
      }
      loading.value = true;
      if (!active) return;
      void registry
        .load(reference, variant)
        .then((value) => {
          if (token !== generation) return;
          accept(value);
          loading.value = false;
        })
        .catch((reason) => {
          if (token === generation) fail(reason);
        });
    } catch (reason) {
      fail(reason);
    }
  }
  watch(
    [
      options.reference,
      options.registry,
      () => options.registry().revision.value,
      options.variant,
      () => options.allowedOrigins?.(),
    ],
    refresh,
    { immediate: true },
  );
  function activate() {
    if (!active) {
      active = true;
      refresh();
    }
  }
  function deactivate() {
    active = false;
    generation++;
  }
  onMounted(activate);
  onActivated(activate);
  onDeactivated(deactivate);
  onBeforeUnmount(deactivate);
  return { source, loading, error, record, fail, reload: refresh };
}
