import { defineComponent, type VNodeChild } from "vue";

export default defineComponent({
  props: { render: Function, scope: Object },
  setup(props, { slots }) {
    return () =>
      props.render
        ? (props.render as (context?: object) => VNodeChild)(props.scope)
        : slots.default?.();
  },
});
