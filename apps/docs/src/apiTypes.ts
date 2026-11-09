export interface ApiRow {
  name: string;
  type: string;
  required: boolean;
  default: string;
  description: string;
}
export interface ComponentApi {
  props: ApiRow[];
  events: ApiRow[];
  slots: ApiRow[];
  exposed: ApiRow[];
}
