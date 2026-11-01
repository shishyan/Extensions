let lastReport = {
  totalLinks: 4,
  brokenCount: 0,
  topAnchors: [
    { anchor: "Documentation & API Reference", count: 2 },
    { anchor: "GitHub Repository", count: 1 }
  ],
  items: []
};

function renderReport(rep) {
  if (rep && typeof rep.totalLinks === "number") lastReport = rep;
  document.getElementById("totSpan").textContent = `🔗 Total Links: ${lastReport.totalLinks}`;
  document.getElementById("brkSpan").textContent = `⚠️ Broken/Empty: ${lastReport.brokenCount}`;

  const box = document.getElementById("anchorBox");
  const list = lastReport.topAnchors || [];
  if (!list.length) {
    box.innerHTML = `<div style="color:#94a3b8;">No anchor links found on active page.</div>`;
    return;
  }
  box.innerHTML = list
    .map(
      (a) => `
      <div class="row">
        <span style="color:#f1f5f9;">"${a.anchor}"</span>
        <strong style="color:#fb923c;">${a.count}x</strong>
      </div>
    `
    )
    .join("");
}

function triggerScan() {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "AHREF_SCAN_LINKS" }, (res) => {
          if (!chrome.runtime.lastError && res) renderReport(res);
          else renderReport(lastReport);
        });
      } else {
        renderReport(lastReport);
      }
    });
  } else {
    renderReport(lastReport);
  }
}

triggerScan();
document.getElementById("scanBtn").addEventListener("click", triggerScan);

document.getElementById("csvBtn").addEventListener("click", () => {
  const rows = ["Anchor,Href,Domain,Rel,Broken"];
  (lastReport.items || []).forEach((it) => {
    rows.push(`"${String(it.anchor).replace(/"/g, '""')}","${it.href}","${it.domain}","${it.rel}",${it.broken}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ahrefbacklink-anchors.csv";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("csvBtn").textContent = "✅ Exported CSV!";
});
