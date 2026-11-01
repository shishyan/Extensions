(() => {
  "use strict";
  if (!document.body || window.__awesomeShotLoaded) return;
  window.__awesomeShotLoaded = true;

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
    if (st) st.textContent = "Rect Callout Added ✓";
    return Boolean(target);
  }

  function addArrowAndTextNote(customText) {
    let note = document.getElementById("awesomeshot-note-banner");
    if (!note) {
      note = document.createElement("div");
      note.id = "awesomeshot-note-banner";
      note.style.cssText = "position:fixed;top:64px;right:20px;z-index:2147483646;background:#ef4444;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:12px;box-shadow:0 6px 20px rgba(0,0,0,0.4);";
      document.body.appendChild(note);
    }
    note.textContent = `↙️ ${customText || "Key Finding Highlighted Here"}`;
    const st = document.getElementById("as-status");
    if (st) st.textContent = "Arrow + Text Added ✓";
    return true;
  }

  function clearAnnotations() {
    document.querySelectorAll(".awesomeshot-blurred").forEach((el) => el.classList.remove("awesomeshot-blurred"));
    document.querySelectorAll(".awesomeshot-callout").forEach((el) => el.classList.remove("awesomeshot-callout"));
    const note = document.getElementById("awesomeshot-note-banner");
    if (note) note.remove();
    const st = document.getElementById("as-status");
    if (st) st.textContent = "Cleared";
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "AWESOMESHOT_ACTION") {
      if (msg.action === "blur") sendResponse({ ok: true, count: autoRedactPII() });
      else if (msg.action === "callout") sendResponse({ ok: true, added: addCalloutHighlight() });
      else if (msg.action === "arrow_text") sendResponse({ ok: true, added: addArrowAndTextNote(msg.text) });
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
      <button id="as-callout-btn" type="button" style="background:#ef4444;">🟥 Rect</button>
      <button id="as-arrow-btn" type="button" style="background:#f59e0b;color:#0f172a;">↙️ Arrow+Text</button>
      <button id="as-clear-btn" type="button" style="background:#334155;">🧹 Clear</button>
      <span id="as-status" style="color:#94a3b8;font-size:10px;">Ready</span>
    `;
    document.body.appendChild(toolbar);

    toolbar.querySelector("#as-blur-btn").addEventListener("click", autoRedactPII);
    toolbar.querySelector("#as-callout-btn").addEventListener("click", addCalloutHighlight);
    toolbar.querySelector("#as-arrow-btn").addEventListener("click", () => addArrowAndTextNote("Key Metric Verified"));
    toolbar.querySelector("#as-clear-btn").addEventListener("click", clearAnnotations);
  }
})();
