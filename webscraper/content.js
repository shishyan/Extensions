(function () {
  if (document.getElementById("webscraper-bar")) return;

  function extractStructuredData() {
    const rows = [];
    const trs = Array.from(document.querySelectorAll("table tr"));
    if (trs.length > 0) {
      trs.forEach((tr, idx) => {
        const cells = Array.from(tr.querySelectorAll("th, td")).map((c) =>
          (c.innerText || c.textContent || "").trim()
        );
        if (cells.length) rows.push({ index: idx + 1, type: "table-row", values: cells });
      });
    }
    const items = Array.from(document.querySelectorAll("ul li, ol li, article, .card, .item"));
    items.slice(0, 25).forEach((el, idx) => {
      const txt = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
      const link = el.querySelector("a") ? el.querySelector("a").href : "";
      if (txt) {
        rows.push({
          index: rows.length + 1,
          type: el.tagName.toLowerCase(),
          values: [txt.slice(0, 120), link]
        });
      }
    });
    if (rows.length === 0) {
      Array.from(document.querySelectorAll("h1, h2, h3, p")).slice(0, 15).forEach((el, idx) => {
        const txt = (el.innerText || el.textContent || "").trim();
        if (txt) {
          rows.push({ index: idx + 1, type: el.tagName.toLowerCase(), values: [txt.slice(0, 120), ""] });
        }
      });
    }
    return rows;
  }

  const bar = document.createElement("div");
  bar.id = "webscraper-bar";

  function renderBar() {
    const rows = extractStructuredData();
    bar.innerHTML = `
      <span>🕷️ WebScraper: Auto-Detected <strong>${rows.length}</strong> Rows</span>
      <button id="webscraper-hl-btn">Highlight</button>
    `;
    const btn = bar.querySelector("#webscraper-hl-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        document.querySelectorAll("table tr, ul li, article, .card").forEach((el) => {
          el.classList.toggle("webscraper-highlight-row");
        });
      });
    }
  }

  document.documentElement.appendChild(bar);
  renderBar();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "WEBSCRAPER_EXTRACT") {
      const rows = extractStructuredData();
      sendResponse({ ok: true, count: rows.length, rows });
    }
  });
})();
