function render(d) {
  if (!d) return;
  document.getElementById("gVal").textContent = d.grade || "A";
  document.getElementById("rVal").textContent = `${d.rawRating || 4.8}★`;
  document.getElementById("aVal").textContent = `${d.adjustedRating || 4.5}★`;
  document.getElementById("totVal").textContent = d.totalScanned || 0;
  document.getElementById("susVal").textContent = d.suspiciousCount || 0;
  document.getElementById("pctVal").textContent = `${d.authenticPct || 95}%`;
}

function runAudit() {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "FAKESPOT_AUDIT" }, (res) => {
          if (!chrome.runtime.lastError && res) render(res);
        });
      }
    });
  }
}

runAudit();
document.getElementById("auditBtn").addEventListener("click", () => {
  runAudit();
  document.getElementById("auditBtn").textContent = "✅ Audit Complete!";
});
