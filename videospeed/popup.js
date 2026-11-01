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

  function sendAct(action, delta, label) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "VIDEOSPEED_ACTION", action, delta }, () => {
          statusEl.textContent = label;
        });
      }
    });
  }

  document.querySelectorAll("button[data-r]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSpeed(parseFloat(btn.getAttribute("data-r")));
    });
  });

  document.getElementById("vs-rew").addEventListener("click", () => sendAct("skip", -10, "⏪ Rewound 10 seconds"));
  document.getElementById("vs-fwd").addEventListener("click", () => sendAct("skip", 10, "⏩ Skipped forward 10 seconds"));
  document.getElementById("vs-pip").addEventListener("click", () => sendAct("pip", 0, "📺 Toggled Picture-in-Picture (PiP)"));
  document.getElementById("vs-frame").addEventListener("click", () => sendAct("frame", 0, "📸 Captured Video Frame PNG!"));
});
