import {
  onMounted,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  ref,
  readonly,
} from "vue";

const hidden = ref(false);
let users = 0;
function syncVisibility() {
  hidden.value = document.hidden;
}

export function usePageVisibility() {
  let subscribed = false;
  function subscribe() {
    if (subscribed) return;
    subscribed = true;
    if (++users === 1) {
      syncVisibility();
      document.addEventListener("visibilitychange", syncVisibility);
    }
  }
  function unsubscribe() {
    if (!subscribed) return;
    subscribed = false;
    if (--users === 0) {
      document.removeEventListener("visibilitychange", syncVisibility);
    }
  }
  onMounted(subscribe);
  onActivated(subscribe);
  onDeactivated(unsubscribe);
  onBeforeUnmount(unsubscribe);
  return readonly(hidden);
}
