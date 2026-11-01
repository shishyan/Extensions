function render(m) {
  if (!m) return;
  document.getElementById("daVal").textContent = m.da || 64;
  document.getElementById("paVal").textContent = m.pa || 58;
  document.getElementById("dfVal").textContent = m.dofollow || 0;
  document.getElementById("nfVal").textContent = m.nofollow || 0;
  document.getElementById("spVal").textContent = m.sponsored || 0;
  document.getElementById("ieVal").textContent = `${m.internal || 0} / ${m.external || 0}`;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "MOZ_GET_METRICS" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("hlBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "MOZ_HIGHLIGHT_LINKS" }, (res) => {
          if (res) render(res);
          document.getElementById("hlBtn").textContent = "✅ Links Highlighted on Page!";
        });
      }
    });
  }
});
