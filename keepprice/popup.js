let currentInfo = null;

function drawSparkline(points) {
  const svg = document.getElementById("sparkline");
  if (!points || !points.length) return;
  const min = Math.min(...points) * 0.96;
  const max = Math.max(...points) * 1.04 || 1;
  const coords = points.map((p, idx) => {
    const x = 12 + (idx / Math.max(1, points.length - 1)) * 306;
    const y = 58 - ((p - min) / Math.max(0.01, max - min)) * 46;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const circles = points.map((p, idx) => {
    const x = 12 + (idx / Math.max(1, points.length - 1)) * 306;
    const y = 58 - ((p - min) / Math.max(0.01, max - min)) * 46;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#38bdf8"><title>$${p}</title></circle>`;
  }).join("");
  svg.innerHTML = `
    <polyline fill="none" stroke="#38bdf8" stroke-width="2.5" points="${coords.join(" ")}" />
    ${circles}
  `;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "KEEPPRICE_ANALYZE" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        currentInfo = res;
        document.getElementById("prodTitle").textContent = res.title;
        document.getElementById("curVal").textContent = "$" + res.current.toFixed(2);
        document.getElementById("lowVal").textContent = "$" + res.low90d.toFixed(2);
        document.getElementById("avgVal").textContent = "$" + (res.avg90d || res.current).toFixed(2);
        document.getElementById("highVal").textContent = "$" + res.high90d.toFixed(2);
        document.getElementById("dealVal").textContent = res.dealScore || "B+ Good Value";
        document.getElementById("ptsCount").textContent = res.points.length + " checkpoints";
        document.getElementById("targetInput").value = (res.current * 0.9).toFixed(2);
        drawSparkline(res.points);
      });
    }
  });
}

document.getElementById("saveAlertBtn").addEventListener("click", () => {
  const target = Number(document.getElementById("targetInput").value || 0);
  if (chrome.storage && chrome.storage.local && currentInfo) {
    chrome.storage.local.get(["keepprice_watches"], (res) => {
      const watches = res.keepprice_watches || [];
      watches.unshift({ url: currentInfo.url, title: currentInfo.title, current: currentInfo.current, target, created: Date.now() });
      chrome.storage.local.set({ keepprice_watches: watches.slice(0, 100) }, () => {
        document.getElementById("statusMsg").textContent = `✅ Price drop alert active at $${target.toFixed(2)}!`;
      });
    });
  }
});
