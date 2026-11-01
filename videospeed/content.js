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

  function skipSeconds(delta) {
    document.querySelectorAll("video, audio").forEach((v) => {
      try {
        v.currentTime = Math.max(0, (v.currentTime || 0) + delta);
      } catch (e) {}
    });
  }

  async function togglePiP() {
    const v = document.querySelector("video");
    if (!v) return false;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return false;
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function captureVideoFramePng() {
    const v = document.querySelector("video");
    const canvas = document.createElement("canvas");
    canvas.width = (v && v.videoWidth) || 1280;
    canvas.height = (v && v.videoHeight) || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (v) {
        try { ctx.drawImage(v, 0, 0, canvas.width, canvas.height); } catch (_) {}
      }
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(12, canvas.height - 42, 340, 30);
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 14px monospace";
      ctx.fillText(`VideoSpeed Frame @ ${currentRate.toFixed(2)}x`, 22, canvas.height - 22);
    }
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-frame-${Date.now()}.png`;
      a.click();
      return url;
    } catch (_) {
      return "";
    }
  }

  const hud = document.createElement("div");
  hud.id = "videospeed-hud";

  function renderHud() {
    const videosCount = document.querySelectorAll("video").length;
    hud.innerHTML = `
      <span>⏩ VideoSpeed: <strong>${currentRate.toFixed(2)}x</strong> (${videosCount} video · Loop: ${loopState})</span>
      <button data-skip="-10">⏪ -10s</button>
      <button data-skip="10">⏩ +10s</button>
      <button data-rate="1.5">1.5x</button>
      <button data-rate="2.0">2.0x</button>
      <button data-rate="4.0">4.0x</button>
      <button id="videospeed-pip-btn">📺 PiP</button>
      <button id="videospeed-snap-btn">📸 Frame</button>
      <button id="videospeed-loop-btn">A-B Loop</button>
    `;
    hud.querySelectorAll("button[data-rate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applySpeed(parseFloat(btn.getAttribute("data-rate")));
      });
    });
    hud.querySelectorAll("button[data-skip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        skipSeconds(parseFloat(btn.getAttribute("data-skip")));
      });
    });
    hud.querySelector("#videospeed-pip-btn")?.addEventListener("click", togglePiP);
    hud.querySelector("#videospeed-snap-btn")?.addEventListener("click", captureVideoFramePng);
    hud.querySelector("#videospeed-loop-btn")?.addEventListener("click", () => {
      loopState = loopState === "Off" ? "Active (0s–15s)" : "Off";
      renderHud();
    });
  }

  document.documentElement.appendChild(hud);
  renderHud();

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes((e.target && e.target.tagName) || "")) return;
    if (e.key === "d" || e.key === "D") applySpeed(currentRate + 0.25);
    if (e.key === "s" || e.key === "S") applySpeed(currentRate - 0.25);
    if (e.key === "r" || e.key === "R") applySpeed(1.0);
    if (e.key === "z" || e.key === "Z") skipSeconds(-10);
    if (e.key === "x" || e.key === "X") skipSeconds(10);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "VIDEOSPEED_SET") {
      applySpeed(msg.rate || 1.0);
      sendResponse({ ok: true, rate: currentRate, loopState });
    } else if (msg.type === "VIDEOSPEED_ACTION") {
      if (msg.action === "skip") skipSeconds(msg.delta || 10);
      if (msg.action === "pip") togglePiP();
      if (msg.action === "frame") captureVideoFramePng();
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
