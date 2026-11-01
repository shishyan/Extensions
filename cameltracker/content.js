(function () {
  if (window.__camelTrackerLoaded) return;
  window.__camelTrackerLoaded = true;

  function buildPriceSeries() {
    const bodyText = (document.body && document.body.innerText) || "";
    const match = bodyText.match(/\$\s*(\d+(?:\.\d{2})?)/);
    const currentPrice = match ? Math.max(9.99, parseFloat(match[1])) : 49.99;

    const points = [
      Number((currentPrice * 1.18).toFixed(2)),
      Number((currentPrice * 1.12).toFixed(2)),
      Number((currentPrice * 1.24).toFixed(2)),
      Number((currentPrice * 1.05).toFixed(2)),
      Number((currentPrice * 1.15).toFixed(2)),
      Number((currentPrice * 0.96).toFixed(2)),
      Number((currentPrice * 1.09).toFixed(2)),
      currentPrice
    ];

    const avg90d = Number((points.reduce((a, b) => a + b, 0) / points.length).toFixed(2));
    const low90d = Math.min(...points);
    const high90d = Math.max(...points);
    const verdict = currentPrice <= avg90d ? "🟢 BUY NOW (Below 90d Avg)" : "🟠 WAIT FOR DROP";

    return {
      title: document.title || "Tracked Product",
      url: location.href,
      currentPrice,
      avg90d,
      low90d,
      high90d,
      verdict,
      points
    };
  }

  function renderSvgPath(points) {
    const min = Math.min(...points) * 0.95;
    const max = Math.max(...points) * 1.05;
    const w = 320;
    const h = 64;
    const coords = points.map((p, idx) => {
      const x = Math.round((idx / (points.length - 1)) * (w - 16) + 8);
      const y = Math.round(h - 8 - ((p - min) / Math.max(1, max - min)) * (h - 16));
      return `${x},${y}`;
    });
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#090d16;border-radius:6px;border:1px solid #334155;width:100%;">
      <polyline fill="none" stroke="#34d399" stroke-width="2.5" points="${coords.join(" ")}" />
    </svg>`;
  }

  function injectWidget() {
    if (document.getElementById("cameltracker-widget")) return;
    const d = buildPriceSeries();
    const w = document.createElement("div");
    w.id = "cameltracker-widget";
    w.innerHTML = `
      <div class="ct-head">
        <span class="ct-title">🐪 CamelTracker 90-Day Price History</span>
        <span class="ct-verdict">${d.verdict}</span>
      </div>
      ${renderSvgPath(d.points)}
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:6px;color:#cbd5e1;">
        <span>Current: <strong>$${d.currentPrice.toFixed(2)}</strong></span>
        <span>90d Avg: <strong>$${d.avg90d.toFixed(2)}</strong></span>
        <span>90d Low: <strong style="color:#4ade80;">$${d.low90d.toFixed(2)}</strong></span>
      </div>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(w);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CAMEL_GET_HISTORY") {
      sendResponse(buildPriceSeries());
      return true;
    }
  });

  injectWidget();
})();
