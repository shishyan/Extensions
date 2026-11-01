let harvested = { domain: "enterprise-ai.io", emails: [], topic: "AI Automation" };
let dripSeq = [];

const emailsBox = document.getElementById("emailsBox");
const dripBox = document.getElementById("dripBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "SNOV_HARVEST" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      harvested = res;
      emailsBox.textContent = (res.emails || []).join(" • ");
      chrome.runtime.sendMessage({ type: "SNOV_BUILD_DRIP", domain: res.domain, topic: res.topic }, (dRes) => {
        if (dRes && dRes.ok) {
          dripSeq = dRes.sequence || [];
          dripBox.textContent = dripSeq.map((s) => `[${s.step}]\nSubject: ${s.subject}\n${s.body}`).join("\n\n---\n\n");
        }
      });
    }
  });
});

document.getElementById("copyDripBtn").addEventListener("click", () => {
  const txt = dripBox.textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyDripBtn").textContent = "✅ Copied 3-Step Drip!";
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const csv = ["Email,Domain", ...(harvested.emails || []).map((e) => `${e},${harvested.domain}`)].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ Copied CSV!";
});
