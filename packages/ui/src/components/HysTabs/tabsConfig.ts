import {
  computed,
  inject,
  provide,
  shallowRef,
  toValue,
  type InjectionKey,
} from "vue";
import type { HysTabsConfig, HysTabsProps } from "./tabsTypes";

const key: InjectionKey<HysTabsConfig[]> = Symbol("hys-tabs-config");
const global = shallowRef<HysTabsConfig>({});
export function configureHysTabs(config: HysTabsConfig) {
  global.value = config;
}
export function provideHysTabs(config: HysTabsConfig) {
  provide(key, [...inject(key, []), config]);
}
export function useTabsOptions(props: HysTabsProps) {
  const scopes = inject(key, []);
  return computed<HysTabsProps>(() => ({
    type: "line",
    size: "md",
    trigger: "click",
    activation: "auto",
    lazy: true,
    animated: true,
    animation: "fade",
    showScrollButtons: true,
    autoActivate: true,
    titleTooltip: true,
    moreSearch: true,
    confirmDirty: true,
    ...toValue(global.value.defaults),
    ...Object.assign({}, ...scopes.map((scope) => toValue(scope.defaults))),
    ...Object.fromEntries(
      Object.entries(props).filter(([, value]) => value !== undefined),
    ),
  }));
}
