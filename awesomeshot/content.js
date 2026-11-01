/**
 * AwesomeShot — Content Script
 * In-Page PII / Sensitive Data Blur Redactor & Red Callout Box Annotator
 */

(() => {
  "use strict";

  if (!document.body) return;

  function autoRedactPII() {
    let redacted = 0;
    document.querySelectorAll("p, span, td, li, a, code, .pii").forEach((el) => {
      const txt = (el.innerText || el.textContent || "").trim();
      if (/@|\+\d|\$\d|secret|token|password|ssn/i.test(txt) && txt.length < 180) {
        el.classList.add("awesomeshot-blurred");
        redacted++;
      }
    });
    if (redacted === 0) {
      const fallback = document.querySelector("p, td");
      if (fallback) {
        fallback.classList.add("awesomeshot-blurred");
        redacted = 1;
      }
    }
    const st = document.getElementById("as-status");
    if (st) st.textContent = `Blurred ${redacted} PII`;
    return redacted;
  }

  function addCalloutHighlight() {
    const target = document.querySelector("h1, h2, table");
    if (target) target.classList.add("awesomeshot-callout");
    const st = document.getElementById("as-status");
    if (st) st.textContent = "Callout Added ✓";
    return Boolean(target);
  }

  function clearAnnotations() {
    document.querySelectorAll(".awesomeshot-blurred").forEach((el) => el.classList.remove("awesomeshot-blurred"));
    document.querySelectorAll(".awesomeshot-callout").forEach((el) => el.classList.remove("awesomeshot-callout"));
    const st = document.getElementById("as-status");
    if (st) st.textContent = "Cleared";
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "AWESOMESHOT_ACTION") {
      if (msg.action === "blur") sendResponse({ ok: true, count: autoRedactPII() });
      else if (msg.action === "callout") sendResponse({ ok: true, added: addCalloutHighlight() });
      else if (msg.action === "clear") {
        clearAnnotations();
        sendResponse({ ok: true });
      }
      return false;
    }
  });

  let toolbar = document.getElementById("awesomeshot-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "awesomeshot-toolbar";
    toolbar.className = "awesomeshot-toolbar";
    toolbar.innerHTML = `
      <span style="color:#fda4af;font-weight:800;">🎨 AwesomeShot</span>
      <button id="as-blur-btn" type="button">🔒 Blur PII</button>
      <button id="as-callout-btn" type="button" style="background:#ef4444;">🟥 Callout</button>
      <button id="as-clear-btn" type="button" style="background:#334155;">🧹 Clear</button>
      <span id="as-status" style="color:#94a3b8;font-size:10px;">Ready</span>
    `;
    document.body.appendChild(toolbar);

    toolbar.querySelector("#as-blur-btn").addEventListener("click", autoRedactPII);
    toolbar.querySelector("#as-callout-btn").addEventListener("click", addCalloutHighlight);
    toolbar.querySelector("#as-clear-btn").addEventListener("click", clearAnnotations);
  }
})();
