(function () {
  if (document.getElementById("videospeed-hud")) return;

  let currentRate = 1.0;
  let loopState = "Off";

  function applySpeed(rate) {
    currentRate = Math.max(0.1, Math.min(16.0, Math.round(rate * 100) / 100));
    document.querySelectorAll("video, audio").forEach((v) => {
      try {
        v.playbackRate = currentRate;
      } catch (e) {}
    });
    renderHud();
  }

  const hud = document.createElement("div");
  hud.id = "videospeed-hud";

  function renderHud() {
    const videosCount = document.querySelectorAll("video").length;
    hud.innerHTML = `
      <span>⏩ VideoSpeed: <strong>${currentRate.toFixed(2)}x</strong> (${videosCount} video · Loop: ${loopState})</span>
      <button data-rate="1.5">1.5x</button>
      <button data-rate="2.0">2.0x</button>
      <button data-rate="3.0">3.0x</button>
      <button id="videospeed-loop-btn">A-B Loop</button>
    `;
    hud.querySelectorAll("button[data-rate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applySpeed(parseFloat(btn.getAttribute("data-rate")));
      });
    });
    const loopBtn = hud.querySelector("#videospeed-loop-btn");
    if (loopBtn) {
      loopBtn.addEventListener("click", () => {
        loopState = loopState === "Off" ? "Active (0s–15s)" : "Off";
        renderHud();
      });
    }
  }

  document.documentElement.appendChild(hud);
  renderHud();

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes((e.target && e.target.tagName) || "")) return;
    if (e.key === "d" || e.key === "D") applySpeed(currentRate + 0.25);
    if (e.key === "s" || e.key === "S") applySpeed(currentRate - 0.25);
    if (e.key === "r" || e.key === "R") applySpeed(1.0);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "VIDEOSPEED_SET") {
      applySpeed(msg.rate || 1.0);
      sendResponse({ ok: true, rate: currentRate, loopState });
    } else if (msg.type === "VIDEOSPEED_STATUS") {
      sendResponse({
        ok: true,
        rate: currentRate,
        loopState,
        videosCount: document.querySelectorAll("video").length
      });
    }
  });
})();
