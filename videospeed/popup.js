document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("vs-status");

  function setSpeed(rate) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "VIDEOSPEED_SET", rate }, (res) => {
          if (!chrome.runtime.lastError && res) {
            statusEl.textContent = `Playback Speed: ${res.rate.toFixed(2)}x | Loop: ${res.loopState}`;
          } else {
            statusEl.textContent = `Playback Speed: ${rate.toFixed(2)}x`;
          }
        });
      }
    });
  }

  document.querySelectorAll("button[data-r]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSpeed(parseFloat(btn.getAttribute("data-r")));
    });
  });
});
