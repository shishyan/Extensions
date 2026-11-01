/**
 * FullCapture — Content Script
 * Full-Page Dimension Inspector, 16px Design Grid Overlay & Screenshot Trigger
 */

(() => {
  "use strict";

  if (!document.body) return;

  let gridActive = false;

  function getDimensions() {
    const docEl = document.documentElement;
    return {
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      scrollW: docEl.scrollWidth || window.innerWidth,
      scrollH: docEl.scrollHeight || window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      gridActive
    };
  }

  function toggleGrid() {
    gridActive = !gridActive;
    document.body.classList.toggle("fullcapture-grid-overlay", gridActive);
    const status = document.getElementById("fc-dim-label");
    if (status) {
      const d = getDimensions();
      status.textContent = gridActive
        ? `📐 Grid ON (${d.scrollW}x${d.scrollH}px)`
        : `${d.viewportW}x${d.viewportH} (Full: ${d.scrollH}px)`;
    }
    return gridActive;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "FULLCAPTURE_METRICS") {
      sendResponse({ ok: true, ...getDimensions() });
      return false;
    }
    if (msg && msg.type === "FULLCAPTURE_TOGGLE_GRID") {
      sendResponse({ ok: true, gridActive: toggleGrid() });
      return false;
    }
  });

  let bar = document.getElementById("fullcapture-bar");
  if (!bar) {
    const d = getDimensions();
    bar = document.createElement("div");
    bar.id = "fullcapture-bar";
    bar.className = "fullcapture-bar";
    bar.innerHTML = `
      <span>📸 FullCapture</span>
      <button id="fc-grid-btn" type="button">📐 16px Grid</button>
      <span id="fc-dim-label" style="font-size:10.5px;">${d.viewportW}x${d.viewportH} (Full: ${d.scrollH}px)</span>
    `;
    document.body.appendChild(bar);

    bar.querySelector("#fc-grid-btn").addEventListener("click", toggleGrid);
  }
})();
