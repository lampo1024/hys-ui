import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  shallowRef,
  toValue,
  type ComputedRef,
  type InjectionKey,
} from "vue";
import { hysIconRegistry } from "./iconRegistry";
import type { HysIconConfig, HysIconProps, HysIconRegistry } from "./iconTypes";

interface IconScope {
  registry: ComputedRef<HysIconRegistry>;
  defaults: ComputedRef<Partial<HysIconProps>>;
}
const key: InjectionKey<IconScope> = Symbol("HysIconConfig");
const local = new WeakMap<object, IconScope>();
const global = shallowRef<HysIconConfig>({});
export function configureHysIcon(config: HysIconConfig) {
  global.value = config;
}
export function useIconConfig(): IconScope {
  const current = getCurrentInstance();
  return (
    (current && local.get(current)) ??
    inject(key, undefined) ?? {
      registry: computed(() => global.value.registry ?? hysIconRegistry),
      defaults: computed(() => toValue(global.value.defaults) ?? {}),
    }
  );
}
export function provideHysIcons(config: HysIconConfig) {
  const parent = useIconConfig();
  const scope: IconScope = {
    registry: computed(() => config.registry ?? parent.registry.value),
    defaults: computed(() => ({
      ...parent.defaults.value,
      ...toValue(config.defaults),
    })),
  };
  provide(key, scope);
  const current = getCurrentInstance();
  if (current) local.set(current, scope);
}
