function formatSec(s) {
  const sec = Math.max(0, Number(s) || 145);
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["sponsorblock_saved_sec"], (res) => {
    document.getElementById("savedTxt").textContent = formatSec(res.sponsorblock_saved_sec || 145);
  });
}

document.getElementById("skipBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SPONSOR_SKIP", seconds: 15 }, (res) => {
          if (res && res.savedSeconds) {
            document.getElementById("savedTxt").textContent = formatSec(res.savedSeconds);
          }
        });
      }
    });
  }
  document.getElementById("skipBtn").textContent = "✅ Skipped +15s!";
});

document.getElementById("cleanBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SPONSOR_DECLICKBAIT" }, (res) => {
          document.getElementById("cleanBtn").textContent = `✅ Cleaned (${(res && res.cleaned) || 1})`;
        });
      }
    });
  }
});
