import {
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  watch,
  type Ref,
} from "vue";
import { useHysRootAttrs } from "../config";
import { useMotion } from "../motion/useMotion";
import { overlayOwnerKey } from "./overlayManager";
import {
  transferToken,
  type HysTransferKey,
  type HysTransferSide,
} from "./transfer";

interface Options {
  animated?: boolean;
  moveAnimation?: "flight" | "fade" | "none";
  moveDuration?: number;
  maxAnimatedItems?: number;
  highlightOnArrival?: boolean;
}
type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};
interface Sample {
  token: string;
  label: string;
  box: Box;
}
interface Snapshot {
  generation: number;
  direction: HysTransferSide;
  count: number;
  samples: Sample[];
}
const selector = (token: string) =>
  '[data-transfer-key="' +
  token.replace(
    /["\\\n\r\f]/g,
    (c) => "\\" + c.codePointAt(0)!.toString(16) + " ",
  ) +
  '"]';

/** Bounded visual feedback after an accepted move; never measures every data row. */
export function useTransferMotion(
  root: Ref<HTMLElement | undefined>,
  options: Options,
) {
  const skin = useHysRootAttrs(),
    { effectiveMotion } = useMotion(),
    owner = inject(overlayOwnerKey, undefined);
  const landed = new Set<HTMLElement>();
  const running = new Set<{
    node: HTMLElement;
    animation: Animation;
    restore: () => void;
  }>();
  let scrollFrame: number | undefined;
  let generation = 0,
    live = true,
    timer: ReturnType<typeof setTimeout> | undefined,
    receiving: HTMLElement | undefined;
  const duration = () =>
    Number.isFinite(options.moveDuration)
      ? Math.max(0, Math.min(1500, options.moveDuration!))
      : 240;
  const limit = () =>
    Number.isFinite(options.maxAnimatedItems)
      ? Math.max(0, Math.min(12, Math.floor(options.maxAnimatedItems!)))
      : 6;
  const enabled = () =>
    live &&
    root.value?.isConnected &&
    owner?.value !== false &&
    options.animated !== false &&
    options.moveAnimation !== "none" &&
    duration() > 0 &&
    effectiveMotion.value !== "off";
  function stop() {
    generation++;
    if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
    scrollFrame = undefined;
    clearTimeout(timer);
    timer = undefined;
    window.removeEventListener("scroll", stop, true);
    window.removeEventListener("resize", stop);
    window.removeEventListener("focusin", stop);
    window.removeEventListener("blur", stop);
    window.removeEventListener("keydown", escape);
    for (const item of running) {
      item.animation.cancel();
      item.restore();
      item.node.remove();
    }
    running.clear();
    for (const row of landed) row.classList.remove("hys-ui-transfer-landed");
    landed.clear();
    receiving?.classList.remove("hys-ui-transfer-received");
    receiving = undefined;
  }
  function escape(event: KeyboardEvent) {
    if (event.key === "Escape") stop();
  }
  function pane(side: HysTransferSide) {
    return root.value?.querySelector<HTMLElement>(
      '.hys-ui-transfer-pane[data-side="' + side + '"]',
    );
  }
  function capture(
    direction: HysTransferSide,
    keys: readonly HysTransferKey[],
  ): Snapshot | undefined {
    stop();
    if (!enabled() || !keys.length) return;
    const source = pane(
      direction === "right" ? "left" : "right",
    )?.querySelector<HTMLElement>(".hys-ui-pf-transfer-list");
    const snapshot: Snapshot = {
      generation,
      direction,
      count: keys.length,
      samples: [],
    };
    if (
      !source ||
      !limit() ||
      typeof HTMLElement.prototype.animate !== "function"
    )
      return snapshot;
    const viewport = source.getBoundingClientRect(),
      top = Math.max(0, viewport.top),
      bottom = Math.min(window.innerHeight, viewport.bottom);
    if (
      viewport.right <= 0 ||
      viewport.left >= window.innerWidth ||
      bottom <= top
    )
      return snapshot;
    const wanted = new Set(keys.map(transferToken)),
      seen = new Set<string>();
    function take(row: HTMLElement | null | undefined) {
      if (!row || !source!.contains(row) || snapshot.samples.length >= limit())
        return;
      const token = row.dataset.transferKey!;
      if (!wanted.has(token) || seen.has(token)) return;
      const box = row.getBoundingClientRect();
      if (!box.width || !box.height || box.bottom <= top || box.top >= bottom)
        return;
      seen.add(token);
      snapshot.samples.push({
        token,
        label: (
          row.querySelector(".hys-ui-transfer-label")?.textContent ??
          row.textContent ??
          ""
        )
          .trim()
          .slice(0, 120),
        box,
      });
    }
    if (keys.length <= limit())
      for (const key of keys)
        take(source.querySelector<HTMLElement>(selector(transferToken(key))));
    else if (document.elementFromPoint) {
      const samples = Math.min(24, Math.max(1, Math.ceil((bottom - top) / 20))),
        x = Math.max(
          1,
          Math.min(window.innerWidth - 1, viewport.left + viewport.width / 2),
        );
      for (let i = 0; i < samples && snapshot.samples.length < limit(); i++)
        take(
          document
            .elementFromPoint(x, top + ((i + 0.5) * (bottom - top)) / samples)
            ?.closest<HTMLElement>(".hys-ui-transfer-row"),
        );
    }
    return snapshot;
  }
  function play(snapshot: Snapshot | undefined) {
    if (!snapshot || snapshot.generation !== generation || !enabled()) return;
    const target = pane(snapshot.direction),
      viewport = target?.querySelector<HTMLElement>(".hys-ui-pf-transfer-list");
    if (!target || !viewport) return;
    const bounds = viewport.getBoundingClientRect();
    if (
      bounds.right <= 0 ||
      bounds.left >= window.innerWidth ||
      bounds.bottom <= 0 ||
      bounds.top >= window.innerHeight
    )
      return;
    receiving = target;
    target.classList.add("hys-ui-transfer-received");
    const font = snapshot.samples.length
      ? getComputedStyle(root.value!)
      : undefined;
    const finish = (item: {
      node: HTMLElement;
      animation: Animation;
      restore: () => void;
    }) => {
      item.restore();
      item.node.remove();
      running.delete(item);
    };
    for (const [index, sample] of snapshot.samples.entries()) {
      const row = viewport.querySelector<HTMLElement>(selector(sample.token)),
        box = row?.getBoundingClientRect(),
        visible =
          !!box &&
          box.bottom > Math.max(0, bounds.top) &&
          box.top < Math.min(window.innerHeight, bounds.bottom);
      const end = visible
        ? box!
        : {
            left: Math.max(8, bounds.left + 8),
            top: Math.max(
              8,
              Math.min(
                window.innerHeight - 44,
                bounds.top + Math.min(bounds.height / 2, 80) + index * 4,
              ),
            ),
            width: Math.max(40, bounds.width - 16),
            height: sample.box.height,
          };
      const node = document.createElement("div");
      node.className = "hys-ui-transfer-flight";
      for (const [key, value] of Object.entries(skin.value))
        node.setAttribute(key, value);
      node.setAttribute("aria-hidden", "true");
      node.inert = true;
      node.textContent =
        sample.label +
        (index === snapshot.samples.length - 1 &&
        snapshot.count > snapshot.samples.length
          ? " · +" + (snapshot.count - snapshot.samples.length)
          : "");
      Object.assign(node.style, {
        left: sample.box.left + "px",
        top: sample.box.top + "px",
        width: sample.box.width + "px",
        height: sample.box.height + "px",
        fontFamily: font?.fontFamily,
        fontSize: font?.fontSize,
      });
      for (const name of [
        "--hys-ui-primary",
        "--hys-ui-primary-soft",
        "--hys-ui-border",
        "--hys-ui-surface",
        "--hys-ui-text",
        "--hys-ui-muted",
      ]) {
        const value = font?.getPropertyValue(name);
        if (value) node.style.setProperty(name, value);
      }
      const opacity = row?.style.opacity ?? "",
        transition = row?.style.transition ?? "";
      let restored = false;
      const restore = () => {
        if (restored) return;
        restored = true;
        if (row && visible) {
          row.style.opacity = opacity;
          row.style.transition = transition;
        }
      };
      if (row && visible) {
        row.style.transition = "none";
        row.style.opacity = "0";
      }
      document.body.append(node);
      const transform =
        "translate3d(" +
        (end.left - sample.box.left) +
        "px," +
        (end.top - sample.box.top) +
        "px,0) scale(" +
        end.width / sample.box.width +
        "," +
        end.height / sample.box.height +
        ")";
      const frames =
        options.moveAnimation === "fade"
          ? [
              { transform, opacity: 0 },
              { transform, opacity: 1 },
            ]
          : [
              { transform: "translate3d(0,0,0) scale(1)", opacity: 0.9 },
              { transform, opacity: 1 },
            ];
      try {
        const animation = node.animate(frames, {
            duration: duration(),
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "both",
          }),
          item = { node, animation, restore };
        running.add(item);
        void animation.finished.then(
          () => {
            finish(item);
            if (
              row &&
              visible &&
              row.isConnected &&
              snapshot.generation === generation &&
              enabled() &&
              options.highlightOnArrival !== false
            ) {
              row.classList.add("hys-ui-transfer-landed");
              landed.add(row);
            }
          },
          () => finish(item),
        );
      } catch {
        restore();
        node.remove();
      }
    }
    // The accepted move can itself clamp a now-shorter source scroll viewport.
    // Arm after that initial scroll event; subsequent user scrolling cancels promptly.
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = undefined;
      if (snapshot.generation === generation)
        window.addEventListener("scroll", stop, true);
    });
    window.addEventListener("resize", stop);
    window.addEventListener("focusin", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("keydown", escape);
    timer = setTimeout(stop, duration() + 440);
  }
  watch(
    () => [
      options.animated,
      options.moveAnimation,
      options.moveDuration,
      options.maxAnimatedItems,
      options.highlightOnArrival,
      effectiveMotion.value,
      owner?.value,
    ],
    stop,
    { flush: "sync" },
  );
  onActivated(() => {
    live = true;
  });
  onDeactivated(() => {
    live = false;
    stop();
  });
  onBeforeUnmount(stop);
  return {
    capture,
    play,
    stop,
    cancelPlaying: () => {
      if (running.size || receiving) stop();
    },
  };
}
