document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("rv-status");
  const wInput = document.getElementById("rv-w");
  const hInput = document.getElementById("rv-h");

  function getTailwindBp(w) {
    if (w < 640) return "xs (<640px)";
    if (w < 768) return "sm (≥640px)";
    if (w < 1024) return "md (≥768px)";
    if (w < 1280) return "lg (≥1024px)";
    if (w < 1536) return "xl (≥1280px)";
    return "2xl (≥1536px)";
  }

  function applyDevice(deviceName, width, height) {
    wInput.value = width;
    hInput.value = height;
    const bp = getTailwindBp(width);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "RESPONSIVEVIEW_SET", deviceName, width, height },
          () => {
            status.textContent = `Simulated: ${deviceName} (${width}×${height}px) · Breakpoint: ${bp}`;
          }
        );
      } else {
        status.textContent = `Simulated: ${deviceName} (${width}×${height}px) · Breakpoint: ${bp}`;
      }
    });
  }

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const deviceName = btn.getAttribute("data-name");
      const width = parseInt(btn.getAttribute("data-w"), 10);
      const height = parseInt(btn.getAttribute("data-h"), 10);
      applyDevice(deviceName, width, height);
    });
  });

  document.getElementById("rv-custom").addEventListener("click", () => {
    const w = parseInt(wInput.value, 10) || 393;
    const h = parseInt(hInput.value, 10) || 852;
    applyDevice("Custom Viewport", w, h);
  });

  document.getElementById("rv-rotate").addEventListener("click", () => {
    const w = parseInt(wInput.value, 10) || 393;
    const h = parseInt(hInput.value, 10) || 852;
    applyDevice("Rotated Viewport", h, w);
  });

  document.getElementById("rv-reset").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RESPONSIVEVIEW_RESET" }, () => {
          status.textContent = "Reset to Native Full-Width Viewport";
        });
      }
    });
  });
});