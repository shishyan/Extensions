let currentData = { assets: [], hashtags: ["#ai", "#creators", "#reels"], mentions: [] };
const assetsBox = document.getElementById("assetsBox");
const tagsBox = document.getElementById("tagsBox");

function inspectTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "INSTASAVER_INSPECT" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        currentData = res;
        assetsBox.innerHTML = (res.assets || [])
          .map((a, i) => `<div><strong>${i + 1}. [${a.type} ${a.dims}]</strong> ${a.alt}</div>`)
          .join("");
        tagsBox.textContent = [...(res.hashtags || []), ...(res.mentions || [])].join(" ");
      } else {
        assetsBox.textContent = "Ready — Open any social feed or webpage to inspect HD media.";
      }
    });
  });
}

document.getElementById("copyTagsBtn").addEventListener("click", () => {
  const txt = tagsBox.textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyTagsBtn").textContent = "✅ Copied Tags!";
});

document.getElementById("toggle916Btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "INSTASAVER_TOGGLE_916" }, (res) => {
      if (!chrome.runtime.lastError && res) {
        document.getElementById("toggle916Btn").textContent = res.mobileFrameOn ? "📱 9:16 ON" : "📱 9:16 OFF";
      }
    });
  });
});

document.getElementById("copyAssetsBtn").addEventListener("click", () => {
  const urls = (currentData.assets || []).map((a) => a.src).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(urls).catch(() => {});
  }
  document.getElementById("copyAssetsBtn").textContent = "✅ Copied!";
});

inspectTab();
