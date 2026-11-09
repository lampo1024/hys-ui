import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
const entry = "virtual:hys-docs-api",
  prefix = entry + "/";
/** Keep each component's generated API in its own lazy documentation chunk. */
export default function componentApiPlugin() {
  const file = fileURLToPath(
    new URL("./src/generated/api.json", import.meta.url),
  );
  let cached, stamp;
  async function read() {
    const stats = await fs.stat(file);
    if (!cached || stamp !== stats.mtimeMs) {
      cached = JSON.parse(await fs.readFile(file, "utf8"));
      stamp = stats.mtimeMs;
    }
    return cached;
  }
  return {
    name: "hys-docs-component-api",
    resolveId(id) {
      if (id === entry || id.startsWith(prefix)) return "\0" + id;
    },
    async load(id) {
      if (id !== "\0" + entry && !id.startsWith("\0" + prefix)) return;
      this.addWatchFile(file);
      const api = await read();
      if (id === "\0" + entry)
        return (
          "export default {" +
          Object.keys(api)
            .map(
              (name) =>
                JSON.stringify(name) +
                ":()=>import(" +
                JSON.stringify(prefix + name) +
                ")",
            )
            .join(",") +
          "}"
        );
      const name = id.slice(prefix.length + 1);
      if (!Object.hasOwn(api, name))
        this.error("Missing generated API: " + name);
      return "export default " + JSON.stringify(api[name]);
    },
  };
}
