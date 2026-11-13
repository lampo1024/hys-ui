<script lang="ts">
import { defineComponent, h } from "vue";
import HysTooltip from "../../HysTooltip/HysTooltip.vue";

export default defineComponent({
  name: "HysIconTooltip",
  props: { text: String },
  setup(props, { slots }) {
    return () =>
      props.text
        ? h(
            HysTooltip,
            { text: props.text, triggerKeys: [] },
            { default: slots.default },
          )
        : slots.default?.();
  },
});
</script>
