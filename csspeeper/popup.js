const swatchGrid = document.getElementById("swatchGrid");
const cssVarsBox = document.getElementById("cssVarsBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "CSSPEEPER_EXTRACT" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      swatchGrid.innerHTML = (res.palette || [])
        .map(
          (hex) => `
          <div class="swatch" data-hex="${hex}">
            <div class="swatch-color" style="background:${hex};"></div>
            <span>${hex}</span>
          </div>`
        )
        .join("");
      cssVarsBox.textContent = res.cssVars || "";
    }
  });
});

document.getElementById("copyCssBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cssVarsBox.textContent).catch(() => {});
  }
  document.getElementById("copyCssBtn").textContent = "✅ Copied :root CSS Variables!";
});
