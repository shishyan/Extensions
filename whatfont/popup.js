let selectedFont = "Inter";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "WHATFONT_INSPECT" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      document.getElementById("hFont").textContent = `${res.headingFont} — ${res.headingSize} (${res.headingWeight})`;
      document.getElementById("bFont").textContent = `${res.bodyFont} — ${res.bodySize} (Line ${res.bodyLineHeight})`;
    }
  });
});

document.querySelectorAll(".p-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedFont = btn.getAttribute("data-font") || "Inter";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "WHATFONT_APPLY", font: selectedFont }, () => {
        document.getElementById("hFont").textContent = `${selectedFont} (Live Applied ✓)`;
      });
    });
  });
});

document.getElementById("copyImportBtn").addEventListener("click", () => {
  const css = `@import url('https://fonts.googleapis.com/css2?family=${selectedFont.replace(/\s+/g, "+")}:wght@400;600;700&display=swap');\nbody { font-family: '${selectedFont}', sans-serif; }`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(css).catch(() => {});
  }
  document.getElementById("copyImportBtn").textContent = "✅ Copied @import CSS!";
});
