(() => {
  if (document.getElementById("clocktime-pill")) return;

  let localState = {
    running: false,
    elapsedSeconds: 0,
    hourlyRate: 120,
    projectName: document.title ? document.title.slice(0, 28) : "Client Web Sprint",
    startedAt: null,
    logs: []
  };

  function formatMMSS(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return String(mins).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
  }

  function calcBillable(sec, rate) {
    return ((sec / 3600) * rate).toFixed(2);
  }

  const pill = document.createElement("div");
  pill.id = "clocktime-pill";
  pill.innerHTML = `
    <span class="ct-status" id="clocktime-readout">⏱️ 00:00 • $0.00 Billable</span>
    <button type="button" id="clocktime-toggle-btn">▶ Start</button>
  `;
  document.body.appendChild(pill);

  const readoutEl = document.getElementById("clocktime-readout");
  const toggleBtn = document.getElementById("clocktime-toggle-btn");

  function renderPill() {
    let totalSec = localState.elapsedSeconds || 0;
    if (localState.running && localState.startedAt) {
      totalSec += Math.max(0, Math.floor((Date.now() - localState.startedAt) / 1000));
    }
    const mmss = formatMMSS(totalSec);
    const earned = calcBillable(totalSec, localState.hourlyRate || 120);
    readoutEl.textContent = `⏱️ ${mmss} • $${earned} Billable`;
    toggleBtn.textContent = localState.running ? "⏹ Stop" : "▶ Start";
  }

  function syncState() {
    try {
      chrome.storage.local.set({ clocktime_state: localState });
    } catch (e) {}
  }

  try {
    chrome.storage.local.get({ clocktime_state: null }, (data) => {
      if (data && data.clocktime_state) {
        localState = Object.assign(localState, data.clocktime_state);
        renderPill();
      }
    });
  } catch (e) {}

  toggleBtn.addEventListener("click", () => {
    if (!localState.running) {
      localState.running = true;
      localState.startedAt = Date.now();
    } else {
      const delta = localState.startedAt ? Math.max(1, Math.floor((Date.now() - localState.startedAt) / 1000)) : 60;
      localState.elapsedSeconds = (localState.elapsedSeconds || 0) + delta;
      localState.running = false;
      localState.startedAt = null;
      const earned = calcBillable(localState.elapsedSeconds, localState.hourlyRate || 120);
      localState.logs = [
        {
          project: localState.projectName || "Client Web Sprint",
          durationSec: localState.elapsedSeconds,
          rate: localState.hourlyRate || 120,
          earned,
          date: "2026-11-01"
        },
        ...(localState.logs || []).slice(0, 19)
      ];
    }
    syncState();
    renderPill();
  });

  setInterval(() => {
    if (localState.running) renderPill();
  }, 1000);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CLOCKTIME_TOGGLE") {
      toggleBtn.click();
      sendResponse({ ok: true, state: localState, readout: readoutEl.textContent });
      return true;
    }
    if (msg && msg.type === "CLOCKTIME_STATUS") {
      sendResponse({ ok: true, state: localState, readout: readoutEl.textContent });
      return true;
    }
  });
})();
