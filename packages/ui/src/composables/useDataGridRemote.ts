import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
} from "vue";
import type {
  HysDataGridProps,
  HysDataGridQuery,
  HysDataGridResult,
} from "./dataGrid";

export function useDataGridRemote<T extends object>(
  props: HysDataGridProps<T>,
  query: ComputedRef<HysDataGridQuery>,
  onError: (error: unknown) => void,
) {
  const active = ref(false);
  const pending = ref(false);
  const failure = shallowRef<{ error: unknown; query: string }>();
  const result = shallowRef<HysDataGridResult<T>>();
  let request: AbortController | undefined;
  let completedQuery: string | undefined;
  const signature = computed(() => JSON.stringify(query.value));

  function cancel() {
    request?.abort();
    request = undefined;
    pending.value = false;
  }

  async function reload() {
    if (!active.value || !props.loadRows) return;
    cancel();
    const controller = new AbortController();
    request = controller;
    const requested = signature.value;
    const loader = props.loadRows;
    pending.value = true;
    failure.value = undefined;
    try {
      const response = await loader(JSON.parse(requested), {
        signal: controller.signal,
      });
      if (
        controller.signal.aborted ||
        requested !== signature.value ||
        props.loadRows !== loader
      )
        return;
      completedQuery = requested;
      result.value = response;
    } catch (error) {
      if (
        controller.signal.aborted ||
        requested !== signature.value ||
        props.loadRows !== loader
      )
        return;
      failure.value = { error, query: requested };
      onError(error);
    } finally {
      if (request === controller) {
        request = undefined;
        pending.value = false;
      }
    }
  }

  function activate() {
    if (active.value) return;
    active.value = true;
    if (
      completedQuery !== signature.value &&
      failure.value?.query !== signature.value
    )
      void reload();
  }
  function deactivate() {
    active.value = false;
    cancel();
  }

  watch(
    () => props.loadRows,
    () => {
      cancel();
      completedQuery = undefined;
      result.value = undefined;
      failure.value = undefined;
      void reload();
    },
  );
  onMounted(() => {
    watch(signature, () => { void reload(); }, { flush: "post" });
    activate();
  });
  onActivated(activate);
  onDeactivated(deactivate);
  onBeforeUnmount(deactivate);

  return {
    pending,
    failure,
    reload,
    sourceRows: computed(() =>
      props.loadRows ? (result.value?.rows ?? props.rows) : props.rows,
    ),
    remoteTotal: computed(() =>
      props.loadRows
        ? (result.value?.total ?? props.totalRows)
        : props.totalRows,
    ),
  };
}
