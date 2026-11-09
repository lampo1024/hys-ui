async (page) => {
  const base = "http://127.0.0.1:5174",
    checks = [],
    errors = [],
    warnings = [];
  const check = (name, pass) => {
    checks.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().includes("[Vue warn]"))
      warnings.push(message.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/components/hys-gantt");
  const scene = page.locator("#scene-scrolling"),
    chart = scene.locator(".hys-ui-pg-gantt"),
    port = chart.locator(".hys-ui-pg-scroll"),
    labels = chart.locator(".hys-ui-pg-task-label"),
    rows = chart.locator(".hys-ui-pg-row");
  await labels.first().waitFor();
  const scroll = async (top, left) =>
    port.evaluate(
      async (el, { top, left }) => {
        if (top !== undefined) el.scrollTop = top;
        if (left !== undefined) el.scrollLeft = left;
        await new Promise(requestAnimationFrame);
      },
      { top, left },
    );
  const layout = () =>
    chart.evaluate((el) => {
      const port = el.querySelector(".hys-ui-pg-scroll"),
        root = port.getBoundingClientRect(),
        labels = Array.from(el.querySelectorAll(".hys-ui-pg-task-label")),
        rows = Array.from(el.querySelectorAll(".hys-ui-pg-row")),
        head = el
          .querySelector(".hys-ui-pg-label-head")
          .getBoundingClientRect(),
        months = el.querySelector(".hys-ui-pg-months").getBoundingClientRect(),
        days = el.querySelector(".hys-ui-pg-days").getBoundingClientRect(),
        lastLabel = labels.at(-1)?.getBoundingClientRect(),
        lastRow = rows.at(-1)?.getBoundingClientRect(),
        pane = el.querySelector(".hys-ui-pg-labels").getBoundingClientRect(),
        canvas = el.querySelector(".hys-ui-pg-canvas").getBoundingClientRect();
      return {
        count: rows.length,
        top: port.scrollTop,
        left: port.scrollLeft,
        portHeight: port.offsetHeight,
        clientHeight: port.clientHeight,
        clientWidth: port.clientWidth,
        scrollHeight: port.scrollHeight,
        scrollWidth: port.scrollWidth,
        maxRowShift: Math.max(
          0,
          ...labels.map((label, index) =>
            Math.abs(
              label.getBoundingClientRect().top -
                rows[index].getBoundingClientRect().top,
            ),
          ),
        ),
        maxCenterShift: Math.max(
          0,
          ...labels.map((label, index) => {
            const a = label.getBoundingClientRect(),
              b = rows[index]
                .querySelector(".hys-ui-pg-bar")
                .getBoundingClientRect();
            return Math.abs(a.top + a.height / 2 - b.top - b.height / 2);
          }),
        ),
        lastAligned:
          lastLabel && lastRow
            ? Math.abs(lastLabel.bottom - lastRow.bottom) < 1
            : false,
        lastVisible: lastLabel
          ? lastLabel.top >= root.top + head.height - 1 &&
            lastLabel.bottom <= root.top + port.clientHeight + 1
          : false,
        pinnedLabel: Math.abs(pane.left - root.left) < 1,
        pinnedHeader:
          Math.abs(head.top - root.top) < 1 &&
          Math.abs(months.top - root.top) < 1 &&
          Math.abs(days.top - root.top - 34) < 1,
        calendarAligned:
          Math.abs(months.left - canvas.left) < 1 &&
          Math.abs(days.left - canvas.left) < 1,
        canvasWidth: canvas.width,
        labelWidth: pane.width,
      };
    });
  const choose = async (name, value) => {
    await scene.getByRole("combobox", { name, exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
    await labels.first().waitFor();
  };
  const number = async (name, value) => {
    const input = scene.getByRole("spinbutton", { name, exact: true });
    await input.fill(String(value));
    await input.press("Enter");
  };
  try {
    check(
      "Long Gantt renders every task and timeline row",
      (await labels.count()) === 50 && (await rows.count()) === 50,
    );
    await port.scrollIntoViewIfNeeded();
    let state = await layout();
    check(
      "One bounded scrollport contains both task names and timeline",
      state.portHeight === 420 &&
        state.scrollHeight > state.clientHeight &&
        (await port.locator(".hys-ui-pg-labels").count()) === 1,
    );
    await scroll(900, 0);
    state = await layout();
    check(
      "Vertical scrolling keeps every task name aligned to its row",
      state.top === 900 && state.maxRowShift < 1,
    );
    check(
      "Date headers stay pinned during vertical scrolling",
      state.pinnedHeader,
    );
    check("Task bars remain centered in their rows", state.maxCenterShift <= 1);
    await scroll(undefined, 400);
    state = await layout();
    check(
      "Task names stay fixed while the timeline scrolls horizontally",
      state.left > 0 && state.pinnedLabel,
    );
    check(
      "Date header columns track the timeline horizontally",
      state.calendarAligned && state.pinnedHeader,
    );
    check(
      "Two-axis scrolling does not introduce row drift",
      state.maxRowShift < 1,
    );
    await scroll(100000, undefined);
    state = await layout();
    check(
      "Last task and timeline row are both fully reachable",
      state.lastAligned && state.lastVisible,
    );
    check(
      "Scrollable content has one shared bottom",
      Math.abs(state.scrollHeight - (66 + 50 * 48)) <= 1,
    );
    await chart.screenshot({
      path: "output/playwright/gantt-scroll-bottom.png",
    });
    await scroll(0, 0);
    await port.scrollIntoViewIfNeeded();
    let box = await port.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 120);
    await page.mouse.wheel(0, 240);
    await page.waitForFunction(
      () =>
        document.querySelector("#scene-scrolling .hys-ui-pg-scroll").scrollTop >
        0,
    );
    const overLabels = await layout();
    check(
      "Mouse wheel over task names scrolls the whole chart",
      overLabels.top > 0 && overLabels.maxRowShift < 1,
    );
    box = await port.boundingBox();
    await page.mouse.move(box.x + overLabels.labelWidth + 80, box.y + 120);
    await page.mouse.wheel(0, 240);
    await page.waitForFunction(
      (top) =>
        document.querySelector("#scene-scrolling .hys-ui-pg-scroll").scrollTop >
        top,
      overLabels.top,
    );
    state = await layout();
    check(
      "Mouse wheel over the timeline uses the same vertical position",
      state.top > overLabels.top && state.maxRowShift < 1,
    );
    await port.focus();
    const beforeKey = (await layout()).top;
    await port.press("PageDown");
    await page.waitForFunction(
      (top) =>
        document.querySelector("#scene-scrolling .hys-ui-pg-scroll").scrollTop >
        top,
      beforeKey,
    );
    check(
      "The shared viewport supports keyboard page scrolling",
      (await layout()).maxRowShift < 1,
    );
    await number("甘特图任务行高", 64);
    await scroll(100000, 0);
    state = await layout();
    check(
      "Custom row heights keep names, bars and content bottom aligned",
      state.maxRowShift < 1 &&
        state.maxCenterShift <= 1 &&
        state.lastVisible &&
        Math.abs(state.scrollHeight - (66 + 50 * 64)) <= 1,
    );
    await number("甘特图可视区高度", 720);
    state = await layout();
    check(
      "Explicit heights can exceed the default maximum",
      state.portHeight === 720 && state.maxRowShift < 1,
    );
    await choose("甘特图高度模式", "默认最大高度");
    state = await layout();
    check(
      "Default long charts retain a shared 620px maximum",
      state.portHeight === 620 && state.maxRowShift < 1,
    );
    await number("甘特图可视区高度", 360);
    await choose("甘特图高度模式", "最大高度");
    state = await layout();
    check(
      "Maximum height applies to the whole chart viewport",
      state.portHeight === 360 && state.maxRowShift < 1,
    );
    await choose("甘特图高度模式", "随内容展开");
    state = await layout();
    check(
      "Disabling the height limit expands both sides together",
      state.portHeight === 66 + 50 * 64 &&
        state.scrollHeight === state.clientHeight &&
        state.maxRowShift < 1,
    );
    await choose("甘特图高度模式", "固定高度");
    await number("甘特图任务行高", 48);
    await choose("滚动示例任务数量", "120 项任务");
    await scroll(100000, 0);
    state = await layout();
    check(
      "Large lists share one scroll extent and expose the last row",
      state.count === 120 &&
        state.lastVisible &&
        state.lastAligned &&
        state.maxRowShift < 1,
    );
    await choose("滚动示例任务数量", "19 项任务");
    await scroll(100000, 0);
    state = await layout();
    check(
      "Shrinking the task list clamps scroll position without blank rows",
      state.count === 19 &&
        state.lastVisible &&
        state.lastAligned &&
        state.maxRowShift < 1,
    );
    await labels.last().click();
    check(
      "Selecting the final task highlights its matching bar",
      (await rows.last().locator(".hys-ui-pg-bar.hys-ui-selected").count()) ===
        1,
    );
    await chart.getByRole("radio", { name: "月", exact: true }).click();
    state = await layout();
    check(
      "Month view fills only the space beside the fixed task column",
      Math.abs(state.canvasWidth - (state.clientWidth - state.labelWidth)) <=
        1 && state.scrollWidth <= state.clientWidth + 1,
    );
    check(
      "Changing scale keeps vertical rows aligned",
      state.maxRowShift < 1 && state.pinnedHeader,
    );
    await number("甘特图任务列宽", 320);
    state = await layout();
    check(
      "Timeline fit responds to changes in the task-name width",
      state.labelWidth === 320 &&
        Math.abs(state.canvasWidth - (state.clientWidth - state.labelWidth)) <=
          1,
    );
    await chart.getByRole("radio", { name: "日", exact: true }).click();
    await scroll(100000, 0);
    const beforeToday = (await layout()).top;
    await chart.getByRole("button", { name: "定位今天", exact: true }).click();
    state = await layout();
    check(
      "Locate today preserves vertical position",
      state.top === beforeToday && state.maxRowShift < 1,
    );
    const lastBar = rows.last().locator(".hys-ui-pg-bar");
    await lastBar.scrollIntoViewIfNeeded();
    const dates = (title) => title.match(/\d{4}-\d{2}-\d{2}/g),
      beforeDates = dates(await lastBar.getAttribute("title")),
      barBox = await lastBar.boundingBox();
    await page.mouse.move(
      barBox.x + barBox.width / 2,
      barBox.y + barBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      barBox.x + barBox.width / 2 + 36,
      barBox.y + barBox.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();
    const afterDates = dates(await lastBar.getAttribute("title"));
    check(
      "Dragging a task after scrolling still updates both dates",
      afterDates.every(
        (date, index) =>
          Date.parse(date + "T00:00:00Z") -
            Date.parse(beforeDates[index] + "T00:00:00Z") ===
          86400000,
      ),
    );
    await lastBar.press("Alt+ArrowLeft");
    check(
      "Keyboard rescheduling still works after scrolling",
      JSON.stringify(dates(await lastBar.getAttribute("title"))) ===
        JSON.stringify(beforeDates),
    );
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "深色", exact: true }).click();
    await scroll(100000, undefined);
    state = await layout();
    check(
      "Pinned headers and task names inherit an opaque dark surface",
      (await chart
        .locator(".hys-ui-pg-label-head")
        .evaluate(
          (el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)",
        )) &&
        state.pinnedHeader &&
        state.pinnedLabel,
    );
    await chart.screenshot({ path: "output/playwright/gantt-scroll-dark.png" });
    await page.getByRole("combobox", { name: "文档主题", exact: true }).click();
    await page.getByRole("option", { name: "科技蓝", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await port.scrollIntoViewIfNeeded();
    await scroll(100000, 300);
    state = await layout();
    check(
      "Mobile scrolling keeps labels fixed and rows aligned",
      state.pinnedLabel && state.maxRowShift < 1 && state.lastVisible,
    );
    check(
      "The chart remains within its mobile container",
      await scene
        .locator(".example-stage")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
    );
    await chart.screenshot({
      path: "output/playwright/gantt-scroll-mobile.png",
    });
    await page.setViewportSize({ width: 1680, height: 1000 });
    await scroll(480, 180);
    const cached = await layout();
    await page
      .locator('.docs-sidebar a[href="/components/hys-rating"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysRating" }).waitFor();
    await page
      .locator('.docs-sidebar a[href="/components/hys-gantt"]')
      .evaluate((el) => el.click());
    await page.locator("h1").filter({ hasText: "HysGantt" }).waitFor();
    await port.waitFor();
    state = await layout();
    check(
      "Cached page return preserves Gantt scroll and alignment",
      Math.abs(state.top - cached.top) < 1 &&
        Math.abs(state.left - cached.left) < 1 &&
        state.maxRowShift < 1,
    );
    check(
      "No Gantt runtime errors or Vue warnings",
      errors.length === 0 && warnings.length === 0,
    );
    return { checks, errors, warnings, lastLayout: state };
  } catch (error) {
    throw Error(
      "After " +
        checks.at(-1)?.name +
        ": " +
        error.message +
        "; errors=" +
        JSON.stringify(errors) +
        "; warnings=" +
        JSON.stringify(warnings),
    );
  }
}
