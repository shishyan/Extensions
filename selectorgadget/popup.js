document.addEventListener("DOMContentLoaded", () => {
  const cssEl = document.getElementById("sg-css");
  const xpathEl = document.getElementById("sg-xpath");
  const pwEl = document.getElementById("sg-pw");
  const matchesEl = document.getElementById("sg-matches");
  const inputEl = document.getElementById("sg-query");
  let currentLoc = { css: "h1", xpath: "//h1", playwright: "page.locator('h1')", matches: 1 };

  function render(loc) {
    if (!loc) return;
    currentLoc = loc;
    cssEl.textContent = `CSS: ${loc.css}`;
    xpathEl.textContent = `XPath: ${loc.xpath}`;
    pwEl.textContent = `Playwright: ${loc.playwright}`;
    matchesEl.textContent = `Matches: ${loc.matches}`;
  }

  function inspect(query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "SELECTORGADGET_INSPECT", query },
          (res) => {
            if (!chrome.runtime.lastError && res && res.locator) {
              render(res.locator);
            } else if (query) {
              render({
                css: query,
                xpath: `//${query}`,
                playwright: `page.locator('${query}')`,
                matches: 1
              });
            }
          }
        );
      }
    });
  }

  inspect("");

  document.getElementById("sg-test-btn").addEventListener("click", () => {
    inspect(inputEl.value.trim() || "h1");
  });

  document.getElementById("sg-copy-btn").addEventListener("click", () => {
    if (navigator.clipboard) navigator.clipboard.writeText(currentLoc.playwright).catch(() => {});
    document.getElementById("sg-copy-btn").textContent = "✅ Copied!";
  });

  document.getElementById("sg-csv-btn").addEventListener("click", () => {
    const csv = `Selector,XPath,Playwright,Matches\n"${currentLoc.css}","${currentLoc.xpath}","${currentLoc.playwright}",${currentLoc.matches}`;
    if (navigator.clipboard) navigator.clipboard.writeText(csv).catch(() => {});
    document.getElementById("sg-csv-btn").textContent = "✅ CSV Exported!";
  });
});
