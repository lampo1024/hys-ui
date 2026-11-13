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
import type { HysSpinConfig, HysSpinPreset, HysSpinProps } from "./spinTypes";

interface SpinScope {
  defaults: ComputedRef<Partial<HysSpinProps>>;
  presets: ComputedRef<Record<string, HysSpinPreset>>;
}
const key: InjectionKey<SpinScope> = Symbol("HysSpinConfig");
const local = new WeakMap<object, SpinScope>();
const defaults = shallowRef<HysSpinConfig>({});

export function configureHysSpin(config: HysSpinConfig) {
  defaults.value = config;
}
export function useSpinConfig(): SpinScope {
  const current = getCurrentInstance();
  return (
    (current && local.get(current)) ??
    inject(key, undefined) ?? {
      defaults: computed(() => toValue(defaults.value.defaults) ?? {}),
      presets: computed(() => toValue(defaults.value.presets) ?? {}),
    }
  );
}
export function provideHysSpin(config: HysSpinConfig) {
  const parent = useSpinConfig();
  const scope: SpinScope = {
    defaults: computed(() => ({
      ...parent.defaults.value,
      ...toValue(config.defaults),
    })),
    presets: computed(() => ({
      ...parent.presets.value,
      ...toValue(config.presets),
    })),
  };
  provide(key, scope);
  const current = getCurrentInstance();
  if (current) local.set(current, scope);
}
