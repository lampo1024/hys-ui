import type { InjectionKey, Ref } from "vue";
import type { HysButtonAppearance, HysButtonSize, HysButtonVariant } from "../components/HysButton/HysButton.vue";

export function buttonSize(size: HysButtonSize | undefined): "sm" | "md" | "lg" | undefined {
  if (size === "small") return "sm";
  if (size === "default") return "md";
  if (size === "large") return "lg";
  return size || undefined;
}

export function buttonVariant(type: HysButtonAppearance | "button" | "submit" | "reset" | undefined): HysButtonVariant | undefined {
  if (type === "default") return "secondary";
  return type === "button" || type === "submit" || type === "reset" ? undefined : type || undefined;
}

export const buttonGroupKey: InjectionKey<{
  variant: Readonly<Ref<HysButtonVariant | undefined>>;
  size: Readonly<Ref<"sm" | "md" | "lg" | undefined>>;
  disabled: Readonly<Ref<boolean>>;
}> = Symbol("hys-ui-button-group");
