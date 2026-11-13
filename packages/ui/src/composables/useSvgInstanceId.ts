import { onBeforeUnmount, onMounted, ref, useId } from "vue";

const claimed = new Set<string>();
let serial = 0;

export function useSvgInstanceId(suffix: string) {
  const base = useId() + "-" + suffix;
  const id = ref(base);
  let mounted = false;
  onMounted(() => {
    mounted = true;
    if (claimed.has(base)) id.value = base + "-" + ++serial;
    claimed.add(id.value);
  });
  onBeforeUnmount(() => {
    if (mounted) claimed.delete(id.value);
  });
  return id;
}
