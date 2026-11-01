/**
 * SiderChat — Content Script
 * Split-Screen Reading Copilot, Multi-Heading Deep Reader & Citation/Stats/Code Extractor
 */

(() => {
  "use strict";

  function analyzeDeepPage(filterQuery = "") {
    const q = (filterQuery || "").trim().toLowerCase();

    // 1. Interactive Outline (H1, H2, H3)
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((el, idx) => ({
        index: idx,
        tag: el.tagName,
        text: (el.innerText || el.textContent || "").trim()
      }))
      .filter((h) => h.text.length > 1 && (!q || h.text.toLowerCase().includes(q)));

    // 2. Citations, Numbers & Statistics
    const paras = Array.from(document.querySelectorAll("p, li, blockquote"))
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter((t) => t.length > 25);

    const statsAndCitations = paras
      .filter((p) => {
        const hasStat = /\b\d+(?:\.\d+)?%|\$\d+|\b(?:19|20)\d{2}\b|\[\d+\]|et al\.|study|report|survey|metric/i.test(p);
        return hasStat && (!q || p.toLowerCase().includes(q));
      })
      .slice(0, 15);

    // 3. Code Blocks & Technical Snippets
    const codeBlocks = Array.from(document.querySelectorAll("pre, code"))
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter((c) => c.length > 10 && (!q || c.toLowerCase().includes(q)))
      .slice(0, 12);

    const allWords = ((document.body && (document.body.innerText || document.body.textContent)) || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return {
      title: document.title || "Untitled Document",
      url: location.href,
      wordCount: allWords,
      headings: headings.length
        ? headings.slice(0, 20)
        : [{ index: 0, tag: "H1", text: document.title || "Main Document Section" }],
      stats: statsAndCitations.length
        ? statsAndCitations
        : paras.slice(0, 5).length
        ? paras.slice(0, 5)
        : [`Document "${document.title || location.hostname}" analyzed (${allWords} words).`],
      codeBlocks: codeBlocks.length
        ? codeBlocks
        : ["// No <pre>/<code> blocks found on this page."]
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SIDER_ANALYZE") {
      sendResponse({ ok: true, ...analyzeDeepPage(msg.query || "") });
      return false;
    }
    if (msg && msg.type === "SIDER_TOGGLE_SPLIT") {
      toggleSplitPane();
      sendResponse({ ok: true });
      return false;
    }
  });

  if (!document.body) return;

  let fab = document.getElementById("siderchat-fab");
  if (!fab) {
    fab = document.createElement("div");
    fab.id = "siderchat-fab";
    fab.className = "siderchat-fab";
    fab.title = "SiderChat: Toggle Split-Screen Reading Copilot & Outline";
    fab.textContent = "📖 Sider Reader";
    document.body.appendChild(fab);
  }

  let splitPane = null;
  let activeTab = "outline";

  function renderPaneList(container, data) {
    if (!container) return;
    if (activeTab === "outline") {
      container.innerHTML = data.headings
        .map(
          (h) =>
            `<div style="padding:6px 8px;border-bottom:1px solid #1e293b;cursor:pointer;padding-left:${
              h.tag === "H3" ? 20 : h.tag === "H2" ? 12 : 4
            }px;"><span style="color:#22d3ee;font-size:10px;font-weight:700;">${h.tag}</span> ${h.text.slice(0, 110)}</div>`
        )
        .join("");
    } else if (activeTab === "stats") {
      container.innerHTML = data.stats
        .map(
          (s) =>
            `<div style="padding:7px 8px;background:#0f172a;border:1px solid #1e293b;border-radius:6px;margin-bottom:6px;">📊 ${s.slice(
              0,
              200
            )}</div>`
        )
        .join("");
    } else {
      container.innerHTML = data.codeBlocks
        .map(
          (c) =>
            `<pre style="padding:7px 8px;background:#0f172a;border:1px solid #1e293b;border-radius:6px;margin-bottom:6px;overflow-x:auto;font-size:10.5px;color:#67e8f9;">${c
              .slice(0, 260)
              .replace(/</g, "&lt;")}</pre>`
        )
        .join("");
    }
  }

  function ensureSplitPane() {
    if (splitPane && document.body.contains(splitPane)) return splitPane;
    const data = analyzeDeepPage("");
    splitPane = document.createElement("div");
    splitPane.id = "siderchat-split-pane";
    splitPane.className = "siderchat-split-pane";
    splitPane.style.display = "none";

    splitPane.innerHTML = `
      <div class="sc-hdr">
        <span>📖 SiderChat Deep Reader</span>
        <span id="sc-close" style="cursor:pointer;color:#94a3b8;padding:0 4px;">✕</span>
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-top:6px;">
        <strong>${data.headings.length}</strong> Headings • <strong>${data.stats.length}</strong> Citations/Stats • <strong>${data.wordCount}</strong>w
      </div>
      <input id="sc-filter" type="text" placeholder="Filter outline, citations, or code..." style="width:100%;margin-top:8px;padding:6px 8px;background:#0f172a;color:#fff;border:1px solid #1e293b;border-radius:6px;font-size:11.5px;box-sizing:border-box;" />
      <div class="sc-tabs">
        <button class="sc-tab active" data-tab="outline">📑 Outline</button>
        <button class="sc-tab" data-tab="stats">📊 Stats/Cite</button>
        <button class="sc-tab" data-tab="code">💻 Code</button>
      </div>
      <div id="sc-content" style="flex:1;overflow-y:auto;font-size:11.5px;line-height:1.45;"></div>
    `;

    document.body.appendChild(splitPane);

    const contentEl = splitPane.querySelector("#sc-content");
    const filterEl = splitPane.querySelector("#sc-filter");
    renderPaneList(contentEl, data);

    splitPane.querySelector("#sc-close").addEventListener("click", () => {
      splitPane.style.display = "none";
    });

    splitPane.querySelectorAll(".sc-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        splitPane.querySelectorAll(".sc-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTab = btn.getAttribute("data-tab") || "outline";
        renderPaneList(contentEl, analyzeDeepPage(filterEl.value));
      });
    });

    filterEl.addEventListener("input", () => {
      renderPaneList(contentEl, analyzeDeepPage(filterEl.value));
    });

    return splitPane;
  }

  function toggleSplitPane() {
    const pane = ensureSplitPane();
    pane.style.display = pane.style.display === "none" ? "flex" : "none";
  }

  fab.addEventListener("click", toggleSplitPane);
})();
