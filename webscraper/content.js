(function () {
  if (document.getElementById("webscraper-bar")) return;

  let pickerActive = false;

  function extractStructuredData(customSelector = "") {
    const rows = [];
    if (customSelector) {
      try {
        document.querySelectorAll(customSelector).forEach((el, idx) => {
          const txt = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
          const link = el.querySelector("a")?.href || el.href || "";
          if (txt) rows.push({ index: idx + 1, type: customSelector, values: [txt.slice(0, 120), link] });
        });
        if (rows.length > 0) return rows;
      } catch (_) {}
    }

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
    items.slice(0, 25).forEach((el) => {
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

  function renderBar(statusTxt) {
    const rows = extractStructuredData();
    bar.innerHTML = `
      <span>🕷️ WebScraper: <strong>${rows.length}</strong> Rows ${statusTxt ? "· " + statusTxt : ""}</span>
      <button id="webscraper-pick-btn">🎯 Pick Selector</button>
      <button id="webscraper-hl-btn">Highlight</button>
    `;
    bar.querySelector("#webscraper-hl-btn")?.addEventListener("click", () => {
      document.querySelectorAll("table tr, ul li, article, .card").forEach((el) => {
        el.classList.toggle("webscraper-highlight-row");
      });
    });
    bar.querySelector("#webscraper-pick-btn")?.addEventListener("click", () => {
      pickerActive = !pickerActive;
      renderBar(pickerActive ? "Click any element..." : "");
    });
  }

  document.addEventListener("click", (e) => {
    if (!pickerActive || !e.target || e.target.closest("#webscraper-bar")) return;
    e.preventDefault();
    e.stopPropagation();
    pickerActive = false;
    const tag = e.target.tagName.toLowerCase();
    const cls = Array.from(e.target.classList || []).filter((c) => !c.startsWith("webscraper"))[0];
    const sel = cls ? `${tag}.${cls}` : tag;
    document.querySelectorAll(sel).forEach((el) => el.classList.add("webscraper-highlight-row"));
    renderBar(`Selected: ${sel}`);
  }, true);

  document.documentElement.appendChild(bar);
  renderBar();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "WEBSCRAPER_EXTRACT") {
      const rows = extractStructuredData(msg.selector || "");
      sendResponse({ ok: true, count: rows.length, rows });
    } else if (msg.type === "WEBSCRAPER_TOGGLE_PICKER") {
      pickerActive = !pickerActive;
      renderBar(pickerActive ? "Click any element..." : "");
      sendResponse({ ok: true, pickerActive });
    }
  });
})();
