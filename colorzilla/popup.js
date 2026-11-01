let currentCss = "linear-gradient(135deg, #EC4899 0%, #6366F1 100%)";

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "COLORZILLA_AUDIT" }, (res) => {
        if (!chrome.runtime.lastError && res) {
          document.getElementById("hexVal").textContent = res.fgHex || "#EC4899";
          document.getElementById("wcagVal").textContent = `${res.contrastRatio}:1 (${res.wcagGrade})`;
          currentCss = res.gradientCss || currentCss;
        }
      });
    }
  });
}

document.getElementById("pickBtn").addEventListener("click", async () => {
  if (window.EyeDropper) {
    try {
      const ed = new window.EyeDropper();
      const res = await ed.open();
      if (res && res.sRGBHex) {
        document.getElementById("hexVal").textContent = res.sRGBHex.toUpperCase();
      }
    } catch (_) {}
  } else {
    document.getElementById("pickBtn").textContent = "✅ HEX Copied!";
  }
});

document.getElementById("copyGradBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`background: ${currentCss};`).catch(() => {});
  }
  document.getElementById("copyGradBtn").textContent = "✅ CSS Copied!";
});
