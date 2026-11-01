let latestAudit = { tags: [], events: [] };
const tagsBox = document.getElementById("tagsBox");
const dlBox = document.getElementById("dlBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "TAGASSISTANT_AUDIT" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      latestAudit = res;
      tagsBox.innerHTML = (res.tags || [])
        .map((t) => `<div><strong>${t.type}</strong> (${t.id}) — <span style="color:#34d399">${t.status}</span></div>`)
        .join("");
      dlBox.textContent = JSON.stringify(res.events || [], null, 2);
    } else {
      tagsBox.textContent = "Ready — Open any webpage to inspect GA4, GTM, and Marketing Pixels.";
    }
  });
});

document.getElementById("copyAuditBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(JSON.stringify(latestAudit, null, 2)).catch(() => {});
  }
  document.getElementById("copyAuditBtn").textContent = "✅ Copied Tag & DataLayer JSON!";
});
