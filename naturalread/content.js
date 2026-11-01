/**
 * NaturalRead — Content Script
 * Mouse-Tracking Horizontal ADHD/Dyslexia Focus Reading Ruler + Page Text Extractor for RSVP Speed Reader
 */

(() => {
  "use strict";

  if (!document.body) return;

  let ruler = null;
  let rulerActive = false;

  function ensureRuler() {
    if (ruler && document.body.contains(ruler)) return ruler;
    ruler = document.createElement("div");
    ruler.id = "naturalread-ruler";
    ruler.className = "naturalread-ruler";
    ruler.style.display = "none";
    document.body.appendChild(ruler);
    return ruler;
  }

  function toggleRuler() {
    const r = ensureRuler();
    rulerActive = !rulerActive;
    r.style.display = rulerActive ? "block" : "none";
    const fab = document.getElementById("naturalread-fab");
    if (fab) {
      fab.textContent = rulerActive ? "📏 Ruler ON" : "📏 Focus Ruler";
    }
    return rulerActive;
  }

  document.addEventListener("mousemove", (e) => {
    if (!rulerActive || !ruler) return;
    ruler.style.top = `${Math.max(0, e.clientY - 22)}px`;
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "NATURALREAD_TOGGLE_RULER") {
      const state = toggleRuler();
      sendResponse({ ok: true, rulerActive: state });
      return false;
    }
    if (msg && msg.type === "NATURALREAD_GET_TEXT") {
      const paras = Array.from(document.querySelectorAll("article p, main p, p"))
        .map((p) => (p.innerText || p.textContent || "").trim())
        .filter((t) => t.length > 30);
      const text = paras.join(" ") || (document.body.innerText || "").trim();
      sendResponse({ ok: true, text: text.slice(0, 4000) });
      return false;
    }
  });

  let fab = document.getElementById("naturalread-fab");
  if (!fab) {
    fab = document.createElement("div");
    fab.id = "naturalread-fab";
    fab.className = "naturalread-fab";
    fab.title = "NaturalRead: Toggle ADHD/Dyslexia Focus Reading Ruler";
    fab.textContent = "📏 Focus Ruler";
    fab.addEventListener("click", toggleRuler);
    document.body.appendChild(fab);
  }
})();
