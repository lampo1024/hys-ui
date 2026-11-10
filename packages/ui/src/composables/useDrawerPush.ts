import {
  computed,
  inject,
  provide,
  shallowRef,
  onMounted,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  type Ref,
  type InjectionKey,
  type CSSProperties,
} from "vue";
import type { HysDrawerProps } from "./drawer";
interface DrawerParent {
  register: (id: symbol, visible: Readonly<Ref<boolean>>) => () => void;
}
const parentKey: InjectionKey<DrawerParent> = Symbol("hys-ui-drawer-parent");
export function useDrawerPush(
  props: HysDrawerProps,
  shown: Readonly<Ref<boolean>>,
  fullscreen: Readonly<Ref<boolean>>,
) {
  const parent = inject(parentKey, undefined),
    children = shallowRef(new Map<symbol, Readonly<Ref<boolean>>>()),
    id = Symbol("drawer-child");
  provide(parentKey, {
    register(token, visible) {
      children.value = new Map(children.value).set(token, visible);
      return () => {
        const next = new Map(children.value);
        next.delete(token);
        children.value = next;
      };
    },
  });
  let unregister: (() => void) | undefined;
  const register = () => {
      unregister ??= parent?.register(id, shown);
    },
    cleanup = () => {
      unregister?.();
      unregister = undefined;
    };
  onMounted(register);
  onActivated(register);
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  const pushed = computed(
    () =>
      !!props.push &&
      shown.value &&
      !fullscreen.value &&
      [...children.value.values()].some((child) => child.value),
  );
  const style = computed<CSSProperties>(() => {
    const configured =
      typeof props.push === "object" ? props.push.distance : 160;
    const distance =
      typeof configured === "number"
        ? Number.isFinite(configured)
          ? Math.max(0, configured) + "px"
          : "160px"
        : configured || "160px";
    const value = pushed.value ? distance : "0px",
      negative = pushed.value ? `calc(-1 * ${distance})` : "0px";
    return {
      "--hys-ui-drawer-push-x":
        props.placement === "left"
          ? value
          : props.placement === "right"
            ? negative
            : "0px",
      "--hys-ui-drawer-push-y":
        props.placement === "top"
          ? value
          : props.placement === "bottom"
            ? negative
            : "0px",
    };
  });
  return { pushed, style };
}
