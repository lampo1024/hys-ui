async (page) => {
  const checks = [],
    errors = [],
    warnings = [],
    base = "http://127.0.0.1:5174";
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (event) => {
    if (event.type() === "warning" && event.text().includes("[Vue warn]"))
      warnings.push(event.text());
  });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.goto(base + "/components/hys-gantt");
  const scene = page.locator("#scene-dependencyrouting"),
    chart = scene.locator(".hys-ui-pg-gantt");
  await chart.locator(".hys-ui-pg-edge-hit").first().waitFor();
  const geometry = () =>
    chart.evaluate((root) => {
      const grid = root
          .querySelector(".hys-ui-pg-grid")
          .getBoundingClientRect(),
        rows = [...root.querySelectorAll(".hys-ui-pg-row")];
      return [
        ["a-source", "a-target", 1],
        ["b-source", "b-target", 2],
      ].map(([from, to, index]) => {
        const path = [...root.querySelectorAll(".hys-ui-pg-edge-hit")].find(
            (el) =>
              el
                .getAttribute("aria-label")
                .startsWith("依赖 " + from + " → " + to + "，"),
          ),
          bar = rows[index]
            .querySelector(".hys-ui-pg-bar")
            .getBoundingClientRect(),
          x = bar.left - grid.left,
          y = bar.top + bar.height / 2 - grid.top,
          length = path.getTotalLength(),
          points = Array.from({ length: 401 }, (_, i) =>
            path.getPointAtLength((length * i) / 400),
          ).filter((point) => Math.abs(point.y - y) < 1);
        return {
          direction: index === 1 ? "down" : "up",
          outside:
            points.length > 2 && points.every((point) => point.x <= x - 3.4),
          detour: (path.getAttribute("d").match(/ V /g) || []).length === 2,
          leadVisible: points.some((point) => point.x < x - 10),
          barInsideViewport:
            bar.left >
            root.querySelector(".hys-ui-pg-labels").getBoundingClientRect()
              .right,
        };
      });
    });
  const validate = async (label) => {
    const state = await geometry();
    for (const item of state) {
      check(
        label +
          " " +
          item.direction +
          ": terminal line stays outside the task bar",
        item.outside && item.detour,
      );
      check(
        label +
          " " +
          item.direction +
          ": a visible approach segment precedes the arrow",
        item.leadVisible && item.barInsideViewport,
      );
    }
  };
  await validate("Default rows");
  await chart.getByRole("radio", { name: "周", exact: true }).click();
  await validate("Week scale");
  const input = scene.getByRole("spinbutton", {
    name: "折返示例任务行高",
    exact: true,
  });
  await input.fill("40");
  await input.press("Enter");
  await validate("Compact rows");
  await input.fill("76");
  await input.press("Enter");
  await validate("Tall rows");
  await chart.scrollIntoViewIfNeeded();
  await chart.screenshot({ path: "output/playwright/gantt-routing.png" });
  check(
    "Routing example has no runtime errors or Vue warnings",
    errors.length === 0 && warnings.length === 0,
  );
  return { checks, errors, warnings, geometry: await geometry() };
}
