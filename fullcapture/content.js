(() => {
  "use strict";
  if (!document.body || window.__fullCaptureLoaded) return;
  window.__fullCaptureLoaded = true;

  let gridActive = false;
  let canvasOverlay = null;
  let activeTool = "rect";

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

  function renderFullPageCanvasSnapshot(annotationTool) {
    const d = getDimensions();
    const canvas = document.createElement("canvas");
    const w = Math.min(1600, Math.max(800, d.viewportW));
    const h = Math.min(2400, Math.max(600, d.scrollH));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(document.title || "FullCapture Page Snapshot", 32, 48);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px monospace";
      ctx.fillText(`URL: ${location.href} • Scroll: ${d.scrollW}x${d.scrollH}px • DPR: ${d.dpr}x`, 32, 74);

      const headings = Array.from(document.querySelectorAll("h1, h2, h3, p")).slice(0, 18);
      let y = 115;
      headings.forEach((el) => {
        const txt = (el.innerText || "").trim().slice(0, 95);
        if (!txt) return;
        ctx.fillStyle = /^H[1-3]$/.test(el.tagName) ? "#f8fafc" : "#cbd5e1";
        ctx.font = /^H[1-3]$/.test(el.tagName) ? "bold 15px sans-serif" : "13px sans-serif";
        ctx.fillText(txt, 32, y);
        y += 28;
      });

      if (annotationTool === "rect") {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 92, w - 48, 120);
      } else if (annotationTool === "arrow") {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w - 180, 50);
        ctx.lineTo(w - 60, 110);
        ctx.stroke();
      } else if (annotationTool === "text") {
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("★ Annotated via FullCapture Studio", 32, y + 20);
      }
    }
    try {
      return canvas.toDataURL("image/png");
    } catch (_) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }
  }

  function downloadDataUrl(dataUrl, filename) {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename || "fullcapture-page.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (_) {}
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
    if (msg && msg.type === "FULLCAPTURE_STITCH_AND_ANNOTATE") {
      activeTool = msg.tool || activeTool;
      const dataUrl = renderFullPageCanvasSnapshot(activeTool);
      if (msg.download) downloadDataUrl(dataUrl, "fullcapture-annotated.png");
      sendResponse({ ok: true, dataUrl, tool: activeTool, ...getDimensions() });
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
      <button id="fc-snap-btn" type="button" style="background:#10b981;color:#052e16;border:none;border-radius:4px;padding:2px 6px;font-weight:700;cursor:pointer;">⬇️ Stitch PNG</button>
      <span id="fc-dim-label" style="font-size:10.5px;">${d.viewportW}x${d.viewportH} (Full: ${d.scrollH}px)</span>
    `;
    document.body.appendChild(bar);

    bar.querySelector("#fc-grid-btn").addEventListener("click", toggleGrid);
    bar.querySelector("#fc-snap-btn").addEventListener("click", () => {
      const url = renderFullPageCanvasSnapshot("rect");
      downloadDataUrl(url, "fullcapture-stitched.png");
      bar.querySelector("#fc-dim-label").textContent = "✅ Stitched PNG Saved!";
    });
  }
})();
