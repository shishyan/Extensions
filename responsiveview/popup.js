document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("rv-status");

  function sendPreset(name, width, height) {
    chrome.storage.local.set({ responsiveview_preset: { name, width, height } });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "RESPONSIVEVIEW_SET", name, width, height },
          (res) => {
            if (!chrome.runtime.lastError && res && res.ok) {
              statusEl.textContent = `Simulated: ${res.activePreset.name} (${res.activePreset.width}px) · Breakpoint: ${res.breakpoint}`;
            } else {
              statusEl.textContent = `Simulated: ${name} (${width}×${height}px)`;
            }
          }
        );
      } else {
        statusEl.textContent = `Simulated: ${name} (${width}×${height}px)`;
      }
    });
  }

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      sendPreset(
        btn.getAttribute("data-name"),
        parseInt(btn.getAttribute("data-w"), 10),
        parseInt(btn.getAttribute("data-h"), 10)
      );
    });
  });

  document.getElementById("rv-reset").addEventListener("click", () => {
    sendPreset("Reset", 1440, 900);
  });
});
