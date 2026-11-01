document.addEventListener("DOMContentLoaded", () => {
  const cssEl = document.getElementById("sg-css");
  const xpathEl = document.getElementById("sg-xpath");
  const pwEl = document.getElementById("sg-pw");
  const matchesEl = document.getElementById("sg-matches");
  const inputEl = document.getElementById("sg-query");

  function render(loc) {
    if (!loc) return;
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
});
