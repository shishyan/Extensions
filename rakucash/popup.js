function runClean() {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RAKU_CLEAN_LINKS" }, (res) => {
          if (!chrome.runtime.lastError && res) {
            document.getElementById("cleanVal").textContent = res.cleanedLinks || 0;
            document.getElementById("paramVal").textContent = res.paramsRemoved || 0;
          }
        });
      }
    });
  }
}

runClean();
document.getElementById("cleanBtn").addEventListener("click", () => {
  runClean();
  document.getElementById("cleanBtn").textContent = "✅ All Page Links Sanitized!";
});
