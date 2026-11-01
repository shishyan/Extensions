(function () {
  if (document.getElementById("selectorgadget-hud")) return;

  function computeCssSelector(el) {
    if (!el || el.nodeType !== 1) return "body";
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const cls = Array.from(el.classList || [])
      .filter((c) => !c.startsWith("selectorgadget") && !c.startsWith("webscraper"))
      .slice(0, 2);
    if (cls.length) return `${tag}.${cls.join(".")}`;
    return tag;
  }

  function computeXPath(el) {
    if (!el || el.nodeType !== 1) return "//body";
    if (el.id) return `//*[@id="${el.id}"]`;
    const tag = el.tagName.toLowerCase();
    return `//${tag}`;
  }

  function buildLocatorReport(el) {
    const target = el || document.querySelector("h1, button, a, table, body") || document.body;
    const css = computeCssSelector(target);
    const xpath = computeXPath(target);
    let matches = 1;
    try {
      matches = document.querySelectorAll(css).length;
    } catch (e) {}
    return {
      css,
      xpath,
      playwright: `page.locator('${css}')`,
      cypress: `cy.get('${css}')`,
      matches
    };
  }

  let currentLocator = buildLocatorReport(document.querySelector("h1, table, a, body"));

  const hud = document.createElement("div");
  hud.id = "selectorgadget-hud";

  function renderHud() {
    hud.innerHTML = `
      <span>🎯 SelectorGadget: <code>${currentLocator.css}</code> · XPath: <code>${currentLocator.xpath}</code> (${currentLocator.matches} match)</span>
    `;
  }

  document.documentElement.appendChild(hud);
  renderHud();

  document.addEventListener(
    "click",
    (e) => {
      if (e.target && e.target.closest && e.target.closest("#selectorgadget-hud")) return;
      currentLocator = buildLocatorReport(e.target);
      renderHud();
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "SELECTORGADGET_INSPECT") {
      if (msg.query) {
        let count = 0;
        try {
          count = document.querySelectorAll(msg.query).length;
        } catch (e) {}
        currentLocator = {
          css: msg.query,
          xpath: `//*[contains(@class, "${msg.query.replace(/^\./, "")}")]`,
          playwright: `page.locator('${msg.query}')`,
          cypress: `cy.get('${msg.query}')`,
          matches: count
        };
        renderHud();
      }
      sendResponse({ ok: true, locator: currentLocator });
    }
  });
})();
