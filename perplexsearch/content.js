/**
 * PerplexSearch — Content Script
 * Injects an In-Page Citation Fact-Checker & Multi-Source Research Card
 */

(() => {
  "use strict";

  if (!document.body) return;

  let card = null;

  function renderCitations(container, data) {
    if (!container || !data) return;
    const citeHtml = (data.citations || [])
      .map(
        (c) => `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:6px 8px;margin-top:5px;">
          <a href="${c.url}" target="_blank" rel="noopener" style="color:#2dd4bf;font-weight:700;text-decoration:none;">[${c.num}] ${c.title}</a>
          <div style="color:#94a3b8;font-size:10.5px;margin-top:2px;">${c.snippet}</div>
        </div>`
      )
      .join("");

    container.innerHTML = `
      <div style="line-height:1.45;color:#e2e8f0;margin-bottom:6px;">${data.synthesis}</div>
      <div style="font-size:10px;font-weight:700;color:#5eead4;">VERIFIED SOURCES:</div>
      ${citeHtml}
    `;
  }

  function ensureCard() {
    if (card && document.body.contains(card)) return card;
    card = document.createElement("div");
    card.id = "perplexsearch-card";
    card.className = "perplexsearch-card";
    card.style.display = "none";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#2dd4bf;font-size:13px;">🧭 PerplexSearch Fact-Check</strong>
        <span id="ps-close" style="cursor:pointer;color:#94a3b8;padding:0 4px;">✕</span>
      </div>
      <div style="display:flex;gap:5px;margin-bottom:8px;">
        <input id="ps-input" type="text" placeholder="Query or fact-check claim..." style="flex:1;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:6px;padding:5px 8px;font-size:11px;" />
        <button id="ps-go-btn" type="button" style="background:#14b8a6;color:#042f2e;border:none;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:800;cursor:pointer;">Cite</button>
      </div>
      <div id="ps-body">Synthesizing citations…</div>
    `;
    document.body.appendChild(card);

    card.querySelector("#ps-close").addEventListener("click", () => {
      card.style.display = "none";
    });

    card.querySelector("#ps-go-btn").addEventListener("click", () => {
      const q = card.querySelector("#ps-input").value.trim() || document.title;
      runFactCheck(q);
    });

    return card;
  }

  function runFactCheck(queryText) {
    const c = ensureCard();
    c.style.display = "block";
    const input = c.querySelector("#ps-input");
    input.value = queryText;
    const body = c.querySelector("#ps-body");
    body.textContent = "Querying Wikipedia & DuckDuckGo citations…";

    chrome.runtime.sendMessage({ type: "PERPLEX_RESEARCH", query: queryText }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        renderCitations(body, res);
      }
    });
  }

  let fab = document.getElementById("perplexsearch-fab");
  if (!fab) {
    fab = document.createElement("div");
    fab.id = "perplexsearch-fab";
    fab.className = "perplexsearch-fab";
    fab.title = "PerplexSearch: Click for Instant Citation-Backed Fact Check";
    fab.textContent = "🧭 Cite & Fact-Check";
    fab.addEventListener("click", () => {
      const sel = String(window.getSelection ? window.getSelection() : "").trim();
      const defaultTopic = sel || (document.querySelector("h1")?.innerText || document.title || "Artificial intelligence").trim().slice(0, 60);
      runFactCheck(defaultTopic);
    });
    document.body.appendChild(fab);
  }
})();
