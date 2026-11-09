/// <reference types="vite/client" />
declare module "virtual:hys-docs-api" {
  const loaders: Record<
    string,
    () => Promise<{ default: import("./apiTypes").ComponentApi }>
  >;
  export default loaders;
}
