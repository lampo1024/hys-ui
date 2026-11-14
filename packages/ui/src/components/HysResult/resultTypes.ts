import type { Component, VNodeChild } from "vue";

export type HysResultCode = "403" | "404" | "500";
export type HysResultStatus =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "pending"
  | HysResultCode
  | 403
  | 404
  | 500;
export interface HysResultProps {
  status?: HysResultStatus;
  title?: string;
  subtitle?: string;
  icon?: Component | false;
  showCode?: boolean;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  announce?: "off" | "polite" | "assertive";
  announcement?: string;
  layout?: "stacked" | "inline";
  detailsLabel?: string;
  detailsOpen?: boolean;
  defaultDetailsOpen?: boolean;
  progress?: number;
}
export interface HysResultContext {
  status: Exclude<HysResultStatus, number>;
  code?: HysResultCode;
  title: string;
  subtitle?: string;
  detailsOpen?: boolean;
}
export interface HysResultSlots {
  default?: (context: HysResultContext) => VNodeChild;
  icon?: (context: HysResultContext) => VNodeChild;
  title?: (context: HysResultContext) => VNodeChild;
  subtitle?: (context: HysResultContext) => VNodeChild;
  extra?: (context: HysResultContext) => VNodeChild;
  details?: (context: HysResultContext) => VNodeChild;
}
export interface HysResultInstance {
  readonly element: HTMLElement | undefined;
  focus: (options?: FocusOptions) => void;
}
