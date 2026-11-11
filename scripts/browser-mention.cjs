async (page) => {
  const origin = page.url().startsWith("http://127.0.0.1:") ? new URL(page.url()).origin : "http://127.0.0.1:5174";
  const url = origin + "/components/hys-mention";
  const checks = [];
  const errors = [];
  const check = (name, pass) => {
    if (!pass) throw new Error(name);
    checks.push(name);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  const scene = (name) => page.locator("#scene-" + name);
  const list = () => page.getByRole("listbox", { name: "提及候选成员" });
  const discovery = scene("discovery").getByRole("combobox");
  await discovery.fill("@zs");
  await list().getByRole("option", { name: /张三/ }).waitFor();
  check("Pinyin initials select one result", (await list().getByRole("option").count()) === 1);
  await discovery.fill("");
  await list().getByRole("option").first().waitFor();
  check("Virtual list keeps a bounded number of options mounted", (await list().getByRole("option").count()) < 35);
  await discovery.press("ArrowUp");
  await list().getByRole("option", { name: /成员 300$/ }).waitFor();
  check("Arrow Up wraps and exposes a mounted active descendant", await discovery.evaluate((input) => {
    const id = input.getAttribute("aria-activedescendant");
    return !!id && document.getElementById(id)?.textContent.includes("成员 300");
  }));
  await discovery.press("Escape");
  await list().waitFor({ state: "hidden" });

  const paging = scene("paging").getByRole("combobox");
  await paging.fill("@");
  await list().getByRole("option", { name: /评审人员 5$/ }).waitFor();
  await list().evaluate((box) => { box.scrollTop = box.scrollHeight; });
  await list().getByRole("option", { name: /评审人员 10$/ }).waitFor();
  check("Scrolling requests another page from both sources", await list().getByRole("option", { name: /研发成员 10$/ }).isVisible());
  await paging.press("Escape");

  const rich = scene("rich");
  const editor = rich.getByRole("combobox");
  await rich.getByRole("button", { name: "插入张三" }).click();
  const entity = editor.locator("[data-mention-entity=zhang]");
  await entity.waitFor();
  check("Rich editor renders atomic Mention nodes", (await entity.getAttribute("contenteditable")) === "false");
  await entity.dblclick();
  await list().getByRole("option", { name: "李娜" }).click();
  await editor.locator("[data-mention-entity=li]").waitFor();
  check("Double-click replaces the original entity", (await entity.count()) === 0);
  await rich.getByRole("button", { name: "撤销", exact: true }).click();
  await entity.waitFor();
  check("Undo restores original entity metadata and text", (await editor.locator("[data-mention-entity=li]").count()) === 0);
  await editor.evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "<img src=x onerror=alert(1)>");
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfer, bubbles: true, cancelable: true }));
  });
  check("Rich paste treats markup as text", (await editor.locator("img").count()) === 0 && (await editor.textContent()).includes("<img"));

  await scene("contexts").getByRole("button", { name: "打开对话框" }).click();
  const dialog = page.getByRole("dialog", { name: "对话框里的提及" });
  const dialogInput = dialog.getByRole("combobox");
  await dialogInput.fill("联系 @");
  await list().getByRole("option", { name: "张三" }).waitFor();
  check("Teleported popup tracks the caret inside a modal", await list().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const field = document.querySelector('[role="dialog"] textarea');
    return !!field && rect.left > field.getBoundingClientRect().left + 10 && rect.right <= innerWidth;
  }));
  await dialogInput.press("Escape");
  await list().waitFor({ state: "hidden" });
  check("Escape closes suggestions before closing the modal", await dialog.isVisible());
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await scene("contexts").getByRole("button", { name: "打开抽屉" }).click();
  const drawer = page.getByRole("dialog", { name: "抽屉里的提及" });
  await drawer.getByRole("combobox").fill("@");
  await drawer.getByRole("listbox").getByRole("option", { name: "李娜" }).click();
  check("Local popup works in the drawer's stacking context", (await drawer.getByRole("combobox").inputValue()) === "@李娜 ");
  await page.keyboard.press("Escape");

  const context = await page.context().browser().newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  });
  try {
    const mobile = await context.newPage();
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.goto(url);
    const input = mobile.locator("#scene-create").getByRole("combobox");
    await input.fill("#移动端");
    const option = mobile.getByRole("option", { name: /移动端/ });
    await option.tap();
    check("A touch tap inserts the new topic and delimiter", (await input.inputValue()) === "【移动端】；");
  } finally {
    await context.close();
  }
  check("No runtime errors", errors.length === 0);
  return { checks, errors };
}
