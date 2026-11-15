import { ref, shallowRef, watch, type Ref } from "vue";
import type { JsonDocument } from "./jsonDocument";
import { validateJsonSchema, type JsonSchema, type JsonSchemaIssue } from "./jsonSchema";

export function useJsonSchemaValidation(
  schema: Ref<JsonSchema | null>, source: Ref<string>, doc: Readonly<Ref<JsonDocument>>, disabled: Readonly<Ref<boolean>>,
) {
  const issues = shallowRef<JsonSchemaIssue[]>([]);
  const state = ref<"idle" | "running" | "passed" | "failed" | "paused">("idle");
  const error = ref("");
  watch([schema, source, disabled], ([definition, text, off], _, onCleanup) => {
    issues.value = [];
    error.value = "";
    state.value = "idle";
    if (off || definition === null) return;
    const document = doc.value;
    if (!document.valid || document.duplicates.length) {
      state.value = "paused";
      error.value = document.valid ? "请先处理重复键。" : "请先修正 JSON 语法。";
      return;
    }
    let current = true;
    state.value = "running";
    const timer = setTimeout(async () => {
      try {
        const result = await validateJsonSchema(definition, text, document.root);
        if (!current || source.value !== text || schema.value !== definition) return;
        issues.value = result;
        state.value = result.length ? "failed" : "passed";
      } catch (failure) {
        if (!current) return;
        error.value = failure instanceof Error ? failure.message : "无法校验 Schema。";
        state.value = "paused";
      }
    }, 150);
    onCleanup(() => { current = false; clearTimeout(timer); });
  }, { immediate: true, deep: true });
  return { issues, error, state };
}
