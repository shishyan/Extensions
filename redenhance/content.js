/**
 * RedEnhance — Content Script
 * High-Signal Discussion Enhancer: Filter by High-Signal, Links, or Code + Thread Markdown Exporter
 */

(() => {
  "use strict";

  if (!document.body) return;

  function collectComments(filter = "all") {
    const blocks = Array.from(
      document.querySelectorAll("shreddit-comment, .comment, .thing, article, blockquote, li, p")
    ).filter((el) => (el.innerText || "").trim().length > 20);

    const results = [];
    blocks.forEach((el) => {
      const txt = (el.innerText || el.textContent || "").trim();
      const hasLink = Boolean(el.querySelector("a[href]")) || /https?:\/\//i.test(txt);
      const hasCode = Boolean(el.querySelector("pre, code")) || /const |function |import |def /i.test(txt);
      const isSignal = txt.length > 75 || /\d+%|\$\d+|benchmark|solution|fixed/i.test(txt);

      const match =
        filter === "all" ||
        (filter === "signal" && isSignal) ||
        (filter === "links" && hasLink) ||
        (filter === "code" && hasCode);

      if (match) {
        el.classList.add("redenhance-highlight");
        results.push({
          text: txt.slice(0, 200),
          hasLink,
          hasCode,
          isSignal
        });
      } else {
        el.classList.remove("redenhance-highlight");
      }
    });

    const status = document.getElementById("re-status");
    if (status) {
      status.textContent = `${results.length} matched (${filter})`;
    }

    return results.slice(0, 20);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "REDENHANCE_FILTER") {
      const items = collectComments(msg.filter || "signal");
      sendResponse({ ok: true, items, title: document.title || location.href });
      return false;
    }
  });

  let bar = document.getElementById("redenhance-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "redenhance-bar";
    bar.className = "redenhance-bar";
    bar.innerHTML = `
      <span style="color:#f87171;font-weight:800;">🛡️ RedEnhance</span>
      <button id="re-sig-btn" type="button">🎯 High-Signal</button>
      <button id="re-lnk-btn" type="button" style="background:#334155;">🔗 With Links</button>
      <button id="re-cod-btn" type="button" style="background:#334155;">💻 With Code</button>
      <span id="re-status" style="color:#94a3b8;font-size:10px;">Ready</span>
    `;
    document.body.appendChild(bar);

    bar.querySelector("#re-sig-btn").addEventListener("click", () => collectComments("signal"));
    bar.querySelector("#re-lnk-btn").addEventListener("click", () => collectComments("links"));
    bar.querySelector("#re-cod-btn").addEventListener("click", () => collectComments("code"));
  }
})();
